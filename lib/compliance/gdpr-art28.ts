import type { Supplier } from "@/schema/types";

export type Art28Clause =
  | "instructions"        // Art. 28(3)(a)
  | "confidentiality"     // Art. 28(3)(b)
  | "security"            // Art. 28(3)(c)
  | "subProcessors"       // Art. 28(3)(d)
  | "rightsAssistance"    // Art. 28(3)(e)
  | "breachAssistance"    // Art. 28(3)(f)
  | "deletionReturn"      // Art. 28(3)(g)
  | "audit";              // Art. 28(3)(h)

export interface Art28Compliance {
  applicable: boolean;
  complete: boolean;
  satisfied: Art28Clause[];
  missing: Art28Clause[];
}

/**
 * Map a supplier row to Art. 28(3)(a-h) compliance state.
 *
 * Art. 28 only applies to processors. Joint controllers fall under Art. 26;
 * separate controllers and intra-group transfers don't need a DPA at all.
 *
 * Existing supplier columns cover most clauses. The two new ones
 * (processesOnlyOnInstructions, assistsWithDataSubjectRights) close the
 * (a) and (e) gaps directly.
 */
export function art28Compliance(supplier: Supplier): Art28Compliance {
  if (supplier.relationshipType !== "processor") {
    return { applicable: false, complete: true, satisfied: [], missing: [] };
  }

  const checks: Array<[Art28Clause, boolean]> = [
    ["instructions", Boolean(supplier.processesOnlyOnInstructions)],
    ["confidentiality", Boolean(supplier.hasSecurityClauses)],
    ["security", Boolean(supplier.hasSecurityClauses)],
    ["subProcessors",
      Boolean(supplier.hasSubcontractorFlowDown) &&
      Boolean(supplier.notifyOnLocationChange ?? true)],
    ["rightsAssistance", Boolean(supplier.assistsWithDataSubjectRights)],
    ["breachAssistance",
      Boolean(supplier.hasIncidentNotificationClause) &&
      Boolean(supplier.incidentAssistanceCommitment)],
    ["deletionReturn", Boolean(supplier.dataReturnOnTermination)],
    ["audit",
      Boolean(supplier.hasAuditRights) &&
      Boolean(supplier.acceptRightToAudit ?? true)],
  ];

  const satisfied = checks.filter(([, ok]) => ok).map(([c]) => c);
  const missing = checks.filter(([, ok]) => !ok).map(([c]) => c);

  return {
    applicable: true,
    complete: missing.length === 0,
    satisfied,
    missing,
  };
}
