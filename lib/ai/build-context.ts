export type AiDataSharingLevel = "none" | "basic" | "full";

interface CompanyContext {
  sector: string;
  subSector: string | null;
  entityType: string;
  legalForm: string | null;
  name: string;
  employeeCount: number | null;
  annualRevenue: string | null;
}

/**
 * Build an organization context string for the LLM based on the sharing level.
 *
 * - "none"  → null (no org data sent)
 * - "basic" → sector, sub-sector, entity type, legal form
 * - "full"  → above + company name, employee count, annual revenue
 */
export function buildAiContext(
  company: CompanyContext,
  level: AiDataSharingLevel,
): string | null {
  if (level === "none") return null;

  const parts: string[] = [
    `Sector: ${company.sector}`,
  ];

  if (company.subSector) {
    parts.push(`Sub-sector: ${company.subSector}`);
  }

  parts.push(`Entity type: ${company.entityType}`);

  if (company.legalForm) {
    parts.push(`Legal form: ${company.legalForm}`);
  }

  if (level === "full") {
    parts.push(`Company: ${company.name}`);
    if (company.employeeCount !== null) {
      parts.push(`Employees: ${company.employeeCount}`);
    }
    if (company.annualRevenue !== null) {
      parts.push(`Annual revenue: €${company.annualRevenue}`);
    }
  }

  return parts.join(", ");
}
