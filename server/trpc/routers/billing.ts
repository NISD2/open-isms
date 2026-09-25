/**
 * Billing: what the open company's account pays, and the one way to order it.
 *
 * Who may do what:
 *   - `status` is for any member, so the page can say why there is no order button.
 *   - Ordering and the invoices are for the account holder (`billing_account.ownerUserId`), the
 *     person who pays. Not for company admins: any member may add an organization and is its
 *     admin, so a company role says nothing about who may put the account on an invoice.
 *   - On top of that, `billingFor` decides: nobody while Qonto is not set up, platform admins
 *     whenever it is, everyone else only with live keys and the `billing` switch on.
 *
 * The account is always the open company's own, read from the session. No procedure takes an
 * account id from the browser, and the one that takes an invoice id checks it belongs to it.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { formatEuro, netCentsFor, orderSchemaWithVatCheck } from "@/lib/billing/order";
import { type OrderingMode, orderingMode } from "@/lib/billing/ordering";
import { billingFor } from "@/lib/billing/ordering-access";
import { findActiveInvoice, placeOrder } from "@/lib/billing/place-order";
import { getInvoice } from "@/lib/billing/qonto";
import { quoteFor } from "@/lib/billing/quote";
import { viesConfigFromEnv } from "@/lib/billing/vies";
import type { DbOrTx } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createPresignedGet } from "@/lib/storage";
import { billingAccount, company, creditNote, invoice } from "@/schema";
import { accountProcedure, router } from "../init";

const accountOf = async (db: DbOrTx, companyId: string) => {
  const [row] = await db
    .select({
      id: billingAccount.id,
      accessLevel: billingAccount.accessLevel,
      ownerUserId: billingAccount.ownerUserId,
      orderCheckSince: billingAccount.orderCheckSince,
    })
    .from(company)
    .innerJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .where(eq(company.id, companyId))
    .limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No billing account." });
  return row;
};

/** The open company's billing account, and only for the person who holds it. */
const payerProcedure = accountProcedure.use(async ({ ctx, next }) => {
  const account = await accountOf(ctx.db, ctx.companyId);
  if (account.ownerUserId !== ctx.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the account holder." });
  }
  return next({ ctx: { ...ctx, account } });
});

const requireOrdering = async (db: DbOrTx, email: string | null | undefined) => {
  const { mode, open } = await billingFor(db, email);
  if (!open || mode.kind === "off") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Ordering is not open." });
  }
  return mode;
};

const limited = (key: string, limit: number) => {
  if (!rateLimit(key, limit, 60_000)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please wait a minute and try again.",
    });
  }
};

/** Qonto's status for an invoice, read live and never stored: it is Qonto's fact, not ours. */
const liveStatus = async (mode: OrderingMode, qontoInvoiceId: string) => {
  if (mode.kind === "off") return null;
  const res = await getInvoice(mode.qonto, qontoInvoiceId);
  return res.ok ? (res.data.client_invoice?.status ?? null) : null;
};

export const billingRouter = router({
  status: accountProcedure.query(async ({ ctx }) => {
    const account = await accountOf(ctx.db, ctx.companyId);
    const { mode, open } = await billingFor(ctx.db, ctx.session.user.email);
    const active = await findActiveInvoice(ctx.db, account.id, new Date());
    const isPayer = account.ownerUserId === ctx.userId;
    return {
      mode: mode.kind,
      open,
      canOrder: open && isPayer && !active && !account.orderCheckSince,
      isPayer,
      /** An earlier order is being checked in Qonto; ordering waits for that. */
      orderPending: account.orderCheckSince !== null,
      accessLevel: account.accessLevel,
      netPrice: formatEuro(netCentsFor(account.accessLevel)),
      activeInvoice: active,
    };
  }),

  /**
   * The price for a VAT number, before ordering. Only the offline check digit can stop the form;
   * what the EU register says only adds a warning (lib/billing/order-gate.ts).
   *
   * Every lookup is filed with the Commission under the seller's VAT number, so this is rate
   * limited per person and open only to someone who may order.
   */
  quote: payerProcedure
    .input(
      z.object({
        vatNumber: z.string().trim().min(2).max(32),
        countryCode: z.string().trim().length(2).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrdering(ctx.db, ctx.session.user.email);
      limited(`billing:quote:${ctx.userId}`, 10);
      return quoteFor({
        ...input,
        netCents: netCentsFor(ctx.account.accessLevel),
        vies: viesConfigFromEnv(env),
      });
    }),

  place: payerProcedure
    .input(
      z.object({
        order: orderSchemaWithVatCheck,
        /** The gross the form showed. Required: nobody orders at a price they did not see. */
        quotedGrossCents: z.number().int().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mode = await requireOrdering(ctx.db, ctx.session.user.email);
      limited(`billing:place:${ctx.userId}`, 3);

      const outcome = await placeOrder({
        db: ctx.db,
        mode,
        billingAccountId: ctx.account.id,
        order: input.order,
        source: "self_serve",
        createdByUserId: ctx.userId,
        invoicePrefix: env.INVOICE_PREFIX,
        vies: viesConfigFromEnv(env),
        expectedGrossCents: input.quotedGrossCents,
        netCentsOverride: null,
      });
      if (outcome.ok) {
        return {
          number: outcome.number,
          gross: formatEuro(outcome.grossCents),
          dueDate: outcome.dueDate,
          periodEnd: outcome.periodEnd,
        };
      }
      switch (outcome.reason) {
        case "already_ordered":
          throw new TRPCError({ code: "CONFLICT", message: outcome.message });
        case "invalid_vat":
          throw new TRPCError({ code: "BAD_REQUEST", message: outcome.message });
        case "no_account":
          throw new TRPCError({ code: "NOT_FOUND", message: outcome.message });
        case "price_changed":
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: outcome.message });
        case "qonto":
          console.error(`[billing] order failed: ${outcome.message}`);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The invoice could not be created. Please try again later.",
          });
        case "qonto_unknown":
        case "order_pending":
          // The client tells the customer not to order again; the operators have been alerted and
          // the account stays blocked until someone clears it (lib/billing/order-check.ts).
          throw new TRPCError({ code: "TIMEOUT", message: outcome.message });
      }
    }),

  invoices: payerProcedure.query(async ({ ctx }) => {
    const { account } = ctx;
    const rows = await ctx.db
      .select({
        id: invoice.id,
        qontoInvoiceId: invoice.qontoInvoiceId,
        number: invoice.number,
        netCents: invoice.netCents,
        vatCents: invoice.vatCents,
        issueDate: invoice.issueDate,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        archivedPdfKey: invoice.archivedPdfKey,
        creditNoteNumber: creditNote.number,
      })
      .from(invoice)
      .leftJoin(creditNote, eq(creditNote.invoiceId, invoice.id))
      .where(eq(invoice.billingAccountId, account.id))
      .orderBy(desc(invoice.issueDate));

    const mode = orderingMode(env);
    return Promise.all(
      rows.map(
        async ({ qontoInvoiceId, archivedPdfKey, netCents, vatCents, ...row }) => ({
          ...row,
          gross: formatEuro(netCents + vatCents),
          hasPdf: archivedPdfKey !== null,
          status: await liveStatus(mode, qontoInvoiceId),
        }),
      ),
    );
  }),

  /** A short-lived download link for our archived copy of one of the account's own invoices. */
  invoicePdf: payerProcedure
    .input(z.object({ invoiceId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { account } = ctx;
      const [row] = await ctx.db
        .select({ key: invoice.archivedPdfKey })
        .from(invoice)
        .where(
          and(eq(invoice.id, input.invoiceId), eq(invoice.billingAccountId, account.id)),
        )
        .limit(1);
      if (!row?.key)
        throw new TRPCError({ code: "NOT_FOUND", message: "No PDF for this invoice." });
      return { url: await createPresignedGet(row.key) };
    }),
});
