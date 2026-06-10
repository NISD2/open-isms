# ISMS Scope: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-001  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## 1. Organization context

Kardashev Catalyst UG (haftungsbeschränkt) develops and operates **nisd2.eu**, a SaaS platform that helps organizations achieve and maintain NIS2 regulatory compliance. The company is headquartered in Cologne, Germany, with two employees working remotely and from a shared co-working space.

Kardashev Catalyst processes compliance data, evidence documents, and personal data (names, email addresses, roles) on behalf of its customers. This makes it a **data processor** under GDPR and creates security obligations to those customers.

---

## 2. ISMS scope statement

> **The ISMS covers the development, operation, and support of the nisd2.eu compliance SaaS platform, including all cloud infrastructure, development tooling, endpoint devices, and personnel of Kardashev Catalyst UG.**

This scope is the basis for all ISO 27001:2022 controls, risk assessments, and the Statement of Applicability.

---

## 3. What is in scope

### Systems and services
| Asset | Description | Location |
|---|---|---|
| NIS2 compliance platform | Next.js application, tRPC API | Hetzner DE (Frankfurt) |
| PostgreSQL database | Primary data store: all customer and compliance data | Hetzner DE (Frankfurt) |
| AWS S3 evidence storage | Encrypted evidence file storage | AWS eu-central-1 (Frankfurt) |
| Company website (nisd2.eu) | Public marketing site | Vercel (CDN) |
| CI/CD pipeline | GitHub Actions: build, test, deploy | GitHub (cloud) |
| Google Workspace | Gmail, Drive, Meet, Docs: team collaboration | Google (EU region) |
| Developer laptops | 2× MacBook Pro, FileVault encrypted | Berlin / remote |

### People
All Kardashev Catalyst UG employees and founders:
- Cory Hisey: COO, Co-Founder
- Simon Orzel: CEO / CISO, Co-Founder

### Physical locations
- Cologne co-working space (badge-access facility, managed by third party)
- Remote home offices (endpoints covered by MDM and policy)

### Suppliers in scope
Suppliers with access to in-scope systems or personal data:

| Supplier | Role | Data access |
|---|---|---|
| Hetzner Online GmbH | Cloud hosting (server, DB) | Infrastructure only |
| Amazon Web Services | S3 evidence storage | Evidence files (encrypted) |
| Google LLC | Workspace (email, docs) | Internal communications, documents |
| Vercel Inc. | Frontend CDN | No customer data |
| Resend | Transactional email | Recipient names and email addresses |

---

## 4. What is out of scope

| Excluded | Reason |
|---|---|
| Customer systems and infrastructure | Customers bring their own systems; Kardashev Catalyst has no access or control |
| Hetzner's own internal infrastructure | Third-party data center; controlled via Hetzner's own certifications |
| AWS's own internal infrastructure | Controlled via AWS compliance programs (SOC 2, ISO 27001) |
| GitHub's own internal infrastructure | Controlled via GitHub/Microsoft compliance certifications |

---

## 5. Interfaces and dependencies

The ISMS boundary interfaces with the following external parties:

- **Customers**: via the nisd2.eu platform (authenticated access to their own compliance data only)
- **Hetzner**: infrastructure provider; security obligations governed by DPA and Hetzner's ISO 27001 certification
- **AWS**: S3 storage; governed by AWS GDPR DPA and AWS SOC 2/ISO 27001
- **Google**: Workspace; governed by Google GDPR DPA and Google ISO 27001
- **Resend**: email delivery; governed by DPA and Resend's security commitments

---

## 6. Context factors affecting the ISMS

### Internal factors
- 2-person team: no segregation of duties is possible; compensating controls (code review, shared credential vault, documented runbooks) are used instead
- Cloud-first architecture: no on-premises servers; physical security is outsourced to Hetzner and co-working space provider
- Bootstrapped: security investments are constrained; controls are risk-prioritized

### External factors
- Customers operate in regulated industries (NIS2-covered entities) and expect vendor security maturity
- GDPR applies as Kardashev Catalyst is a data processor for customer personal data
- Cybersecurity threat landscape for SaaS platforms includes credential stuffing, supply chain attacks, and data exfiltration

### Interested parties
| Party | Security interest |
|---|---|
| Customers | Confidentiality and integrity of their compliance data |
| Hetzner / AWS | Contractual compliance with DPA terms |
| LDI NRW (Landesbeauftragte für Datenschutz und Informationsfreiheit NRW) | GDPR compliance as data processor |
| Potential ISO 27001 certification body | Audit-ready ISMS documentation and evidence |

---

## 7. Exclusions from Annex A

The following Annex A control areas are excluded from this ISMS due to the nature of the organization. Justifications are documented in the Statement of Applicability (NISD2-ISMS-003).

- **A.7 Physical controls** (partial): The company does not own or operate any physical facilities. Co-working space physical security is managed by the facility provider. Laptops and remote working are covered.
- **A.5.3 Segregation of duties**: Not feasible with a 2-person team. Compensating controls documented in SoA.
- **A.6.1 Screening**: Both employees are co-founders; pre-employment screening is not applicable. NDA/confidentiality obligations are covered in founder agreements.

---

*This document is subject to annual review or upon significant organizational change (new employee, change of infrastructure, new product line).*
