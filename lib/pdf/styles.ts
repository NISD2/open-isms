import { StyleSheet } from "@react-pdf/renderer";
import { FONT, registerPdfFonts } from "./fonts";
import { BRAND, EYEBROW, PAGE, RADIUS, RULE, TYPE } from "./theme";

/**
 * The shared StyleSheet every generated document is built from.
 *
 * Importing this registers the embedded typefaces. The styles below name
 * FONT.sans, and an unregistered family falls back to the base-14 Helvetica
 * silently - no error, just a different document on every reader. Registration
 * is idempotent, so the side effect is safe to trigger from each document, and
 * putting it here means no document can adopt the design system and forget the
 * fonts that design system assumes.
 */
registerPdfFonts();

export const styles = StyleSheet.create({
  // -- Page ---------------------------------------------------------------
  // Deliberately no page-level `lineHeight`: react-pdf inherits it into the
  // `fixed` running footer and then drops that footer from every page, with no
  // error. Leading belongs on the text styles that want it, a few lines down.
  page: {
    paddingTop: PAGE.top,
    paddingBottom: PAGE.bottom,
    paddingHorizontal: PAGE.marginX,
    fontFamily: FONT.sans,
    fontSize: TYPE.body,
    color: BRAND.body,
  },
  coverPage: {
    paddingTop: PAGE.top,
    paddingBottom: PAGE.bottom,
    paddingHorizontal: PAGE.coverMarginX,
  },

  // -- Full-bleed brand rules ---------------------------------------------
  // Two segments in the house colours give a sheet its identity at a glance
  // without a clip-art border.
  bandTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    flexDirection: "row",
  },
  bandBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: "row",
  },
  bandPrimary: { flex: 3, backgroundColor: BRAND.primary },
  bandAccent: { flex: 1, backgroundColor: BRAND.accent },

  // -- Document header ----------------------------------------------------
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerMetaBlock: { alignItems: "flex-end" },
  headerMetaLabel: { ...EYEBROW, marginRight: -1.3 },
  headerMetaValue: {
    fontFamily: FONT.mono,
    fontSize: 8.5,
    color: BRAND.muted,
    marginTop: 3,
  },
  headerRule: { height: RULE.hair, backgroundColor: BRAND.rule, marginTop: 14 },

  // -- Cover --------------------------------------------------------------
  coverBody: { flexGrow: 1, justifyContent: "center", paddingTop: 12 },
  eyebrow: {
    fontSize: TYPE.fine,
    fontWeight: 600,
    letterSpacing: 1.7,
    textTransform: "uppercase",
    color: BRAND.accent,
  },
  coverTitle: {
    marginTop: 12,
    fontSize: TYPE.h1,
    fontWeight: 700,
    letterSpacing: -0.4,
    lineHeight: 1.18,
    color: BRAND.ink,
  },
  coverSubtitle: {
    marginTop: 9,
    fontSize: TYPE.h3,
    fontWeight: 500,
    color: BRAND.muted,
  },
  coverRule: {
    width: 190,
    height: RULE.hair,
    backgroundColor: BRAND.ruleStrong,
    marginTop: 22,
    marginBottom: 20,
  },
  coverMeta: { flexDirection: "row", marginBottom: 5 },
  coverMetaLabel: { width: 132, fontSize: TYPE.small, color: BRAND.faint },
  coverMetaValue: { flex: 1, fontSize: TYPE.small, color: BRAND.body },

  // -- Stat plate ---------------------------------------------------------
  stats: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: RULE.hair,
    borderColor: BRAND.rule,
    borderRadius: RADIUS.md,
    backgroundColor: BRAND.surface,
    paddingVertical: 12,
  },
  statCell: { flex: 1, paddingHorizontal: 12, alignItems: "center" },
  statsCentered: { alignSelf: "center" },
  statCellCentered: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    paddingHorizontal: 28,
    minWidth: 128,
  },
  statDivider: { width: 1, height: 28, marginTop: 3, backgroundColor: BRAND.rule },
  statValue: { fontSize: 15, fontWeight: 600, color: BRAND.ink },
  statLabel: {
    marginTop: 5,
    fontSize: TYPE.micro,
    fontWeight: 500,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: BRAND.faint,
    textAlign: "center",
  },

  // -- Sections -----------------------------------------------------------
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    paddingBottom: 5,
    borderBottomWidth: RULE.hair,
    borderBottomColor: BRAND.rule,
  },
  sectionMark: {
    width: 3,
    height: 13,
    borderRadius: 1.5,
    backgroundColor: BRAND.primary,
  },
  sectionCode: { fontFamily: FONT.mono, fontSize: TYPE.fine, color: BRAND.faint },
  sectionTitle: { flex: 1, fontSize: TYPE.h4, fontWeight: 600, color: BRAND.ink },
  sectionNote: {
    marginTop: 7,
    fontSize: TYPE.small,
    lineHeight: 1.5,
    color: BRAND.muted,
  },
  subheading: {
    ...EYEBROW,
    marginTop: 12,
    marginBottom: 5,
    color: BRAND.muted,
  },

  // -- Record block -------------------------------------------------------
  // One requirement, asset, supplier or risk. The left keyline groups its rows
  // without drawing a box around every entry.
  record: {
    marginTop: 11,
    paddingLeft: 9,
    borderLeftWidth: 2,
    borderLeftColor: BRAND.rule,
  },
  recordHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  recordCode: { fontFamily: FONT.mono, fontSize: TYPE.fine, color: BRAND.faint },
  recordTitle: {
    flex: 1,
    fontSize: TYPE.body,
    lineHeight: 1.35,
    fontWeight: 600,
    color: BRAND.ink,
  },

  // -- Field rows ---------------------------------------------------------
  fieldRow: { flexDirection: "row", marginTop: 3 },
  fieldLabel: {
    width: "34%",
    fontSize: TYPE.small,
    lineHeight: 1.4,
    color: BRAND.faint,
  },
  fieldValue: {
    width: "66%",
    fontSize: TYPE.small,
    lineHeight: 1.4,
    color: BRAND.body,
  },

  /** Full-measure body copy. `fieldValue` is the right-hand column of a
   *  label/value pair and is 66% wide; a paragraph set in it wears a ragged
   *  third of the page as dead margin. */
  prose: { fontSize: TYPE.small, lineHeight: 1.5, color: BRAND.body },

  // -- Tables -------------------------------------------------------------
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: RULE.thin,
    borderBottomColor: BRAND.ruleStrong,
    paddingBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.rule,
    paddingVertical: 4,
  },
  th: {
    fontSize: TYPE.micro,
    fontWeight: 600,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: BRAND.muted,
    paddingRight: 8,
  },
  td: { fontSize: TYPE.small, lineHeight: 1.4, color: BRAND.body, paddingRight: 8 },
  tdMono: {
    fontFamily: FONT.mono,
    fontSize: TYPE.fine,
    color: BRAND.muted,
    paddingRight: 8,
  },

  // -- Badge --------------------------------------------------------------
  badge: {
    fontSize: TYPE.micro,
    fontWeight: 600,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
  },

  // -- Callout ------------------------------------------------------------
  callout: {
    marginTop: 14,
    padding: 11,
    borderLeftWidth: 2.5,
    borderRadius: RADIUS.sm,
  },
  calloutTitle: {
    fontSize: TYPE.small,
    fontWeight: 600,
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  calloutText: { fontSize: TYPE.small, lineHeight: 1.5 },

  // -- Footers ------------------------------------------------------------
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: PAGE.marginX,
    right: PAGE.marginX,
    paddingTop: 8,
    borderTopWidth: RULE.hair,
    borderTopColor: BRAND.rule,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: TYPE.caption,
    color: BRAND.faint,
  },
  coverFooter: {
    marginTop: 22,
    paddingTop: 15,
    borderTopWidth: RULE.hair,
    borderTopColor: BRAND.rule,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  issuerLabel: EYEBROW,
  issuerName: { marginTop: 4, fontSize: 11, fontWeight: 600, color: BRAND.primary },
  issuerUrl: { marginTop: 2, fontSize: TYPE.small, color: BRAND.faint },
  disclaimer: {
    flex: 1,
    paddingHorizontal: 24,
    fontSize: TYPE.caption,
    lineHeight: 1.5,
    color: BRAND.faint,
    textAlign: "center",
  },
});
