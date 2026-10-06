/**
 * Partner agreements. A platform admin offers one (list, create, withdraw) and sends the link; the
 * partner reads it and accepts with name and email on /partner-agreement/[token] (accept).
 *
 * The token is the only credential on the public side, as on /supplier-access: 64 hex characters,
 * so guessing one is not a way in, and the rate limit keeps the endpoint from being a cheap way to
 * try.
 */
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  partnerAccessEntry,
  provisionPartnerAccess,
  revokePartnerAccess,
} from "@/lib/partner-contract/access";
import {
  buildPartnerContract,
  PARTNER_CONTRACT_VERSION,
  partnerContractSha256,
} from "@/lib/partner-contract/document";
import {
  type AcceptedPartnerContract,
  sendPartnerContractAcceptedMails,
} from "@/lib/partner-contract/mail";
import {
  canOfferPartnerContracts,
  partnerContractUrl,
} from "@/lib/partner-contract/offer";
import { rateLimit } from "@/lib/rate-limit";
import { partnerContract } from "@/schema";
import { platformAdminProcedure, publicProcedure, router } from "../init";

/** What an admin decides when offering an agreement: the row's own columns, nothing else. */
const offerInput = createInsertSchema(partnerContract, {
  partnerCompany: (s) => s.trim().min(2),
  partnerContactName: (s) => s.trim().min(1),
  partnerEmail: (s) => s.trim().email(),
  commissionPercent: (s) => s.int().min(1).max(50),
  commissionMonths: (s) => s.int().min(1).max(120),
}).pick({
  locale: true,
  partnerCompany: true,
  partnerContactName: true,
  partnerEmail: true,
  commissionPercent: true,
  commissionMonths: true,
});

export const partnerContractRouter = router({
  list: platformAdminProcedure.query(async ({ ctx }) => {
    // The text and the acceptance evidence stay on the row; the list needs neither.
    const rows = await ctx.db.query.partnerContract.findMany({
      columns: {
        body: false,
        templateVersion: false,
        signerIp: false,
        signerUserAgent: false,
        signedTextSha256: false,
      },
      orderBy: desc(partnerContract.createdAt),
    });
    return {
      canOffer: canOfferPartnerContracts(),
      rows: rows.map(({ token, ...row }) => ({
        ...row,
        url: partnerContractUrl(row.locale, token),
      })),
    };
  }),

  create: platformAdminProcedure.input(offerInput).mutation(async ({ ctx, input }) => {
    if (!canOfferPartnerContracts()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Partner agreements name the company behind nisd2.eu and are offered only there.",
      });
    }
    const createdByEmail = ctx.session.user.email;
    if (!createdByEmail) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No email on the session" });
    }
    const commissionMonths = input.commissionMonths ?? null;
    const [row] = await ctx.db
      .insert(partnerContract)
      .values({
        ...input,
        commissionMonths,
        token: randomBytes(32).toString("hex"),
        templateVersion: PARTNER_CONTRACT_VERSION,
        body: buildPartnerContract({ ...input, commissionMonths }),
        createdByEmail,
      })
      .returning({ id: partnerContract.id, token: partnerContract.token });
    if (!row) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Offer not saved" });
    }
    const access = input.partnerEmail
      ? await provisionPartnerAccess(
          ctx.db,
          {
            email: input.partnerEmail,
            name: input.partnerContactName ?? input.partnerCompany,
          },
          input.locale,
        )
      : null;
    if (access) {
      await ctx.db
        .update(partnerContract)
        .set({ accessOutcome: access.outcome, accessUserId: access.userId })
        .where(eq(partnerContract.id, row.id));
    }
    return {
      id: row.id,
      url: partnerContractUrl(input.locale, row.token),
      accessOutcome: access?.outcome ?? null,
    };
  }),

  /**
   * The access button on the agreement page. The token is the invitation: it sets a first password
   * only for an account this offer created and nobody has signed into (lib/partner-contract/access).
   */
  enter: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .mutation(async ({ ctx, input }) => {
      if (!(await rateLimit(`partner-contract:enter:${ctx.ip}`, 10, 60_000))) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please wait a minute and try again.",
        });
      }
      const offer = await ctx.db.query.partnerContract.findFirst({
        where: eq(partnerContract.token, input.token),
        columns: { withdrawnAt: true, accessOutcome: true, accessUserId: true },
      });
      if (!offer || offer.withdrawnAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No open agreement at this link.",
        });
      }
      return partnerAccessEntry(ctx.db, offer);
    }),

  withdraw: platformAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(partnerContract)
        .set({ withdrawnAt: new Date() })
        .where(
          and(
            eq(partnerContract.id, input.id),
            isNull(partnerContract.signedAt),
            isNull(partnerContract.withdrawnAt),
          ),
        )
        .returning({
          accessOutcome: partnerContract.accessOutcome,
          accessUserId: partnerContract.accessUserId,
        });
      if (!row) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already accepted or withdrawn.",
        });
      }
      await revokePartnerAccess(ctx.db, row);
      return { ok: true };
    }),

  accept: publicProcedure
    .input(
      z.object({
        token: z.string().length(64),
        name: z.string().trim().min(2).max(200),
        email: z.string().trim().email().max(320),
        authority: z.literal(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!(await rateLimit(`partner-contract:accept:${ctx.ip}`, 10, 60_000))) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please wait a minute and try again.",
        });
      }
      const offer = await ctx.db.query.partnerContract.findFirst({
        where: eq(partnerContract.token, input.token),
      });
      if (!offer || offer.withdrawnAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No open agreement at this link.",
        });
      }
      const [accepted] = await ctx.db
        .update(partnerContract)
        .set({
          signedAt: new Date(),
          signerName: input.name,
          signerEmail: input.email,
          signerIp: ctx.ip === "unknown" ? null : ctx.ip,
          signerUserAgent: ctx.userAgent,
          signedTextSha256: partnerContractSha256(offer.body),
        })
        .where(
          and(
            eq(partnerContract.id, offer.id),
            isNull(partnerContract.signedAt),
            isNull(partnerContract.withdrawnAt),
          ),
        )
        .returning();
      if (!accepted?.signedAt || !accepted.signerName || !accepted.signerEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This agreement is already accepted.",
        });
      }
      const row: AcceptedPartnerContract = {
        ...accepted,
        signedAt: accepted.signedAt,
        signerName: accepted.signerName,
        signerEmail: accepted.signerEmail,
      };
      const { partnerCopySent } = await sendPartnerContractAcceptedMails(row);
      return { signedAt: row.signedAt, partnerCopySent };
    }),
});
