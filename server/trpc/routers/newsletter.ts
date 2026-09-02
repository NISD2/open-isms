/**
 * Newsletter — platform-admin lifecycle email.
 *
 * Opportunistic bottom-of-funnel email to existing signups. Subscribers ARE
 * the `user` table; there is no separate subscriber model and no separate
 * unsubscribe flow. Eligible recipients are users who have not opted out of
 * follow-up email, whose address is not flagged disposable, and whose email
 * is verified.
 *
 * Reuses existing infra end to end:
 *   - lib/email/unsubscribe.ts   — per-user HMAC one-click unsubscribe URL
 *   - lib/mail/send.ts           — Resend send + List-Unsubscribe header + dev guard
 *   - notification table         — send log feeding platformAdmin.emailActivity
 *
 * Gated by platformAdminProcedure (PLATFORM_ADMIN_EMAILS allowlist), same as
 * the rest of the platform-admin surface.
 */
import { and, count, desc, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getTranslations } from "next-intl/server";
import { router, protectedProcedure, publicProcedure } from "../init";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  newsletterIssue,
  newsletterGroup,
  newsletterGroupMember,
  notification,
  user,
} from "@/schema";
import { renderNewsletterMarkdown } from "@/lib/mail/markdown";
import { sendMail, newsletterEmail } from "@/lib/mail";
import { unsubscribeUrl as buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { getAppUrl } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { getNewsletterCta, NEWSLETTER_CTA_KEYS } from "@/lib/newsletter/cta";
import { mailSupportEmail } from "@/lib/env";

const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isPlatformAdmin(ctx.session?.user.email)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform admin access required" });
  }
  return next({ ctx });
});

// Replies to the broadcast route to a real Workspace mailbox (cory@nisd2.eu),
// configured via env so no real address is committed to the public repo. Set
// NEWSLETTER_REPLY_TO in .env / prod env; falls back to the support inbox.
const REPLY_TO = process.env.NEWSLETTER_REPLY_TO || mailSupportEmail();

// Newsletter sends from a distinct mailbox (e.g. newsletter@nisd2.eu) when
// RESEND_FROM_EMAIL_NEWS is set; otherwise sendMail uses the default
// transactional From (RESEND_FROM_EMAIL, noreply@nisd2.eu). undefined =
// fall back to the default inside sendMail.
const NEWS_FROM_EMAIL = process.env.RESEND_FROM_EMAIL_NEWS;

// Deliverability throttle: blasting dozens of messages in one burst trips
// spam heuristics and provider rate limits. Trickle BURST_SIZE messages per
// BURST_INTERVAL_MS (default ~2/second). Tunable via env without a deploy.
const BURST_SIZE = Math.max(1, Number(process.env.NEWSLETTER_BURST_SIZE) || 2);
const BURST_INTERVAL_MS = Math.max(200, Number(process.env.NEWSLETTER_BURST_INTERVAL_MS) || 1000);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Drizzle WHERE for the eligible-recipient audience. */
const eligibleWhere = and(
  eq(user.emailFollowupsDisabled, false),
  eq(user.isDisposableEmail, false),
  isNotNull(user.emailVerifiedAt),
);

interface Recipient {
  id: string;
  email: string | null;
}

/**
 * Background throttled dispatch. Returns immediately; sends trickle out in
 * bursts so we stay under provider rate limits and spam thresholds. Each
 * recipient gets a per-user HMAC unsubscribe URL (also the List-Unsubscribe
 * header). The dev-block guard in sendMail suppresses real delivery outside
 * production. Runs on a long-lived (standalone) Node server, so the loop
 * survives past the tRPC response.
 */
function dispatchNewsletter(opts: {
  recipients: Recipient[];
  subject: string;
  preheader: string | null;
  bodyHtml: string;
  bodyText: string;
  forwardUrl: string;
  cta: { url: string; label: string } | null;
  viewInBrowserUrl: string | null;
}): void {
  const { recipients, subject, preheader, bodyHtml, bodyText, forwardUrl, cta, viewInBrowserUrl } =
    opts;
  void (async () => {
    for (let i = 0; i < recipients.length; i += BURST_SIZE) {
      const batch = recipients.slice(i, i + BURST_SIZE);
      for (const r of batch) {
        if (!r.email) continue;
        const unsubUrl = buildUnsubscribeUrl(r.id);
        const email = newsletterEmail({
          subject,
          preheader,
          bodyHtml,
          bodyText,
          unsubscribeUrl: unsubUrl,
          forwardUrl,
          cta,
          viewInBrowserUrl,
        });
        sendMail({
          to: r.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          replyTo: REPLY_TO,
          fromEmail: NEWS_FROM_EMAIL,
          unsubscribeUrl: unsubUrl,
        }).catch(() => {});
      }
      if (i + BURST_SIZE < recipients.length) {
        await sleep(BURST_INTERVAL_MS);
      }
    }
  })();
}

/**
 * Build the forward-to-a-friend mailto link. Opens the reader's own mail
 * client with a pre-filled message pointing at the platform — organic,
 * no tracking, no third party.
 */
function buildForwardUrl(subject: string): string {
  const body = `I thought this might be useful:\n\n${getAppUrl()}\n\n`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Public permalink for an issue. */
function issuePermalink(slug: string): string {
  return `${getAppUrl()}/newsletter/${slug}`;
}

/** URL-safe slug from a title: lowercase, non-alphanumerics to hyphens. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

/** Resolve the issue CTA into the absolute URL + English label for the email. */
async function resolveEmailCta(
  ctaKey: string | null,
): Promise<{ url: string; label: string } | null> {
  const cta = getNewsletterCta(ctaKey);
  if (!cta) return null;
  const t = await getTranslations({ locale: "en", namespace: "newsletter" });
  return { url: `${getAppUrl()}${cta.href}`, label: t(cta.labelKey) };
}

const issueInput = z.object({
  subject: z.string().trim().min(1).max(500),
  preheader: z.string().trim().max(500).nullish(),
  bodyMarkdown: z.string().max(50_000),
  slug: z.string().trim().max(200).nullish(),
  ctaKey: z.enum(NEWSLETTER_CTA_KEYS).nullish(),
});

export const newsletterRouter = router({
  /** All issues, newest first, with the target group name (NULL = all eligible). */
  listIssues: platformAdminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: newsletterIssue.id,
        subject: newsletterIssue.subject,
        slug: newsletterIssue.slug,
        status: newsletterIssue.status,
        createdAt: newsletterIssue.createdAt,
        sentAt: newsletterIssue.sentAt,
        publishedAt: newsletterIssue.publishedAt,
        recipientCount: newsletterIssue.recipientCount,
        targetGroupName: newsletterGroup.name,
      })
      .from(newsletterIssue)
      .leftJoin(newsletterGroup, eq(newsletterIssue.targetGroupId, newsletterGroup.id))
      .orderBy(desc(newsletterIssue.createdAt));
  }),

  getIssue: platformAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const issue = await ctx.db.query.newsletterIssue.findFirst({
        where: eq(newsletterIssue.id, input.id),
      });
      if (!issue) throw new TRPCError({ code: "NOT_FOUND" });
      return issue;
    }),

  /** Create a new draft, or update an existing one (drafts only). */
  saveIssue: platformAdminProcedure
    .input(issueInput.extend({ id: z.string().uuid().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Derive the slug from an explicit override, else the subject. Dedupe
      // against other issues so the public permalink stays unique.
      const base = slugify(input.slug?.trim() || input.subject) || "issue";
      let slug = base;
      for (let n = 2; ; n++) {
        const clash = await ctx.db.query.newsletterIssue.findFirst({
          where: input.id
            ? and(eq(newsletterIssue.slug, slug), ne(newsletterIssue.id, input.id))
            : eq(newsletterIssue.slug, slug),
          columns: { id: true },
        });
        if (!clash) break;
        slug = `${base}-${n}`;
      }

      const values = {
        subject: input.subject,
        preheader: input.preheader ?? null,
        bodyMarkdown: input.bodyMarkdown,
        slug,
        ctaKey: input.ctaKey ?? null,
      };

      if (input.id) {
        const existing = await ctx.db.query.newsletterIssue.findFirst({
          where: eq(newsletterIssue.id, input.id),
          columns: { id: true, status: true },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (existing.status === "sent") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A sent issue cannot be edited.",
          });
        }
        await ctx.db
          .update(newsletterIssue)
          .set(values)
          .where(eq(newsletterIssue.id, input.id));
        return { id: input.id };
      }

      const [created] = await ctx.db
        .insert(newsletterIssue)
        .values(values)
        .returning({ id: newsletterIssue.id });
      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Insert returned no rows" });
      }
      return { id: created.id };
    }),

  /**
   * Render the full email HTML for the admin preview. Uses placeholder
   * unsubscribe / forward links — the real per-user URLs are generated at
   * send time. Works for an unsaved draft (subject + body are passed in).
   */
  renderIssuePreview: platformAdminProcedure
    .input(issueInput)
    .mutation(async ({ input }) => {
      const bodyHtml = await renderNewsletterMarkdown(input.bodyMarkdown);
      const email = newsletterEmail({
        subject: input.subject,
        preheader: input.preheader ?? null,
        bodyHtml,
        bodyText: input.bodyMarkdown,
        unsubscribeUrl: `${getAppUrl()}/api/email/unsubscribe?u=PREVIEW&t=PREVIEW`,
        forwardUrl: buildForwardUrl(input.subject),
        cta: await resolveEmailCta(input.ctaKey ?? null),
        viewInBrowserUrl: input.slug ? issuePermalink(slugify(input.slug)) : null,
      });
      return { subject: email.subject, html: email.html };
    }),

  /**
   * Audience breakdown. `eligible` is the real send count; the other buckets
   * are informational and may overlap (a disposable address can also be
   * unverified). `optedOut` is the unsubscribe count — the primary
   * inverse-interest engagement metric, read over time.
   */
  recipientStats: platformAdminProcedure.query(async ({ ctx }) => {
    const [total, eligible, optedOut, disposable, unverified] = await Promise.all([
      ctx.db.select({ count: count() }).from(user),
      ctx.db.select({ count: count() }).from(user).where(eligibleWhere),
      ctx.db
        .select({ count: count() })
        .from(user)
        .where(eq(user.emailFollowupsDisabled, true)),
      ctx.db
        .select({ count: count() })
        .from(user)
        .where(eq(user.isDisposableEmail, true)),
      ctx.db
        .select({ count: count() })
        .from(user)
        .where(isNull(user.emailVerifiedAt)),
    ]);

    return {
      total: total[0]?.count ?? 0,
      eligible: eligible[0]?.count ?? 0,
      optedOut: optedOut[0]?.count ?? 0,
      disposable: disposable[0]?.count ?? 0,
      unverified: unverified[0]?.count ?? 0,
    };
  }),

  /**
   * Send a draft to every eligible user. Each recipient gets their own
   * HMAC unsubscribe URL (also set as the List-Unsubscribe header). Sends
   * are fire-and-forget; the issue is marked sent with the recipient count
   * (the authoritative total). A notification row is logged per recipient
   * that has a company, so platformAdmin.emailActivity stays coherent —
   * the notification table requires a non-null companyId, and many signups
   * have none, so those are sent but not row-logged.
   */
  sendIssue: platformAdminProcedure
    .input(z.object({ id: z.string().uuid(), groupId: z.string().uuid().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const issue = await ctx.db.query.newsletterIssue.findFirst({
        where: eq(newsletterIssue.id, input.id),
      });
      if (!issue) throw new TRPCError({ code: "NOT_FOUND" });
      if (issue.status === "sent") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This issue has already been sent." });
      }
      if (issue.bodyMarkdown.trim().length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot send an empty issue." });
      }

      const groupId = input.groupId ?? null;
      if (groupId) {
        const group = await ctx.db.query.newsletterGroup.findFirst({
          where: eq(newsletterGroup.id, groupId),
          columns: { id: true },
        });
        if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found." });
      }

      // Recipients = eligible users, optionally narrowed to group members.
      // The eligibility gate always applies, so group membership never
      // overrides an unsubscribe / disposable / unverified exclusion.
      const recipients = groupId
        ? await ctx.db
            .select({ id: user.id, email: user.email, companyId: user.companyId })
            .from(user)
            .innerJoin(newsletterGroupMember, eq(newsletterGroupMember.userId, user.id))
            .where(and(eligibleWhere, eq(newsletterGroupMember.groupId, groupId)))
        : await ctx.db
            .select({ id: user.id, email: user.email, companyId: user.companyId })
            .from(user)
            .where(eligibleWhere);

      if (recipients.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No eligible recipients for this audience.",
        });
      }

      const bodyHtml = await renderNewsletterMarkdown(issue.bodyMarkdown);
      const forwardUrl = buildForwardUrl(issue.subject);
      const cta = await resolveEmailCta(issue.ctaKey);
      const viewInBrowserUrl = issuePermalink(issue.slug);
      const now = new Date();

      // Archive a snapshot of exactly what went out (placeholder unsubscribe
      // link, since the real one is per-recipient) so the issue can be
      // reviewed later regardless of template changes.
      const sentHtml = newsletterEmail({
        subject: issue.subject,
        preheader: issue.preheader,
        bodyHtml,
        bodyText: issue.bodyMarkdown,
        unsubscribeUrl: `${getAppUrl()}/api/email/unsubscribe`,
        forwardUrl,
        cta,
        viewInBrowserUrl,
      }).html;

      // Mark sent up front so a second click cannot double-send while the
      // batch is in flight (mirrors the cron's pre-send dedup approach).
      const recipientEmails = recipients
        .map((r) => r.email)
        .filter((e): e is string => Boolean(e));
      await ctx.db
        .update(newsletterIssue)
        .set({
          status: "sent",
          sentAt: now,
          recipientCount: recipients.length,
          targetGroupId: groupId,
          sentHtml,
          recipientEmails,
        })
        .where(eq(newsletterIssue.id, input.id));

      // Log one notification row per company-having recipient, in one batch.
      const loggable = recipients.filter(
        (r): r is typeof r & { companyId: string } => r.companyId !== null,
      );
      if (loggable.length > 0) {
        await ctx.db.insert(notification).values(
          loggable.map((r) => ({
            companyId: r.companyId,
            recipientId: r.id,
            entityType: "newsletter_issue",
            entityId: issue.id,
            triggerField: "newsletter_send",
            subject: issue.subject,
            channel: "email" as const,
            status: "sent" as const,
            scheduledFor: now,
            sentAt: now,
            urgency: "info" as const,
          })),
        );
      }

      // Throttled background dispatch (bursts, ~2/second).
      dispatchNewsletter({
        recipients,
        subject: issue.subject,
        preheader: issue.preheader,
        bodyHtml,
        bodyText: issue.bodyMarkdown,
        forwardUrl,
        cta,
        viewInBrowserUrl,
      });

      await logAudit({
        companyId: null,
        userId: ctx.userId,
        action: "newsletter.send",
        entityType: "newsletter_issue",
        entityId: issue.id,
        description: `Newsletter "${issue.subject}" sent to ${recipients.length} recipients${groupId ? ` (group ${groupId})` : ""}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { recipientCount: recipients.length };
    }),

  /**
   * Send a single test copy to the admin (or an override address), even in
   * production. Does not mark the issue sent, does not log to notification —
   * it is a true preview send. Subject is prefixed [Test]. The unsubscribe
   * link points at the admin's own account so the whole flow is exercisable.
   */
  sendTest: platformAdminProcedure
    .input(issueInput.extend({ testEmail: z.string().email().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const to = input.testEmail?.trim() || ctx.session?.user.email;
      if (!to) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No test recipient address." });
      }
      const bodyHtml = await renderNewsletterMarkdown(input.bodyMarkdown);
      const unsubUrl = buildUnsubscribeUrl(ctx.userId);
      const email = newsletterEmail({
        subject: `[Test] ${input.subject}`,
        preheader: input.preheader ?? null,
        bodyHtml,
        bodyText: input.bodyMarkdown,
        unsubscribeUrl: unsubUrl,
        forwardUrl: buildForwardUrl(input.subject),
        cta: await resolveEmailCta(input.ctaKey ?? null),
        viewInBrowserUrl: input.slug ? issuePermalink(slugify(input.slug)) : null,
      });
      const res = await sendMail({
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: REPLY_TO,
        fromEmail: NEWS_FROM_EMAIL,
        unsubscribeUrl: unsubUrl,
      });
      if (!res.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Test send failed." });
      }
      // res.id === "dev-blocked" when the dev guard suppressed real delivery.
      return { to, devBlocked: res.id === "dev-blocked" };
    }),

  /**
   * Publish or unpublish an issue on the public site (/newsletter/<slug>).
   * Decoupled from sending: allowed on draft and sent issues alike, so the
   * admin can publish at send time, a day later, or never. Unpublishing
   * removes it from the public archive immediately. Default is unpublished,
   * so test/never-published issues never leak publicly.
   */
  setPublished: platformAdminProcedure
    .input(z.object({ id: z.string().uuid(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const issue = await ctx.db.query.newsletterIssue.findFirst({
        where: eq(newsletterIssue.id, input.id),
        columns: { id: true, subject: true, publishedAt: true },
      });
      if (!issue) throw new TRPCError({ code: "NOT_FOUND" });

      const publishedAt = input.published ? (issue.publishedAt ?? new Date()) : null;
      await ctx.db
        .update(newsletterIssue)
        .set({ publishedAt })
        .where(eq(newsletterIssue.id, input.id));

      await logAudit({
        companyId: null,
        userId: ctx.userId,
        action: input.published ? "newsletter.publish" : "newsletter.unpublish",
        entityType: "newsletter_issue",
        entityId: input.id,
        description: `Newsletter "${issue.subject}" ${input.published ? "published to" : "unpublished from"} the public site`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { publishedAt };
    }),

  /**
   * Full subscriber list with per-user email state, newest first. Powers the
   * admin manual opt-in / opt-out table — admins decide who keeps receiving
   * email; the account stays active regardless.
   */
  listSubscribers: platformAdminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        emailFollowupsDisabled: user.emailFollowupsDisabled,
        isDisposableEmail: user.isDisposableEmail,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt));
  }),

  /**
   * Manual opt-out toggle for a single user. Admins decide in the platform
   * whether someone keeps receiving email; the account stays active either
   * way. Unsubscribe = no email at all (the single emailFollowupsDisabled
   * flag, shared with course reminders, by design).
   */
  setEmailOptOut: platformAdminProcedure
    .input(z.object({ userId: z.string().uuid(), disabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.userId),
        columns: { id: true, companyId: true, email: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(user)
        .set({ emailFollowupsDisabled: input.disabled, updatedAt: new Date() })
        .where(eq(user.id, input.userId));

      await logAudit({
        companyId: target.companyId,
        userId: ctx.userId,
        action: input.disabled ? "newsletter.opt_out" : "newsletter.opt_in",
        entityType: "user",
        entityId: input.userId,
        description: `Admin ${input.disabled ? "disabled" : "enabled"} email for ${target.email}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { disabled: input.disabled };
    }),

  // -------------------------------------------------------------------------
  // Groups — named audience segments for targeted campaigns
  // -------------------------------------------------------------------------

  /**
   * All groups with member and eligible counts. `eligibleCount` is what a
   * send to that group actually reaches (members minus opt-outs / disposable
   * / unverified); it drives the send confirmation.
   */
  listGroups: platformAdminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: newsletterGroup.id,
        name: newsletterGroup.name,
        description: newsletterGroup.description,
        createdAt: newsletterGroup.createdAt,
        memberCount: sql<number>`count(${newsletterGroupMember.id})::int`,
        eligibleCount: sql<number>`(count(${newsletterGroupMember.id}) filter (where ${user.emailFollowupsDisabled} = false and ${user.isDisposableEmail} = false and ${user.emailVerifiedAt} is not null))::int`,
      })
      .from(newsletterGroup)
      .leftJoin(newsletterGroupMember, eq(newsletterGroupMember.groupId, newsletterGroup.id))
      .leftJoin(user, eq(user.id, newsletterGroupMember.userId))
      .groupBy(newsletterGroup.id)
      .orderBy(desc(newsletterGroup.createdAt));
  }),

  createGroup: platformAdminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().max(500).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(newsletterGroup)
        .values({ name: input.name, description: input.description ?? null })
        .returning({ id: newsletterGroup.id });
      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Insert returned no rows" });
      }
      return { id: created.id };
    }),

  deleteGroup: platformAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Membership rows cascade; sent issues keep their history (targetGroupId
      // is set null by the FK), so deleting a group is safe.
      await ctx.db.delete(newsletterGroup).where(eq(newsletterGroup.id, input.id));
      return { ok: true };
    }),

  /** User IDs in a group — drives the member checkboxes in the admin UI. */
  groupMemberIds: platformAdminProcedure
    .input(z.object({ groupId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ userId: newsletterGroupMember.userId })
        .from(newsletterGroupMember)
        .where(eq(newsletterGroupMember.groupId, input.groupId));
      return rows.map((r) => r.userId);
    }),

  addGroupMember: platformAdminProcedure
    .input(z.object({ groupId: z.string().uuid(), userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(newsletterGroupMember)
        .values({ groupId: input.groupId, userId: input.userId })
        .onConflictDoNothing({
          target: [newsletterGroupMember.groupId, newsletterGroupMember.userId],
        });
      return { ok: true };
    }),

  removeGroupMember: platformAdminProcedure
    .input(z.object({ groupId: z.string().uuid(), userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(newsletterGroupMember)
        .where(
          and(
            eq(newsletterGroupMember.groupId, input.groupId),
            eq(newsletterGroupMember.userId, input.userId),
          ),
        );
      return { ok: true };
    }),
});

// ---------------------------------------------------------------------------
// Public newsletter — the published archive at /newsletter and each permalink.
// No auth: published issues are public, shareable, SEO-indexed. Only issues
// with publishedAt set are ever exposed; drafts, test sends, and unpublished
// issues are invisible here.
// ---------------------------------------------------------------------------

export const newsletterPublicRouter = router({
  /** Published issues, newest first, for the public archive index. */
  listPublished: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        slug: newsletterIssue.slug,
        title: newsletterIssue.subject,
        summary: newsletterIssue.preheader,
        publishedAt: newsletterIssue.publishedAt,
      })
      .from(newsletterIssue)
      .where(isNotNull(newsletterIssue.publishedAt))
      .orderBy(desc(newsletterIssue.publishedAt));
  }),

  /** One published issue by slug. NOT_FOUND if it does not exist or is unpublished. */
  getPublishedBySlug: publicProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const issue = await ctx.db.query.newsletterIssue.findFirst({
        where: and(
          eq(newsletterIssue.slug, input.slug),
          isNotNull(newsletterIssue.publishedAt),
        ),
      });
      if (!issue) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        slug: issue.slug,
        title: issue.subject,
        summary: issue.preheader,
        bodyHtml: await renderNewsletterMarkdown(issue.bodyMarkdown),
        ctaKey: issue.ctaKey,
        publishedAt: issue.publishedAt,
      };
    }),
});
