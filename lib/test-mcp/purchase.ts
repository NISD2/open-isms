import "@/lib/server-guard";
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { isSettled, NIS2_WALK } from "@/lib/durchgang";
import { betweenDays } from "@/lib/platform-admin/users";
import { auditLog, billingAccount, company, invoice, user } from "@/schema";
import { walkStates } from "@/server/trpc/helpers/durchgang";
import { DAY_MS } from "./common";

export const PURCHASE_ACTIONS = [
  "billing.quote",
  "billing.place",
  "team.forwardToManagement",
  "billing.waiveMoneyBack",
  "billing.cancel",
] as const;

export interface PurchaseEvent {
  readonly at: Date;
  readonly action: string;
  readonly userId: string | null;
}

/** An account's first invoice: what an order is (self-serve, or closed by a platform admin). */
export interface PurchaseOrder {
  readonly createdAt: Date;
  readonly createdByUserId: string | null;
  readonly source: "self_serve" | "admin";
}

/**
 * One company's way to an order, read from its events oldest first: how many times a price was
 * looked up, whether the walkthrough's lock was handed up to management and when, who ordered
 * (the account holder, or someone else, which is management the holder invited), and what came
 * after. "Handed up" before the order is the sign that the person could not sign alone.
 */
export function purchasePath(
  events: readonly PurchaseEvent[],
  holderId: string | null,
  order: PurchaseOrder | null,
) {
  const first = (action: string) => events.find((e) => e.action === action);
  const quotes = events.filter((e) => e.action === "billing.quote");
  const forwarded = first("team.forwardToManagement");
  return {
    // Every call of the order step is logged, also one that was refused or failed (the audit row
    // is written after the call, whatever it returned), so these are attempts, not orders.
    priceLookups: quotes.length,
    orderAttempts: events.filter((e) => e.action === "billing.place").length,
    firstPriceLookupAt: quotes[0]?.at ?? null,
    handedUpToManagementAt: forwarded?.at ?? null,
    // The order is the first invoice of the account.
    orderedAt: order?.createdAt ?? null,
    orderedBy: !order
      ? null
      : order.source === "admin"
        ? ("closed by a platform admin" as const)
        : order.createdByUserId === null
          ? // The creator's account was erased, which leaves no one to compare with the holder.
            ("unknown" as const)
          : order.createdByUserId === holderId
            ? ("account holder" as const)
            : ("someone else (management the holder invited)" as const),
    handedUpBeforeOrdering:
      forwarded !== undefined && (order === null || forwarded.at <= order.createdAt),
    daysFromFirstLookupToOrder:
      quotes[0] && order
        ? Math.round(
            ((order.createdAt.getTime() - quotes[0].at.getTime()) / DAY_MS) * 10,
          ) / 10
        : null,
    gaveUpMoneyBack: first("billing.waiveMoneyBack")?.at ?? null,
    cancelledAt: first("billing.cancel")?.at ?? null,
  };
}

/**
 * Companies with any step toward an order in the range (all time when the days are left out), the
 * one with the latest step first, each with its whole path: the days only choose the companies, so
 * a path never loses the price lookup or hand-up that came before the range.
 */
export async function purchasePaths(
  db: DbOrTx,
  o: { fromDay?: string; toDay?: string; limit: number },
) {
  const chosen = await db
    .select({ companyId: auditLog.companyId })
    .from(auditLog)
    .where(
      and(
        inArray(auditLog.action, [...PURCHASE_ACTIONS]),
        isNotNull(auditLog.companyId),
        betweenDays(auditLog.createdAt, o.fromDay, o.toDay),
      ),
    )
    .groupBy(auditLog.companyId)
    .orderBy(desc(sql`max(${auditLog.createdAt})`))
    .limit(o.limit);
  const ids = chosen.flatMap((c) => (c.companyId ? [c.companyId] : []));
  if (ids.length === 0) return { summary: summaryOf([]), companies: [] };

  const rows = await db
    .select({
      companyId: auditLog.companyId,
      companyName: company.name,
      sector: company.sector,
      at: auditLog.createdAt,
      action: auditLog.action,
      userId: auditLog.userId,
      by: user.email,
      handedTo: sql<
        string | null
      >`case when ${auditLog.action} = 'team.forwardToManagement' then ${auditLog.newValue}->>'email' end`,
      holderId: billingAccount.ownerUserId,
      accountId: company.billingAccountId,
      plan: billingAccount.accessLevel,
    })
    .from(auditLog)
    .innerJoin(company, eq(company.id, auditLog.companyId))
    .leftJoin(billingAccount, eq(billingAccount.id, company.billingAccountId))
    .leftJoin(user, eq(user.id, auditLog.userId))
    .where(
      and(
        inArray(auditLog.companyId, ids),
        inArray(auditLog.action, [...PURCHASE_ACTIONS]),
      ),
    )
    .orderBy(auditLog.createdAt);
  const eventsOf = Object.groupBy(rows, (r) => r.companyId ?? "");

  // The original invoices only: a reissue replaces one and keeps its order date.
  const accountIds = [...new Set(rows.flatMap((r) => r.accountId ?? []))];
  const firstInvoices =
    accountIds.length === 0
      ? []
      : await db
          .select({
            accountId: invoice.billingAccountId,
            createdAt: invoice.createdAt,
            createdByUserId: invoice.createdByUserId,
            source: invoice.source,
          })
          .from(invoice)
          .where(
            and(
              inArray(invoice.billingAccountId, accountIds),
              isNull(invoice.replacesInvoiceId),
            ),
          )
          .orderBy(invoice.createdAt);

  const companies = await Promise.all(
    ids.flatMap((id) => {
      const events = eventsOf[id];
      const head = events?.[0];
      if (!events || !head) return [];
      return [
        (async () => {
          const order = firstInvoices.find((i) => i.accountId === head.accountId) ?? null;
          const states = await walkStates(db, id, NIS2_WALK);
          return {
            companyId: id,
            name: head.companyName,
            sector: head.sector,
            plan: head.plan,
            ...purchasePath(events, head.holderId ?? null, order),
            walkthroughItemsSettled: states.filter((s) => isSettled(s.state)).length,
            walkthroughItems: states.length,
            handedUpTo: events.find((e) => e.handedTo)?.handedTo ?? null,
            events: events.map((e) => ({ at: e.at, action: e.action, by: e.by })),
          };
        })(),
      ];
    }),
  );
  return { summary: summaryOf(companies), companies };
}

function summaryOf(
  companies: ReadonlyArray<ReturnType<typeof purchasePath>>,
): Record<string, number> {
  const ordered = companies.filter((c) => c.orderedAt);
  return {
    companies: companies.length,
    lookedAtPrice: companies.filter((c) => c.priceLookups > 0).length,
    handedUpToManagement: companies.filter((c) => c.handedUpToManagementAt).length,
    ordered: ordered.length,
    orderedByAccountHolder: ordered.filter((c) => c.orderedBy === "account holder")
      .length,
    orderedAfterHandUp: ordered.filter((c) => c.handedUpBeforeOrdering).length,
  };
}
