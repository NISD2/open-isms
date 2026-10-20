/** Human-readable label for a notification.entityType value. */
export function emailTypeLabel(t: string): string {
  switch (t) {
    case "course_followup":
      return "Course follow-up";
    case "requirement":
      return "Compliance reminder";
    case "policy":
      return "Policy reminder";
    case "supplier_publication_event":
      return "Supplier incident broadcast";
    case "lifecycle_email":
      return "Lifecycle nudge";
    case "newsletter_issue":
      return "Newsletter";
    default:
      return t;
  }
}
