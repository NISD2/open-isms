# Risk Assessment & Treatment Plan: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-004  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## 1. Methodology

### Risk scoring
Risks are scored semi-quantitatively on a 1–5 scale for both likelihood and impact. Risk score = Likelihood × Impact (1–25).

| Score | Likelihood | Impact |
|---|---|---|
| 1 | Very unlikely: no known threat, strong controls | Negligible: no business disruption |
| 2 | Unlikely: known threat, adequate controls | Minor: limited disruption, no data loss |
| 3 | Possible: known threat, partial controls | Moderate: temporary service disruption |
| 4 | Likely: active threat, weak controls | Significant: data loss or prolonged outage |
| 5 | Very likely: active threat, no effective controls | Critical: breach of customer data, regulatory action |

**Acceptance threshold:** Score ≤ 6 (after treatment). Scores 7–25 require active treatment.

### Treatment options
- **Mitigate**: implement controls to reduce likelihood or impact
- **Accept**: document and accept residual risk (requires CEO sign-off)
- **Transfer**: shift risk via insurance or contractual obligations
- **Avoid**: cease the activity that creates the risk

Risk register is maintained live in the NISD2 compliance platform (nisd2.eu/risks). This document captures the current assessed state and treatment decisions.

---

## 2. Risk register

### RISK-001: Customer data breach via platform vulnerability

**Category:** Application Security  
**Likelihood:** 2 | **Impact:** 5 | **Score:** 10  
**Treatment:** Mitigate  
**Owner:** Simon Orzel

**Description:** Exploitation of a web application vulnerability (SQL injection, IDOR, authentication bypass) enabling unauthorized access to customer compliance records, evidence files, or personal data.

**Threat sources:** External attacker, automated scanning, targeted attack on a compliance platform.

**Controls in place:**
- Input validation via Zod at all API boundaries
- Drizzle ORM with parameterized queries: no raw SQL
- RBAC enforced in tRPC: customer data scoped by `companyId`, cross-tenant access architecturally impossible
- MFA enforced on all admin accounts
- Dependency scanning: Dependabot (GitHub); `bun audit` CI gate planned
- Evidence files encrypted at rest (AWS S3 SSE-AES256)
- TLS 1.3 in transit

**Residual likelihood:** 1 | **Residual impact:** 5 | **Residual score:** 5 ✓

---

### RISK-002: Cloud provider outage (Hetzner)

**Category:** Availability  
**Likelihood:** 2 | **Impact:** 3 | **Score:** 6  
**Treatment:** Mitigate  
**Owner:** Simon Orzel

**Description:** Extended outage of Hetzner hosting affecting platform availability. Customers may be blocked from submitting compliance evidence during regulatory deadlines.

**Controls in place:**
- Daily automated PostgreSQL backup to AWS S3 (separate provider, eu-central-1)
- Documented restore runbook (RTO 8h / RPO 4h)
- Better Uptime monitoring with alerting
- Static assets served via Vercel CDN (partially available during outage)

**Residual likelihood:** 1 | **Residual impact:** 3 | **Residual score:** 3 ✓

---

### RISK-003: Google Workspace account compromise

**Category:** Social Engineering / Credential Theft  
**Likelihood:** 3 | **Impact:** 3 | **Score:** 9  
**Treatment:** Mitigate  
**Owner:** Simon Orzel

**Description:** Phishing or credential stuffing targeting Google Workspace accounts, giving an attacker access to internal email, Drive documents, and platform admin access (Google OAuth SSO).

**Controls in place:**
- Hardware security keys (YubiKey) enforced for all Google Workspace accounts
- Google Advanced Protection Program enrolled
- Separate production credentials not stored in Google Drive
- **Planned:** quarterly phishing simulation

**Residual likelihood:** 1 | **Residual impact:** 3 | **Residual score:** 3 ✓

---

### RISK-004: Source code or secret exposure via GitHub

**Category:** Data Leakage  
**Likelihood:** 2 | **Impact:** 4 | **Score:** 8  
**Treatment:** Mitigate  
**Owner:** Simon Orzel

**Description:** Unauthorized access to GitHub repository exposing proprietary platform code, or accidental commit of secrets (database credentials, API keys) into version history.

**Controls in place:**
- Branch protection on `main`: mandatory PR review, no direct push
- GitHub secret scanning enabled (blocks push on detected secrets)
- `.env` files in `.gitignore`: never committed
- Secrets managed via environment variables in Hetzner/Vercel dashboards
- SSO via Google Workspace (MFA enforced)

**Residual likelihood:** 1 | **Residual impact:** 3 | **Residual score:** 3 ✓

---

### RISK-005: Key-person dependency

**Category:** Operational  
**Likelihood:** 2 | **Impact:** 3 | **Score:** 6  
**Treatment:** Mitigate  
**Owner:** Cory Hisey

**Description:** Critical platform knowledge and infrastructure access concentrated in two co-founders. Simultaneous unavailability (illness, emergency) could halt incident response, deployments, or customer support.

**Controls in place:**
- Runbooks for all critical operations stored in GitHub (deployment, DB restore, incident escalation)
- Shared 1Password Teams vault: both founders have full credential access
- Documented emergency contact protocol
- Infrastructure provisioned via documented procedures (not undocumented manual steps)

**Residual likelihood:** 1 | **Residual impact:** 3 | **Residual score:** 3 ✓

---

### RISK-006: Supply chain compromise via npm/bun dependency

**Category:** Supply Chain  
**Likelihood:** 3 | **Impact:** 4 | **Score:** 12  
**Treatment:** Mitigate  
**Owner:** Simon Orzel

**Description:** A malicious package introduced through the JavaScript/TypeScript dependency tree (intentionally or via maintainer account takeover) exfiltrates customer data or injects backdoor code into the platform.

**Controls in place:**
- `bun.lockb` lock file: all dependencies pinned to specific versions
- Dependabot automated dependency updates with security alerts
- **Planned:** `bun audit` CI gate blocking deployment on critical vulnerabilities
- Minimal dependency policy: new dependencies require explicit review and justification
- No `postinstall` scripts from untrusted packages

**Residual likelihood:** 2 | **Residual impact:** 3 | **Residual score:** 6 ✓

---

### RISK-007: GDPR breach notification failure

**Category:** Compliance  
**Likelihood:** 2 | **Impact:** 4 | **Score:** 8  
**Treatment:** Mitigate  
**Owner:** Cory Hisey

**Description:** A personal data breach occurs but is not identified, assessed, and reported to LDI NRW within the 72-hour GDPR requirement, resulting in regulatory enforcement action.

**Controls in place:**
- Incident response plan with explicit GDPR notification decision tree (NISD2-ISMS-005)
- Incident log in platform: all security events logged immediately
- Paging procedure: CISO notified within 1 hour of suspected breach
- LDI NRW contact details in IRP and in shared 1Password vault

**Residual likelihood:** 1 | **Residual impact:** 3 | **Residual score:** 3 ✓

---

## 3. Risk summary

| Risk | Inherent score | Residual score | Treatment | Accepted by |
|---|---|---|---|---|
| RISK-001 Customer data breach | 10 | 5 | Mitigate |   |
| RISK-002 Hetzner outage | 6 | 3 | Mitigate |   |
| RISK-003 Google account compromise | 9 | 3 | Mitigate |   |
| RISK-004 GitHub secret exposure | 8 | 3 | Mitigate |   |
| RISK-005 Key-person dependency | 6 | 3 | Mitigate |   |
| RISK-006 Supply chain compromise | 12 | 6 | Mitigate |   |
| RISK-007 GDPR notification failure | 8 | 3 | Mitigate |   |

All residual scores ≤ 6. No risks accepted above threshold.

---

## 4. Management sign-off

Risk assessment reviewed and approved:

Simon Orzel, CEO / CISO: ___________________ Date: ___________

Cory Hisey, COO: ___________________ Date: ___________
