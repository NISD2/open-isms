/**
 * Partner agreements. A platform admin offers one (list, create, withdraw) and sends the link; the
 * partner reads it and accepts with name and email on /partner-agreement/[token] (accept).
 *
 * The token is the only credential on the public side, as on /supplier-access: 64 hex characters,
 * so guessing one is not a way in, and the rate limit keeps the endpoint from being a cheap way to
 * try.
 *
 * The admin hands the link out in the partner's reading language. A Czech partner reads a
 * translation of the English offer; the English text is what is stored, accepted and hashed, and
 * the acceptance also records the language read and the hash of the translation shown.
 */
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { Database } from "@/lib/db";
import { isLocaleCode } from "@/lib/locale";
import {
  type PartnerAccessOutcome,
  partnerAccessEntry,
  provisionPartnerAccess,
  revokePartnerAccess,
  untouchedOpenedAccount,
} from "@/lib/partner-contract/access";
import {
  buildPartnerContract,
  PARTNER_CONTRACT_VERSION,
  type PartnerContractReadingLocale,
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
import {
  bindingLocaleFor,
  PARTNER_CONTRACT_READING_LOCALES,
  readingLocalesOf,
  signedReadingOf,
} from "@/lib/partner-contract/reading";
import { rateLimit } from "@/lib/rate-limit";
import { partnerContract, user } from "@/schema";
import { platformAdminProcedure, publicProcedure, router } from "../init";

/**
 * What an admin decides when offering an agreement: the row's own columns, and the language the
 * partner reads it in. The binding language follows from that one (bindingLocaleFor), so the
 * browser never decides which text binds.
 */
const offerInput = createInsertSchema(partnerContract, {
  partnerCompany: (s) => s.trim().min(2),
  partnerContactName: (s) => s.trim().min(1),
  partnerEmail: (s) => s.trim().email(),
  commissionPercent: (s) => s.int().min(1).max(50),
  commissionMonths: (s) => s.int().min(1).max(120),
})
  .pick({
    partnerCompany: true,
    partnerContactName: true,
    partnerEmail: true,
    commissionPercent: true,
    commissionMonths: true,
  })
  .extend({ readerLocale: z.enum(PARTNER_CONTRACT_READING_LOCALES) });

/**
 * The account an offer opened is created in the language its partner was handed the agreement in
 * (provisionPartnerAccess). Accepting from a link in another language moves it to that one, so the
 * mail it gets later follows, while nobody has signed into it: from then on the language is the
 * holder's own choice. An account that existed before the offer keeps its holder's choice
 * throughout. Never throws: only the language is at stake, and the acceptance is saved by now.
 */
const setOpenedAccountLocale = (
  db: Database,
  offer: {
    readonly accessOutcome: PartnerAccessOutcome | null;
    readonly accessUserId: string | null;
  },
  locale: PartnerContractReadingLocale,
): Promise<void> =>
  untouchedOpenedAccount(db, offer)
    .then(async (account) => {
      if (account) await db.update(user).set({ locale }).where(eq(user.id, account.id));
    })
    .catch((err: unknown) =>
      console.error("[partner-contract] account language not set", err),
    );

export const partnerContractRouter = router({
  list: platformAdminProcedure.query(async ({ ctx }) => {
    // The acceptance evidence stays on the row. The text is read only to tell which translations
    // still match it, so a link in each language opens that language.
    const rows = await ctx.db.query.partnerContract.findMany({
      columns: {
        templateVersion: false,
        signerIp: false,
        signerUserAgent: false,
        signedTextSha256: false,
        signedReadingLocale: false,
        signedTranslationSha256: false,
      },
      orderBy: desc(partnerContract.createdAt),
    });
    return {
      canOffer: canOfferPartnerContracts(),
      rows: rows.map(({ token, body, ...row }) => ({
        ...row,
        links: readingLocalesOf({ ...row, body }).map((locale) => ({
          locale,
          url: partnerContractUrl(locale, token),
        })),
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
    const { readerLocale, ...terms } = input;
    const locale = bindingLocaleFor(readerLocale);
    const commissionMonths = terms.commissionMonths ?? null;
    const [row] = await ctx.db
      .insert(partnerContract)
      .values({
        ...terms,
        locale,
        commissionMonths,
        token: randomBytes(32).toString("hex"),
        templateVersion: PARTNER_CONTRACT_VERSION,
        body: buildPartnerContract({ ...terms, locale, commissionMonths }),
        createdByEmail,
      })
      .returning({ id: partnerContract.id, token: partnerContract.token });
    if (!row) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Offer not saved" });
    }
    const access = terms.partnerEmail
      ? await provisionPartnerAccess(
          ctx.db,
          {
            email: terms.partnerEmail,
            name: terms.partnerContactName ?? terms.partnerCompany,
          },
          readerLocale,
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
      url: partnerContractUrl(readerLocale, row.token),
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
        /**
         * The language the page was read in. It only ever picks a language: what is accepted is the
         * stored text, and a translation recorded beside it is rebuilt here as that language's page
         * builds it, never taken from the browser. Absent from a page loaded before it was sent.
         */
        locale: z.string().refine(isLocaleCode).optional(),
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
      // Narrowed to what this offer can be read in, as its page narrows it.
      const reading = signedReadingOf(offer, input.locale ?? offer.locale);
      const [accepted] = await ctx.db
        .update(partnerContract)
        .set({
          signedAt: new Date(),
          signerName: input.name,
          signerEmail: input.email,
          signerIp: ctx.ip === "unknown" ? null : ctx.ip,
          signerUserAgent: ctx.userAgent,
          signedTextSha256: partnerContractSha256(offer.body),
          ...reading,
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
      await setOpenedAccountLocale(ctx.db, offer, reading.signedReadingLocale);
      const { partnerCopySent } = await sendPartnerContractAcceptedMails(
        row,
        reading.signedReadingLocale,
      );
      return { signedAt: row.signedAt, partnerCopySent };
    }),
});
