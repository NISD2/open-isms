import { hasReviewAccess } from "@/lib/auth/roles";
import { MANAGEMENT_ROLE } from "@/lib/durchgang/types";

/**
 * Who may export the company's records, and so who may read them through an assistant: whoever
 * may read its audit trail, and management, who approved what the files hold and passes them on.
 * Its own module, free of the session and the database, so the procedure tiers can import it.
 */
export const mayExport = (session: {
  readonly role: string;
  readonly jobTitle?: string | null;
}): boolean => hasReviewAccess(session.role) || session.jobTitle === MANAGEMENT_ROLE;
