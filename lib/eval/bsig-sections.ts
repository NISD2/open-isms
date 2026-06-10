export interface BsigSection {
  bsigSection: string;
  sectionTitle: string;
  auditExpectations: string[];
}

export const BSIG_SECTIONS: Record<string, BsigSection> = {
  GOV: {
    bsigSection: "§38 BSIG",
    sectionTitle: "Governance & Management Liability",
    auditExpectations: [
      "Board-level approval of cybersecurity risk management measures (§38(1))",
      "Evidence that management monitors implementation of security measures",
      "Documented personal liability acknowledgment by managing directors",
      "Proof of management cybersecurity training (§38(3))",
      "Regular cybersecurity training offered to all employees (covered by TRN category, §30(1) Nr. 7)",
      "Clear organizational chart showing CISO/security responsibilities",
      "Documented delegation of security tasks with accountability",
    ],
  },
  RSK: {
    bsigSection: "§30(1) Nr. 1 BSIG",
    sectionTitle: "Risk Analysis & Information Systems Security",
    auditExpectations: [
      "Documented risk assessment methodology (qualitative or quantitative)",
      "Complete risk register covering all critical information systems",
      "Risk treatment plan with accepted, mitigated, transferred, or avoided risks",
      "Regular risk review cycle (at least annual)",
      "Risk acceptance criteria approved by management",
      "Threat landscape analysis relevant to the organization's sector",
      "Asset inventory linked to risk assessments",
    ],
  },
  INC: {
    bsigSection: "§32 BSIG",
    sectionTitle: "Incident Handling & Reporting",
    auditExpectations: [
      "Incident response plan with clear roles, escalation paths, and timelines",
      "24-hour early warning capability to BSI (§32(1))",
      "72-hour incident notification process with impact assessment",
      "Final report process within one month of incident",
      "Incident classification scheme (significant vs. non-significant)",
      "Evidence of incident response drills or tabletop exercises",
      "Post-incident review process with lessons learned",
      "Contact details for BSI reporting registered and current",
    ],
  },
  BCP: {
    bsigSection: "§30(1) Nr. 3 BSIG",
    sectionTitle: "Business Continuity & Crisis Management",
    auditExpectations: [
      "Business impact analysis identifying critical processes and recovery priorities",
      "Business continuity plan covering IT systems and operational processes",
      "Backup strategy with documented RPO/RTO targets",
      "Backup testing evidence (regular restore tests)",
      "Crisis management plan with communication procedures",
      "Disaster recovery procedures for critical systems",
      "Evidence of BCP testing (at least annual)",
    ],
  },
  SUP: {
    bsigSection: "§30(1) Nr. 4 BSIG",
    sectionTitle: "Supply Chain Security",
    auditExpectations: [
      "Supplier register with security criticality classification",
      "Security requirements in supplier contracts (SLAs, audit rights)",
      "Supplier risk assessment process",
      "Monitoring of supplier security posture (questionnaires, certifications)",
      "Incident notification requirements for suppliers",
      "Process for evaluating supply chain dependencies and single points of failure",
      "Due diligence for new suppliers before onboarding",
    ],
  },
  PRO: {
    bsigSection: "§30(1) Nr. 5 BSIG",
    sectionTitle: "Procurement, Development & Vulnerability Management",
    auditExpectations: [
      "Security requirements in procurement processes",
      "Secure development lifecycle (SDLC) if developing software",
      "Vulnerability management process with scanning and patching timelines",
      "Vulnerability disclosure policy (coordinated disclosure)",
      "Patch management process with defined SLAs per severity",
      "Configuration management and hardening baselines",
      "Third-party component tracking (SBOM or equivalent)",
    ],
  },
  EFF: {
    bsigSection: "§30(1) Nr. 6 BSIG",
    sectionTitle: "Effectiveness Assessment",
    auditExpectations: [
      "Defined KPIs/metrics for measuring cybersecurity effectiveness",
      "Regular review cycle for security measures (at least annual)",
      "Internal audit or assessment program for cybersecurity",
      "Management review of security effectiveness",
      "Trend analysis of security incidents, vulnerabilities, and audit findings",
      "Corrective action tracking from audits and assessments",
    ],
  },
  TRN: {
    bsigSection: "§30(1) Nr. 7 BSIG",
    sectionTitle: "Cyber Hygiene & Training",
    auditExpectations: [
      "Cybersecurity awareness training program (all employees)",
      "Role-specific training for IT and security staff",
      "Training records with completion tracking",
      "Regular training updates (at least annual refresher)",
      "Phishing simulation or social engineering awareness",
      "Basic cyber hygiene policies (password policy, clean desk, device handling)",
      "New employee security onboarding process",
    ],
  },
  CRY: {
    bsigSection: "§30(1) Nr. 8 BSIG",
    sectionTitle: "Cryptography & Encryption",
    auditExpectations: [
      "Cryptography policy covering approved algorithms and key lengths",
      "Encryption of data at rest for sensitive/critical data",
      "Encryption of data in transit (TLS/VPN)",
      "Key management procedures (generation, storage, rotation, revocation)",
      "Certificate management process",
      "Inventory of cryptographic assets and their lifecycle",
    ],
  },
  ACC: {
    bsigSection: "§30(1) Nr. 9 BSIG",
    sectionTitle: "Access Control & HR Security",
    auditExpectations: [
      "Access control policy based on least-privilege and need-to-know",
      "User access provisioning and de-provisioning process",
      "Regular access reviews (at least annual)",
      "Privileged access management (PAM) for admin accounts",
      "Asset management policy covering hardware and software inventory",
      "HR security processes (background checks, terms of employment)",
      "Joiners-movers-leavers process for access rights",
    ],
  },
  AUT: {
    bsigSection: "§30(1) Nr. 10 BSIG",
    sectionTitle: "Multi-Factor Authentication or Continuous Authentication & Secure Communications",
    auditExpectations: [
      "Multi-factor authentication (MFA) or continuous authentication solutions for critical systems and remote access",
      "MFA or continuous authentication solutions deployed",
      "Secure voice, video, and text communication solutions",
      "Secure emergency communication system (out-of-band)",
      "Authentication policy covering password complexity, session management",
      "Single sign-on (SSO) or centralized identity management where applicable",
    ],
  },
  REG: {
    bsigSection: "§33, §34, §39 BSIG",
    sectionTitle: "Registration & Regulatory Reporting",
    auditExpectations: [
      "Registration with BSI completed (§33)",
      "Contact point designated and registered with BSI",
      "Process for maintaining registration data current",
      "Understanding of sector-specific reporting obligations",
      "Evidence of compliance with information sharing obligations (§34)",
      "Domain name registry data maintained (if applicable, §39)",
      "Documentation of regulatory correspondence and submissions",
    ],
  },
};
