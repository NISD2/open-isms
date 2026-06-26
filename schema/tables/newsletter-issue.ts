import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { newsletterGroup } from "./newsletter-group";

/**
 * Newsletter issue — one row per lifecycle email draft / send.
 *
 * Backs the platform-admin newsletter composer, the rendered next-issue
 * preview, and the send record. There is intentionally NO subscriber table:
 * subscribers ARE the `user` table. Eligible recipients are computed at send
 * time (emailFollowupsDisabled = false AND isDisposableEmail = false AND
 * emailVerifiedAt IS NOT NULL), so this table only stores the content and the
 * outcome of a send, never a recipient list.
 *
 * Lifecycle:
 *  - INSERT / UPDATE while status = "draft" (composer autosaves)
 *  - On send: status -> "sent", sentAt set, recipientCount recorded
 *
 * The enum is defined inline (not in schema/enums.ts) because the SaaS
 * drizzle.config only scans schema/tables + schema/modules; schema/enums.ts
 * is a re-export of the ISMS package and is deliberately excluded.
 */
export const newsletterIssueStatusEnum = pgEnum("newsletter_issue_status", [
  "draft",
  "sent",
]);

export const newsletterIssue = pgTable(
  "newsletter_issue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Email subject line. Doubles as the canonical (DE) public-page title. */
    subject: varchar("subject", { length: 500 }).notNull(),
    /** Optional preview text shown after the subject in most clients. */
    preheader: varchar("preheader", { length: 500 }),
    /** Inline-authored body, markdown. Rendered to HTML at preview/send time. */
    bodyMarkdown: text("body_markdown").notNull().default(""),
    /**
     * URL slug for the public permalink at /newsletter/<slug>. Derived from the
     * subject on save, deduped for uniqueness. Stable once set so shared links
     * keep working even if the subject is later edited.
     */
    slug: varchar("slug", { length: 200 }).notNull(),
    status: newsletterIssueStatusEnum("status").default("draft").notNull(),
    /**
     * Soft, rotating call-to-action shown once per issue (email + public page).
     * One of the keys in lib/newsletter/cta.ts (tool | course | gap), or NULL
     * for no CTA. Stored as text, not an enum, so adding a CTA is a code change
     * rather than a migration.
     */
    ctaKey: varchar("cta_key", { length: 30 }),
    /**
     * When the issue was published to the public site. NULL = not published.
     * Publishing is independent of sending: an issue can be sent but unpublished
     * (or published a day later, or never). Test sends never create a row, so
     * they can never appear publicly. Per-issue toggle, default off.
     */
    publishedAt: timestamp("published_at"),
    /** Audience the issue was sent to. NULL = all eligible users. */
    targetGroupId: uuid("target_group_id").references(() => newsletterGroup.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** NULL until sent. */
    sentAt: timestamp("sent_at"),
    /** Number of eligible recipients the issue was dispatched to. NULL = not sent. */
    recipientCount: integer("recipient_count"),
    /**
     * Snapshot of the exact email HTML that went out, captured at send time
     * with a placeholder unsubscribe link. Lets the admin review precisely
     * what was sent, independent of later template changes. NULL until sent.
     */
    sentHtml: text("sent_html"),
    /**
     * The exact recipient addresses the issue was dispatched to, snapshotted
     * at send time. Answers "what did we send, and to whom" programmatically
     * (recipient_count is the length). NULL until sent.
     */
    recipientEmails: text("recipient_emails").array(),
  },
  (table) => [
    index("idx_newsletter_issue_status").on(table.status),
    index("idx_newsletter_issue_created").on(table.createdAt),
    uniqueIndex("uq_newsletter_issue_slug").on(table.slug),
    index("idx_newsletter_issue_published").on(table.publishedAt),
  ],
);
