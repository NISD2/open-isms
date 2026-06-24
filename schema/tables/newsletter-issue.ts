import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
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
    /** Email subject line. */
    subject: varchar("subject", { length: 500 }).notNull(),
    /** Optional preview text shown after the subject in most clients. */
    preheader: varchar("preheader", { length: 500 }),
    /** Inline-authored body, markdown. Rendered to HTML at preview/send time. */
    bodyMarkdown: text("body_markdown").notNull().default(""),
    status: newsletterIssueStatusEnum("status").default("draft").notNull(),
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
  ],
);
