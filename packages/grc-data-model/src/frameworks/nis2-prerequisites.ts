/**
 * Which NIS 2 requirement must be settled before which. Framework data, like `nis2.ts`.
 *
 * Moved here from `drizzle/seed.ts` on 25.09.2026, values untouched, so no reseed. It was a local
 * constant inside the seed function, which made it invisible to the one thing that needed it most:
 * the ordering of the journey. Every journey surface sorted by urgency and ignored these, so the
 * path put "accept the residual risks" at position 6 and "build the risk register" at 14, while
 * the pair below says in plain words that the register comes first.
 *
 * The seed still writes these rows to `requirement_prerequisite`; the journey order reads them
 * from here. One list, two readers.
 */

export interface Prerequisite {
  /** The requirement that must be settled first. */
  readonly prerequisite: string;
  /** The requirement that waits for it. */
  readonly blocks: string;
  readonly notes: string;
}

export const NIS2_PREREQUISITES: readonly Prerequisite[] = [
  // === Registration chain ===
  // 12.1 (classification, §28) and 12.2 (registration, §33) are parallel
  // filings, not sequenced, so 12.1 is not a prerequisite of 12.2.
  {
    prerequisite: "12.2",
    blocks: "12.3",
    notes: "Registration must exist before maintenance",
  },
  {
    prerequisite: "12.1",
    blocks: "12.4",
    notes: "Classification needed for compliance evidence scope",
  },

  // === Governance: CEO training gates sign-offs (§38 BSIG) ===
  {
    prerequisite: "1.1",
    blocks: "1.3",
    notes: "§38: CEO trained before budget sign-off",
  },
  {
    prerequisite: "1.1",
    blocks: "1.4",
    notes: "§38: CEO trained before liability acknowledgment",
  },
  {
    prerequisite: "1.1",
    blocks: "2.4",
    notes: "§38: CEO trained before IS policy sign-off",
  },
  {
    prerequisite: "1.1",
    blocks: "7.3",
    notes: "§38: CEO trained before management review",
  },

  // === Risk foundation: methodology + assets → risk register → treatment ===
  { prerequisite: "2.1", blocks: "2.3", notes: "Can't assess risks without methodology" },
  {
    prerequisite: "2.2",
    blocks: "2.3",
    notes: "Can't assess risks without asset inventory",
  },
  {
    prerequisite: "2.3",
    blocks: "2.4",
    notes: "Can't accept residual risks without register",
  },

  // === Incident handling: plan → detection → reporting → drill → review ===
  {
    prerequisite: "1.2",
    blocks: "3.1",
    notes: "Incident team requires defined roles (§30(1)(2))",
  },
  { prerequisite: "3.1", blocks: "3.2", notes: "Detection needs incident response plan" },
  {
    prerequisite: "3.1",
    blocks: "3.3",
    notes: "BSI reporting needs incident response plan",
  },
  { prerequisite: "3.1", blocks: "3.4", notes: "Drill needs incident response plan" },
  {
    prerequisite: "3.1",
    blocks: "3.5",
    notes: "Post-incident review needs incident response plan",
  },

  // === BCP: BIA → plans → DR → backup → testing ===
  {
    prerequisite: "2.3",
    blocks: "4.1",
    notes: "BIA requires risk assessment results (BSI-200-4)",
  },
  { prerequisite: "4.1", blocks: "4.2", notes: "BCP plan needs BIA results" },
  { prerequisite: "4.1", blocks: "4.3", notes: "DR plan needs BIA results" },
  {
    prerequisite: "4.1",
    blocks: "4.4",
    notes: "Backup strategy needs recovery targets from BIA",
  },
  { prerequisite: "4.2", blocks: "4.5", notes: "BCP testing needs BCP plan" },

  // === Supply chain: register → contracts → assessment → incidents ===
  {
    prerequisite: "2.2",
    blocks: "5.1",
    notes: "Supplier register needs asset context (§30(1)(4))",
  },
  { prerequisite: "5.1", blocks: "5.2", notes: "Contracts need supplier register" },
  { prerequisite: "5.1", blocks: "5.3", notes: "Assessment needs supplier register" },
  {
    prerequisite: "5.1",
    blocks: "5.4",
    notes: "Supplier incident process needs supplier register",
  },

  // === Procurement: secure procurement → dev → vulns → patches → changes ===
  {
    prerequisite: "2.3",
    blocks: "6.1",
    notes: "Procurement security depends on risk context (§30(1)(5))",
  },
  { prerequisite: "6.1", blocks: "6.2", notes: "Secure dev needs procurement policy" },
  {
    prerequisite: "2.2",
    blocks: "6.3",
    notes: "Vulnerability mgmt needs asset inventory",
  },
  { prerequisite: "2.2", blocks: "6.4", notes: "Patch mgmt needs asset inventory" },
  { prerequisite: "6.1", blocks: "6.5", notes: "Change mgmt needs procurement policy" },

  // === Effectiveness: KPIs → audit → review → improvements ===
  {
    prerequisite: "2.3",
    blocks: "7.1",
    notes: "KPIs need risk baseline to measure against",
  },
  {
    prerequisite: "2.3",
    blocks: "7.2",
    notes: "Audit scope derives from risk assessment",
  },
  { prerequisite: "7.1", blocks: "7.4", notes: "Improvements need KPI data" },

  // === Training: policy → awareness → role-specific → testing ===
  {
    prerequisite: "1.2",
    blocks: "8.1",
    notes: "IT security policy needs role definitions",
  },
  {
    prerequisite: "8.1",
    blocks: "8.2",
    notes: "Awareness program needs security policy",
  },
  {
    prerequisite: "1.1",
    blocks: "8.3",
    notes: "Management training content depends on CEO training (§38)",
  },
  {
    prerequisite: "8.2",
    blocks: "8.4",
    notes: "Phishing simulations need awareness program",
  },

  // === Crypto: policy first, then implementation ===
  {
    prerequisite: "2.3",
    blocks: "9.1",
    notes: "Crypto policy depends on risk assessment (§30(1)(8))",
  },
  {
    prerequisite: "9.1",
    blocks: "9.2",
    notes: "Encryption implementation needs crypto policy",
  },
  { prerequisite: "9.1", blocks: "9.3", notes: "Key management needs crypto policy" },

  // === Access control: policy → per-asset → lifecycle → reviews ===
  {
    prerequisite: "2.2",
    blocks: "10.1",
    notes: "Access policy needs asset inventory (§30(1)(9))",
  },
  {
    prerequisite: "10.1",
    blocks: "10.2",
    notes: "Per-asset access requires access policy",
  },
  { prerequisite: "10.1", blocks: "10.3", notes: "User lifecycle needs access policy" },
  { prerequisite: "10.1", blocks: "10.4", notes: "Access reviews need access policy" },

  // === Authentication (relaxed 2026-06: P0 MFA must not wait on the P1 access policy) ===
  // MFA stays scoped against the asset inventory; secure-comms and auth-standards are unblocked.
  // Existing prod data is migrated by grc/0001_relax_mfa_prereq.sql.
  {
    prerequisite: "2.2",
    blocks: "11.1",
    notes: "MFA is scoped against the asset inventory (§30(1)(9))",
  },
];
