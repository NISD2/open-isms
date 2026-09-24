/**
 * Control — a single graded requirement of a BSI IT-Grundschutz Baustein.
 *
 * This is the structure the guided form sizes an item with, and it is the BSI's, not ours.
 * IT-Grundschutz grades every requirement in a Baustein as Basis (MUSS), Standard (SOLLTE) or
 * "bei erhöhtem Schutzbedarf" (KANN), and that published gradient is proportionality as a German
 * auditor reads it. The company's justification for not meeting a SOLLTE is what § 30 Abs. 1 S. 3
 * BSIG asks it to document.
 *
 * Seeded from `data/bsi/kompendium-2023.json`, which is produced by two independent machine
 * extractions of the same Baustein (the BSI's XML export of the Kompendium and the text layer of
 * the Baustein's own PDF). A Baustein counts as verified only when both agree, or when a
 * disagreement is resolved on record. Nothing in these tables is typed by hand: an earlier
 * hand-transcribed table was found wrong while marked verified, and the BSI's XML was later found
 * to omit a requirement its own PDF prints.
 *
 * CONTENT LICENCE. Identifiers, grades and numbering are facts. The requirement TITLES are BSI
 * text, the Kompendium download page grants no explicit licence, and at least one vendor
 * integrated the Kompendium under a signed agreement with the BSI. `title` therefore stays null
 * until the BSI's terms are read and recorded in LICENSE-DATA.md; the interface links to the
 * Baustein instead.
 *
 * Supports: the guided form's control decisions (§ 30 Abs. 2 BSIG areas).
 * References: none (content, not company data).
 */
import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { controlGradeEnum } from "../enums";

/**
 * One Baustein of the IT-Grundschutz-Kompendium, at one edition.
 *
 * Keyed by (id, edition) because a decision must keep pointing at the edition it was made
 * against: the Kompendium Edition 2023 is the last of its form, Grundschutz++ replaces the three
 * grades with priority levels, and the two run in parallel until the end of 2028.
 */
export const baustein = pgTable(
  "baustein",
  {
    id: varchar("id", { length: 16 }).notNull(), // "DER.2.1"
    edition: varchar("edition", { length: 32 }).notNull(), // "2023"
    /** The BSI's own title. Facts-only policy: see the licence note above. */
    title: text("title"),
    /** Direct link to the Baustein PDF, with the blob parameter the BSI requires. */
    url: text("url").notNull(),
    /** sha256 of the source the grades were extracted from, so drift is detectable. */
    sourceSha256: varchar("source_sha256", { length: 64 }).notNull(),
    /** True only when both machine sources agreed, or a disagreement was resolved on record. */
    verified: boolean("verified").notNull().default(false),
    /** Disagreements between the two sources, verbatim from the extractor. Empty when clean. */
    issues: text("issues").array(),
    extractedAt: timestamp("extracted_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.id, table.edition] })]
);

/**
 * One graded requirement of a Baustein, e.g. DER.2.1.A7.
 *
 * `grade` is the BSI's, in English: required = Basis (MUSS), expected = Standard (SOLLTE),
 * optional = bei erhöhtem Schutzbedarf (KANN). A requirement the Baustein keeps as a numbered
 * "ENTFALLEN" placeholder is stored with `withdrawn` set, so the numbering stays contiguous and
 * nothing silently disappears.
 */
export const control = pgTable(
  "control",
  {
    id: varchar("id", { length: 32 }).notNull(), // "DER.2.1.A7"
    edition: varchar("edition", { length: 32 }).notNull(),
    bausteinId: varchar("baustein_id", { length: 16 }).notNull(),
    /** The A-number, so ordering and contiguity are checkable without parsing the id. */
    number: integer("number").notNull(),
    grade: controlGradeEnum("grade").notNull(),
    /** The BSI's own title. Null until the licence allows it: see the note above. */
    title: text("title"),
    /** The Baustein prints this identifier as ENTFALLEN. Never offered as a decision. */
    withdrawn: boolean("withdrawn").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.edition] }),
    foreignKey({
      columns: [table.bausteinId, table.edition],
      foreignColumns: [baustein.id, baustein.edition],
      name: "control_baustein_fk",
    }),
    index("idx_control_baustein").on(table.bausteinId, table.edition),
    index("idx_control_grade").on(table.grade),
  ]
);
