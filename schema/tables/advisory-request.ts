import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * A request for paid implementation help, raised from /hilfe.
 *
 * Kept apart from `lead` deliberately. `lead` is an address captured at the
 * applicability check so onboarding can continue; this is a person asking to
 * be put in touch with a firm that charges money. Different consent (an
 * explicit opt-in to being forwarded to a third party, recorded with its own
 * timestamp), different lifecycle (received, forwarded, settled), and a row
 * here is the artefact the referral fee is invoiced against. Folding the two
 * would leave neither meaning intact.
 *
 * Before this table the only route was a mailto, which left nothing to count,
 * nothing to time and nothing to bill for.
 */
export const advisoryRequest = pgTable(
  "advisory_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * Only topic, email and consent are required.
     *
     * Everything else is nullable on purpose. The form banks the request on
     * one click and one address, then asks for the rest on the screen that
     * confirms it arrived. A field that is mandatory before the row exists is
     * a field that can lose the row, and a request with a topic and a working
     * address is worth vastly more than a complete one nobody finished.
     */
    topic: varchar("topic", { length: 40 }).notNull(),
    /** What made them act now. See ADVISORY_TRIGGERS. */
    trigger: varchar("trigger", { length: 40 }),
    /** How soon. See ADVISORY_TIMEFRAMES. */
    timeframe: varchar("timeframe", { length: 40 }),
    /** Free-form so a sector outside our list is not forced into "other". */
    sector: varchar("sector", { length: 120 }),
    /** See ADVISORY_SIZES. */
    companySize: varchar("company_size", { length: 40 }),

    contactName: varchar("contact_name", { length: 200 }),
    companyName: varchar("company_name", { length: 500 }),
    email: varchar("email", { length: 320 }).notNull(),
    note: text("note"),

    /**
     * The page on our own site that sent them, as a full path rather than a
     * category: `wiki/troubleshooting/bsi-anfrage-erhalten`, not
     * `troubleshooting`. The category alone says which bucket; the page says
     * which sentence made somebody ask for help, which is the difference
     * between knowing the supply chain area works and knowing that one
     * article does. It prices the lead and it tells us what to write next.
     */
    sourcePath: varchar("source_path", { length: 500 }),
    requirementCode: varchar("requirement_code", { length: 32 }),

    /**
     * Where they were before they reached that page, from document.referrer.
     * Usually a search engine, LinkedIn, or empty for a direct visit, so it is
     * the only thing here that answers whether the wiki or the posting is
     * producing the requests. Off-site and unverifiable by nature, so it is
     * stored as a hint and never used to decide anything.
     *
     * It is ordinary web-request metadata rather than a tracker, but it is
     * still stored against a named person, so `/datenschutz` has to say so.
     */
    referrer: varchar("referrer", { length: 1000 }),

    locale: varchar("locale", { length: 10 }),

    /**
     * Consent to forward the request to a partner firm, recorded as the
     * moment it was given rather than as a boolean. A boolean cannot answer
     * "when", which is the only question that matters if it is ever disputed.
     */
    forwardConsentAt: timestamp("forward_consent_at").notNull(),

    /**
     * Who it went to lives in `advisory_referral`, one row per firm, because a
     * request can go to more than one. There is deliberately no `forwardedAt`
     * mirror here: it would be the same fact stored twice and the copy would
     * be the one that goes stale.
     */
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_advisory_request_created").on(table.createdAt),
    index("idx_advisory_request_topic").on(table.topic),
  ],
);
