import { TRPCError } from "@trpc/server";
import { and, eq, notExists, sql } from "drizzle-orm";
import { advisoryEnrichInput, advisorySubmitInput } from "@/lib/advisory-options";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { advisoryRequestEmail } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/rate-limit";
import { getAppUrl } from "@/lib/utils";
import { advisoryReferral, advisoryRequest } from "@/schema";
import { publicProcedure, router } from "../init";

export const advisoryRouter = router({
  /**
   * Bank the request on the smallest thing that can still be acted on: what it
   * is about, where to reply, and permission to pass it on.
   *
   * Public, because the people worth hearing from are reading a wiki page and
   * have no account. Requiring one would drop most of them, which is the whole
   * reason the mailto this replaces produced nothing countable.
   *
   * Everything else is gathered by `enrich` on the screen that confirms the
   * request arrived. Asking for it here would move those questions in front of
   * the only moment that matters, which is the one where the row is created.
   */
  submit: publicProcedure.input(advisorySubmitInput).mutation(async ({ ctx, input }) => {
    // Public PII ingestion, same exposure as applicability.captureLead.
    if (!rateLimit(`advisory:submit:${ctx.ip}`, 5, 60_000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many submissions. Please wait a minute and try again.",
      });
    }

    const [row] = await db
      .insert(advisoryRequest)
      .values({
        topic: input.topic,
        email: input.email,
        sourcePath: input.sourcePath ?? null,
        requirementCode: input.requirementCode ?? null,
        referrer: input.referrer ?? null,
        locale: input.locale ?? null,
        forwardConsentAt: new Date(),
      })
      .returning({ id: advisoryRequest.id });

    // Alert the operators, but never at the cost of the request itself. The
    // row is already committed above, so a mail failure loses a notification
    // and not the only revenue event this company has.
    const admins = [...getPlatformAdminEmails()];
    if (admins.length > 0) {
      await sendMail({
        emailType: "internal.advisory_request",
        to: admins,
        ...advisoryRequestEmail({
          topic: input.topic,
          email: input.email,
          sourcePath: input.sourcePath ?? null,
          requirementCode: input.requirementCode ?? null,
          adminUrl: `${getAppUrl()}/platform-admin/advisory`,
        }),
      }).catch((err) => console.error("[advisory] Failed to send operator alert:", err));
    }

    return { id: row.id };
  }),

  /**
   * Add the detail a partner firm would rather have, after the request is
   * already saved.
   *
   * Addressed by the row's own id, which the submitter has just been handed and
   * which is a v4 UUID, so it is not enumerable. The clauses below are what
   * keep that from being enough on its own: only the descriptive columns can be
   * written, and only while the request is still ours to annotate. It can
   * neither reach the email, the consent timestamp nor the forwarding fields,
   * so the worst a guessed id achieves is a wrong sector on a row somebody else
   * created.
   */
  enrich: publicProcedure.input(advisoryEnrichInput).mutation(async ({ ctx, input }) => {
    if (!rateLimit(`advisory:enrich:${ctx.ip}`, 10, 60_000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many submissions. Please wait a minute and try again.",
      });
    }

    // Typed as the table's own update shape rather than as a loose bag, so
    // adding a field to the input above cannot quietly write a column that
    // does not exist. Empty strings are dropped alongside undefined: a
    // cleared box means "no answer", not "the answer is blank".
    const { id, ...fields } = input;
    const patch: Partial<typeof advisoryRequest.$inferInsert> = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined && value !== ""),
    );
    if (Object.keys(patch).length === 0) return { ok: true };

    await db
      .update(advisoryRequest)
      .set(patch)
      .where(
        and(
          eq(advisoryRequest.id, id),
          // Derived from the referral rows rather than from a flag on this
          // one. Once a firm has the request, its description is what they
          // were sent, and a public endpoint must not be able to rewrite it
          // underneath them.
          notExists(
            db
              .select({ one: sql`1` })
              .from(advisoryReferral)
              .where(eq(advisoryReferral.requestId, id)),
          ),
        ),
      );

    return { ok: true };
  }),
});
