import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  // Cover page
  coverPage: {
    padding: 60,
    justifyContent: "center",
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 11,
    color: "#444",
    marginBottom: 6,
  },
  // Section headers
  categoryHeader: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1 solid #ddd",
  },
  categoryCode: {
    fontSize: 10,
    color: "#888",
    marginRight: 6,
  },
  categoryDescription: {
    fontSize: 9,
    color: "#666",
    marginBottom: 12,
  },
  // Requirement
  requirementBlock: {
    marginBottom: 16,
    paddingLeft: 8,
    borderLeft: "2 solid #e5e5e5",
  },
  requirementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requirementCode: {
    fontSize: 9,
    fontFamily: "Courier",
    color: "#888",
    marginRight: 6,
  },
  requirementTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  statusBadge: {
    fontSize: 8,
    padding: "2 6",
    borderRadius: 3,
    textTransform: "uppercase" as const,
  },
  statusApproved: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusCompleted: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusRejected: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  statusDefault: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
  },
  // Form data
  fieldRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingVertical: 2,
  },
  fieldLabel: {
    width: "35%",
    fontSize: 9,
    color: "#666",
  },
  fieldValue: {
    width: "65%",
    fontSize: 9,
  },
  // Evidence
  evidenceItem: {
    flexDirection: "row",
    fontSize: 8,
    color: "#555",
    marginBottom: 2,
  },
  // Feedback
  feedbackBlock: {
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  feedbackLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#991b1b",
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // Summary stats
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  statBox: {
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    minWidth: 80,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  statLabel: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#444",
    marginTop: 8,
    marginBottom: 4,
  },
  // Draft warning banner
  draftBanner: {
    backgroundColor: "#fefce8",
    border: "1 solid #f59e0b",
    borderRadius: 4,
    padding: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  draftTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    marginBottom: 4,
  },
  draftText: {
    fontSize: 9,
    color: "#78350f",
    lineHeight: 1.4,
  },
});
