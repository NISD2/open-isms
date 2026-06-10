# Supplier Security Policy: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-010  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## 1. Purpose

Kardashev Catalyst UG relies on third-party suppliers for cloud infrastructure, communication, and tooling. Some of these suppliers process personal data on our behalf (as sub-processors under GDPR) or have access to systems that hold customer compliance data. This policy defines how supplier relationships are managed to protect that data.

---

## 2. Supplier risk classification

| Risk level | Criteria | Examples |
|---|---|---|
| **High** | Access to personal data OR access to production systems | Hetzner (hosts DB), Google (email/Drive), AWS (evidence files) |
| **Medium** | Access to encrypted data only, or significant availability dependency | AWS S3 (encrypted evidence), Vercel (no customer data but availability impact) |
| **Low** | No access to personal data, limited availability impact | Domain registrar, status page services |

---

## 3. Requirements by risk level

### High-risk suppliers

Before engaging:
- [ ] Data Processing Agreement (DPA) signed and in place
- [ ] Evidence of security certification (ISO 27001, SOC 2 Type II, or equivalent)
- [ ] Security clauses in contract: incident notification, data deletion on termination, audit rights
- [ ] Due diligence: review their security documentation or cert

Ongoing:
- Annual review of their security posture (cert still valid, no major incidents)
- Monitor their status page and security advisories
- Confirm DPA is current if their services change

### Medium-risk suppliers

Before engaging:
- [ ] DPA if personal data is processed
- [ ] Review of their security documentation

Ongoing:
- Annual review

### Low-risk suppliers

- Basic vetting: no known security incidents, active company
- No DPA required if no personal data processed

---

## 4. Current supplier register

The authoritative supplier register is maintained in the platform (nisd2.eu/suppliers). Summary:

| Supplier | Risk | DPA in place | Cert | Last reviewed |
|---|---|---|---|---|
| Hetzner Online GmbH | High | Yes (Hetzner customer portal) | ISO 27001 | 2026-05-19 |
| Amazon Web Services | High | Yes (AWS Artifact: GDPR DPA) | ISO 27001, SOC 2 | 2026-05-19 |
| Google LLC (Workspace) | High | Yes (Google Admin Console) | ISO 27001, SOC 2 | 2026-05-19 |
| Resend | High | Pending: see note below |   | 2026-05-19 |
| Vercel Inc. | Medium | Not required (no customer data) |   | 2026-05-19 |

**Resend note:** Resend processes recipient email addresses (personal data). A DPA or Data Sub-processor Agreement must be confirmed or an alternative email provider selected if Resend cannot provide one. **Action: resolve before next customer go-live.**

---

## 5. DPA activation instructions

### Hetzner
1. Log into Hetzner Cloud Console → Account → Data Processing Agreement
2. Review and accept the DPA

### AWS
1. Log into AWS Console → Artifact → Agreements
2. Download and accept the "AWS Customer Agreement" and "AWS GDPR DPA"

### Google Workspace
1. Log into Google Admin Console → Account → Legal → Data Processing Amendment
2. Review and accept

### Resend
1. Contact support@resend.com requesting a DPA or sub-processor agreement
2. If not available, evaluate migration to an alternative transactional email provider (Postmark, Mailgun: both offer DPAs)

---

## 6. Sub-processor disclosure

Kardashev Catalyst UG's customers are entitled to know which sub-processors process their data. Sub-processors are disclosed in the Privacy Policy (nisd2.eu/privacy) and customer DPA. The list must be updated when a new high-risk supplier is added, with at least 30 days notice to customers before the change takes effect.

---

## 7. Supplier termination

When a supplier relationship ends:
1. Request data deletion confirmation in writing
2. Verify deletion (or confirm encrypted destruction) of any customer or personal data held by the supplier
3. Revoke all API keys, credentials, and access tokens
4. Update the supplier register with termination date
5. Update sub-processor list in Privacy Policy if applicable

---

## 8. Annual review

Conducted as part of the annual management review. For each high-risk supplier:
- Confirm DPA is still current and covers the current scope of processing
- Confirm security certification has not lapsed
- Review any security incidents the supplier disclosed in the past year
- Confirm no material changes to their sub-processor list that affect us

Review outcomes documented in management review record (nisd2.eu/management-reviews).
