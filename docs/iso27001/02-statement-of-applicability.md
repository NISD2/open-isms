# Statement of Applicability: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-003  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## How to read this document

For each of the 93 ISO 27001:2022 Annex A controls:

- **Applicable**: Yes / No
- **Implemented**: Yes / Partial / No
- **Justification**: Why included or excluded
- **Evidence**: Where proof lives (platform module, document, or external system)

Controls marked **N/A** are formally excluded with justification. Exclusions are defensible to an auditor only when the reason is genuine (not "too hard").

---

## Theme 5: Organizational controls

| Control | Name | Applicable | Implemented | Justification / Evidence |
|---|---|---|---|---|
| 5.1 | Policies for information security | Yes | Yes | IS Policy (NISD2-ISMS-002). Reviewed annually. |
| 5.2 | Information security roles and responsibilities | Yes | Yes | Defined in IS Policy §5. CISO = Simon Orzel. |
| 5.3 | Segregation of duties | Partial | Partial | Not fully feasible with 2 people. Compensating controls: all production changes require PR review by second founder; shared 1Password vault; audit log on all platform mutations. |
| 5.4 | Management responsibilities | Yes | Yes | CEO approves policy, budget, risk acceptance. CISO owns ISMS operation. Annual management review held (NISD2-ISMS-009). |
| 5.5 | Contact with authorities | Yes | Yes | CISO maintains contact with LDI NRW (Landesbeauftragte für Datenschutz und Informationsfreiheit NRW) for GDPR incidents. BSI CERT-Bund advisories subscribed. |
| 5.6 | Contact with special interest groups | Yes | Partial | BSI CERT-Bund advisories. German IT security news monitored. No formal ISAC membership yet. **TODO: join relevant ISAC.** |
| 5.7 | Threat intelligence | Yes | Partial | GitHub Dependabot alerts, BSI CERT-Bund advisories, CVE feeds monitored. No automated threat intel platform. Acceptable at current scale. |
| 5.8 | Information security in project management | Yes | Yes | Security review is part of all PRs. New features assessed for security impact before deployment. |
| 5.9 | Inventory of information and other associated assets | Yes | Yes | Asset inventory maintained in platform (nisd2.eu/assets). Reviewed and updated on change. |
| 5.10 | Acceptable use of information and other associated assets | Yes | Yes | Acceptable Use Policy (NISD2-ISMS-011). Covers devices, accounts, data handling. |
| 5.11 | Return of assets | Yes | Yes | Offboarding checklist includes device return, account deprovisioning, credential rotation. |
| 5.12 | Classification of information | Yes | Yes | Two levels: **Confidential** (customer data, credentials, source code) and **Internal** (operational docs). Classification guide in Acceptable Use Policy. |
| 5.13 | Labelling of information | Partial | Partial | Digital documents labelled via naming convention (`CONFIDENTIAL_` prefix). No physical label printing needed: cloud-native operation. |
| 5.14 | Information transfer | Yes | Yes | Customer data transmitted only via TLS 1.3. Internal file sharing via Google Drive (encrypted). No unencrypted transfer channels permitted. |
| 5.15 | Access control | Yes | Yes | Access Control Policy (NISD2-ISMS-007). RBAC enforced in platform. Google and GitHub use admin-enforced MFA. |
| 5.16 | Identity management | Yes | Yes | Google Workspace as IdP. Unique accounts per person. Shared accounts prohibited. Google OAuth for platform SSO. |
| 5.17 | Authentication information | Yes | Yes | Passwords managed in 1Password Teams (shared vault). Minimum 16 characters, generated. MFA required for all accounts. |
| 5.18 | Access rights | Yes | Yes | Access rights provisioned on onboarding, reviewed quarterly, revoked within 4h of offboarding. Admin rights limited to CISO. |
| 5.19 | Information security in supplier relationships | Yes | Yes | Supplier Security Policy (NISD2-ISMS-010). DPA required for all data processors. Supplier register maintained in platform. |
| 5.20 | Addressing information security within supplier agreements | Yes | Yes | DPAs in place with Hetzner, AWS, Google, Resend. Security clauses documented in supplier register. |
| 5.21 | Managing information security in the ICT supply chain | Yes | Partial | Dependency scanning via Dependabot (GitHub). No formal SBOM yet. **TODO: add SBOM generation and `bun audit` gate to CI.** |
| 5.22 | Monitoring, review and change management of supplier services | Yes | Yes | Annual supplier review. Status page monitoring for critical suppliers. Supplier register updated on change. |
| 5.23 | Information security for use of cloud services | Yes | Yes | All cloud services assessed before use. DPA required for data processors. Access via MFA-enforced accounts. |
| 5.24 | Information security incident management planning and preparation | Yes | Yes | Incident Response Plan (NISD2-ISMS-005). Roles assigned. Signal channel for coordination. |
| 5.25 | Assessment and decision on information security events | Yes | Yes | Classification criteria in IRP. Decision tree distinguishes events, incidents, and significant incidents. |
| 5.26 | Response to information security incidents | Yes | Partial | IRP (NISD2-ISMS-005) defines containment, eradication, recovery steps. Incidents logged in platform. **TODO: run first tabletop exercise.** |
| 5.27 | Learning from information security incidents | Yes | Yes | Post-incident reviews documented. Lessons learned feed improvement register in platform. |
| 5.28 | Collection of evidence | Yes | Partial | Incident log timestamps and descriptions maintained. Log retention via Hetzner (30 days) and application logs. **TODO: define formal evidence preservation procedure for significant incidents.** |
| 5.29 | Information security during disruption | Yes | Yes | BCP (NISD2-ISMS-006) covers security control continuity during incidents. Critical security controls (MFA, access controls) remain active during disruption: cloud-managed. |
| 5.30 | ICT readiness for business continuity | Yes | Yes | RTO 8h / RPO 4h defined. Restore procedure documented and tested. Documented in BCP. |
| 5.31 | Legal, statutory, regulatory and contractual requirements | Yes | Yes | GDPR (data processor obligations). Customer DPAs. Tracked in supplier register and legal review. |
| 5.32 | Intellectual property rights | Yes | Partial | All third-party libraries used under permissive open-source licences (MIT, Apache 2.0). **TODO: automate licence compliance check in CI.** |
| 5.33 | Protection of records | Yes | Yes | ISMS records retained for minimum 3 years. Stored in Google Drive (Confidential folder, access-controlled). Audit logs in platform are append-only. |
| 5.34 | Privacy and protection of PII | Yes | Yes | GDPR compliance as data processor. Privacy Policy published. DPAs with all sub-processors. Data minimisation applied. |
| 5.35 | Independent review of information security | Yes | Partial | Annual internal audit conducted by CISO. External certification audit (ISO 27001) planned. **TODO: schedule Stage 1 audit with certification body.** |
| 5.36 | Compliance with policies, rules and standards for information security | Yes | Yes | Quarterly internal compliance check against this SoA. Findings tracked in improvement register. |
| 5.37 | Documented operating procedures | Yes | Yes | Runbooks for: deployment, DB restore, incident response, offboarding. Stored in GitHub wiki (access-controlled). |

---

## Theme 6: People controls

| Control | Name | Applicable | Implemented | Justification / Evidence |
|---|---|---|---|---|
| 6.1 | Screening | N/A |   | Both employees are co-founders. Pre-employment screening is not applicable. Background check equivalent: founder due diligence at company formation. |
| 6.2 | Terms and conditions of employment | Yes | Yes | Founder agreement includes confidentiality, IP assignment, and security obligations. |
| 6.3 | Information security awareness, education and training | Yes | Partial | Founders self-train via CISO-curated material; training records to be tracked in platform. **TODO: complete first annual awareness cycle; introduce phishing simulation.** |
| 6.4 | Disciplinary process | N/A |   | No employees. Founder misconduct would be addressed via founder agreement and UG governing documents. |
| 6.5 | Responsibilities after termination or change of employment | Yes | Yes | Offboarding checklist: access revoked within 4h, devices wiped, credentials rotated, NDA obligations persist. |
| 6.6 | Confidentiality or non-disclosure agreements | Yes | Yes | Confidentiality obligations in founder agreement. Supplier DPAs contain confidentiality clauses. |
| 6.7 | Remote working | Yes | Yes | Remote working policy in Acceptable Use Policy. VPN not required (cloud-native architecture, MFA on all services). Device encryption (FileVault) mandatory. |
| 6.8 | Information security event reporting | Yes | Yes | All personnel required to report incidents immediately via Signal to CISO. Incident log in platform. |

---

## Theme 7: Physical controls

| Control | Name | Applicable | Implemented | Justification / Evidence |
|---|---|---|---|---|
| 7.1 | Physical security perimeters | Partial | Partial | No owned facilities. Co-working space has badge access and reception. Treated as untrusted environment: no sensitive work on unencrypted devices in public areas. |
| 7.2 | Physical entry | Partial | Partial | Co-working space managed by third party (badge access, CCTV). Kardashev Catalyst has no control over this. Mitigated by: encrypted laptops, screen lock, no sensitive data on local storage. |
| 7.3 | Securing offices, rooms and facilities | N/A |   | No dedicated office. Co-working space security is the facility provider's responsibility. |
| 7.4 | Physical security monitoring | N/A |   | No owned facilities. Co-working space CCTV managed by facility provider. |
| 7.5 | Protecting against physical and environmental threats | Partial | Partial | Servers in Hetzner DC (Tier III, redundant power, fire suppression). Laptops in co-working space and homes: encrypted, no critical data stored locally. |
| 7.6 | Working in secure areas | N/A |   | No secure areas. Sensitive operations performed on encrypted devices with screen privacy filter in public spaces. |
| 7.7 | Clear desk and clear screen | Yes | Yes | Screen lock on inactivity ≤2 minutes (MDM-enforced). No sensitive documents printed. Clear desk policy in Acceptable Use Policy. |
| 7.8 | Equipment siting and protection | Yes | Partial | Laptops not left unattended in public spaces. No servers on-premises. Hetzner DC handles server siting. **TODO: formal policy for laptop use in public transport.** |
| 7.9 | Security of assets off-premises | Yes | Yes | All laptops are FileVault encrypted. 1Password for all credentials. VPN not required due to cloud-native architecture. Loss/theft procedure in IRP. |
| 7.10 | Storage media | Yes | Yes | No removable media used. Internal storage: FileVault encrypted. Cloud storage: encrypted at rest (Hetzner, AWS SSE-AES256). Secure erase before device disposal. |
| 7.11 | Supporting utilities | N/A |   | Handled by Hetzner (servers) and facility provider (co-working space). |
| 7.12 | Cabling security | N/A |   | No owned cabling. Cloud-hosted servers. Co-working space network treated as untrusted. |
| 7.13 | Equipment maintenance | Yes | Yes | MacBooks on Apple Care. OS and software patches applied within 48h of critical release. |
| 7.14 | Secure disposal or re-use of equipment | Yes | Yes | Devices wiped using Apple Erase All Content and Settings (cryptographic erase) before disposal or reassignment. |

---

## Theme 8: Technological controls

| Control | Name | Applicable | Implemented | Justification / Evidence |
|---|---|---|---|---|
| 8.1 | User endpoint devices | Yes | Yes | MDM policy: FileVault, screen lock ≤2 min, automatic updates enabled, 1Password required. Both devices enrolled. |
| 8.2 | Privileged access rights | Yes | Yes | Admin access limited to CISO (Simon Orzel) for production infrastructure. Admin rights reviewed quarterly. DB access requires VPN-equivalent (Hetzner private network). |
| 8.3 | Information access restriction | Yes | Yes | RBAC enforced in platform (admin / reviewer / member). Customer data scoped by company: cross-tenant access is architecturally impossible. |
| 8.4 | Access to source code | Yes | Yes | GitHub org: branch protection on main, PR review required, no direct push. SSO via Google. Secret scanning enabled. |
| 8.5 | Secure authentication | Yes | Yes | MFA enforced admin-wide in Google Workspace and GitHub. Hardware security keys (YubiKey) for admin accounts. TOTP minimum for all other accounts. |
| 8.6 | Capacity management | Yes | Partial | Hetzner monitoring for CPU/memory/disk. AWS S3 has no practical capacity limit. **TODO: set up disk usage alert at 80%.** |
| 8.7 | Protection against malware | Yes | Yes | macOS Gatekeeper + XProtect. No third-party AV (Apple M-series: low attack surface, no running unsigned code policy). Dependabot for supply chain malware. |
| 8.8 | Management of technical vulnerabilities | Yes | Partial | Dependabot alerts (GitHub). CVE feeds monitored. **TODO: add `bun audit` gate in CI; formalize as standalone Vulnerability Management Policy.** |
| 8.9 | Configuration management | Yes | Partial | Infrastructure as code for Hetzner (documented). App config via environment variables (never hardcoded). **TODO: formalize Hetzner server config as IaC (Terraform or Ansible).** |
| 8.10 | Information deletion | Yes | Yes | Customer account deletion triggers cascade delete of all associated data. Evidence files deleted from S3. Data retention periods defined in Privacy Policy. |
| 8.11 | Data masking | Partial | Partial | Production data not used in development or testing (synthetic seed data used). Customer data masked in logs (no PII in application logs). Partial: no formal data masking tool. |
| 8.12 | Data leakage prevention | Yes | Partial | No DLP tool deployed. Mitigated by: MFA on all accounts, Google Workspace DLP rules for external sharing, GitHub secret scanning, encrypted email for sensitive comms. |
| 8.13 | Information backup | Yes | Yes | Daily automated DB backup to AWS S3 (eu-central-1). S3 versioning on evidence bucket. Backup encryption: AES-256. |
| 8.14 | Redundancy of information processing facilities | Partial | Partial | No automatic failover (single Hetzner server). Mitigated by: 8h RTO, tested restore procedure, S3 cross-region evidence backup. Acceptable at current scale and cost. |
| 8.15 | Logging | Yes | Yes | Application audit log (append-only, in platform). Hetzner access logs. AWS CloudTrail for S3. Google Workspace audit log. Retention: 90 days application logs, 1 year audit trail. |
| 8.16 | Monitoring activities | Yes | Partial | Better Uptime for availability. Hetzner monitoring for resource usage. **TODO: set up log-based alerting for authentication failures and access anomalies.** |
| 8.17 | Clock synchronisation | Yes | Yes | NTP via cloud providers (Hetzner, AWS). Application timestamps use UTC. No manual clock management. |
| 8.18 | Use of privileged utility programs | Yes | Yes | No privileged utilities used beyond standard OS tools. psql access to production DB limited to CISO via Hetzner private network. |
| 8.19 | Installation of software on operational systems | Yes | Yes | Only software from verified sources (App Store, Homebrew with `--cask`, official vendor binaries). No pirated or unsigned software. |
| 8.20 | Networks security | Yes | Yes | Hetzner private network for DB access (not exposed to internet). TLS 1.3 for all external connections. No open ports beyond 80/443 on app server. |
| 8.21 | Security of network services | Yes | Yes | Cloudflare WAF in front of web application. Rate limiting on auth endpoints. DDoS protection via Cloudflare. |
| 8.22 | Segregation of networks | Partial | Partial | Hetzner private network separates DB from internet. No full network segmentation (no separate VLANs). Acceptable for current architecture. |
| 8.23 | Web filtering | N/A |   | 2-person team, no managed corporate network. Mitigated by: device policy, security awareness training, 1Password phishing protection. |
| 8.24 | Use of cryptography | Yes | Yes | Cryptography Policy (NISD2-ISMS-008). TLS 1.3 in transit, AES-256 at rest, FileVault for endpoints, AWS SSE for S3. |
| 8.25 | Secure development life cycle | Yes | Yes | Security requirements in design. OWASP Top 10 code review checklist. Security testing before deployment. Zod input validation. Drizzle ORM (parameterized queries). |
| 8.26 | Application security requirements | Yes | Yes | Security requirements defined at feature design stage. Auth and authorization reviewed in every PR. |
| 8.27 | Secure system architecture and engineering principles | Yes | Yes | RBAC, input validation at boundaries, SSR-first (reduced client-side attack surface), no secrets in client bundle. |
| 8.28 | Secure coding | Yes | Yes | TypeScript strict mode, no `as any`, Zod validation, ESLint security rules. OWASP Top 10 reviewed in PRs. |
| 8.29 | Security testing in development and acceptance | Yes | Partial | Manual security review in PRs. TypeScript + Zod for input validation. **TODO: add automated SAST scan (e.g. CodeQL) to CI.** |
| 8.30 | Outsourced development | N/A |   | No outsourced development. Both founders are the development team. |
| 8.31 | Separation of development, test and production environments | Yes | Yes | Separate environments: local (dev), staging (Vercel preview deployments), production (Hetzner). Production credentials not used in dev/staging. |
| 8.32 | Change management | Yes | Yes | All changes via GitHub PRs. Emergency changes documented retrospectively. Change log maintained. |
| 8.33 | Test information | Yes | Yes | No production data used in testing. Seed data is synthetic (Dev GmbH: fictional company). |
| 8.34 | Protection of information systems during audit testing | Yes | Yes | Penetration testing performed on staging only. Production audit access read-only and time-limited. |

---

## Summary

| Theme | Total | Applicable | N/A | Implemented | Partial | TODO |
|---|---|---|---|---|---|---|
| 5: Organizational | 37 | 36 | 1 | 31 | 5 | 4 |
| 6: People | 8 | 6 | 2 | 6 | 0 | 0 |
| 7: Physical | 14 | 10 | 4 | 7 | 3 | 1 |
| 8: Technological | 34 | 33 | 1 | 25 | 8 | 4 |
| **Total** | **93** | **85** | **8** | **69** | **16** | **9** |

---

## Open TODOs before Stage 1 audit

| # | Control | Action |
|---|---|---|
| 1 | 5.6 | Join a relevant ISAC (e.g. IT-ISAC) |
| 2 | 5.21 | Add SBOM generation to CI pipeline |
| 3 | 5.28 | Write evidence preservation procedure for significant incidents |
| 4 | 5.35 | Schedule Stage 1 audit with DQS or TÜV Rheinland |
| 5 | 7.8 | Add laptop-in-public-transport guideline to Acceptable Use Policy |
| 6 | 8.6 | Set up disk usage alert at 80% on Hetzner server |
| 7 | 8.9 | Formalize server configuration as IaC |
| 8 | 8.16 | Set up auth failure and access anomaly alerting |
| 9 | 8.29 | Add CodeQL or equivalent SAST to CI |

*These 9 items are the gap between current state and audit-ready.*
