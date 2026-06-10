# Incident Response Plan: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-005  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## 1. Purpose

This plan defines how Kardashev Catalyst UG detects, responds to, and learns from information security incidents. It covers the full lifecycle: detection → classification → containment → eradication → recovery → post-incident review.

---

## 2. Scope

All incidents affecting systems, data, or personnel within the ISMS scope (NISD2-ISMS-001). This includes incidents affecting customer data, platform availability, internal credentials, and physical devices.

---

## 3. Roles

| Role | Person | Contact |
|---|---|---|
| Incident Lead (CISO) | Simon Orzel | Signal: @simon (primary) |
| COO | Cory Hisey | Signal: @cory (secondary) |
| Escalation (if both unavailable) |   | Defined in 1Password Emergency Kit |

All incident coordination uses Signal (encrypted). Email is not used for active incident coordination.

---

## 4. Incident classification

### Step 1: Is it a security event or a routine issue?

A **security event** is any observable occurrence that may be relevant to information security:
- Unexpected login attempt or access from unusual location
- Alert from Dependabot, Better Uptime, or AWS GuardDuty
- Customer reporting unexpected behaviour
- Lost or stolen device

If uncertain: treat it as an event and investigate. The cost of investigating a false positive is low.

### Step 2: Classify the event

| Severity | Definition | Examples |
|---|---|---|
| **Near-miss** | Potential impact, no actual harm | Exposed debug endpoint (no data accessed), failed phishing attempt detected |
| **Incident** | Confirmed security impact, contained | Temporary service outage, S3 throttling, malware blocked by Gatekeeper |
| **Significant incident** | Actual or likely data breach, extended outage, or threat to confidentiality/integrity | Confirmed credential compromise, customer data accessed without authorization, ransomware |

### Step 3: GDPR breach decision

For any **significant incident**, ask immediately:

> Did personal data leave our control, or could it have?

- **Yes / uncertain** → GDPR breach response required (see Section 7)
- **No** → continue standard incident response

---

## 5. Response procedure

### Phase 1: Detect & log (first 30 minutes)

1. Document the event in the platform incident log (nisd2.eu/incidents) immediately, even with partial information
2. Note: timestamp, who discovered it, what was observed, initial assessment
3. Notify incident lead via Signal
4. Do not attempt remediation until classification is complete: preserve evidence

### Phase 2: Contain (first 2 hours)

Goal: stop the bleeding. Do not restore service yet.

| Scenario | Containment action |
|---|---|
| Compromised credential | Immediately revoke in Google Admin / GitHub / 1Password |
| Compromised platform admin account | Disable account, rotate all tokens, invalidate all sessions |
| Active attack on API | Enable Cloudflare "Under Attack" mode, apply temporary IP block |
| Suspected data exfiltration | Isolate affected system (take offline if necessary), preserve logs |
| Lost/stolen laptop | Remote wipe via Apple MDM immediately |
| Malicious dependency | Roll back deployment, remove package from lock file |

### Phase 3: Assess (hours 2–8)

1. Determine exact scope: what systems, what data, how many users affected?
2. Determine root cause: how did it happen?
3. Document timeline from earliest indicator to containment
4. Assess GDPR obligations (Section 7)
5. Decide on customer communication (Section 8)

### Phase 4: Eradicate (hours 4–24)

1. Remove the threat (malicious code, revoke access, patch vulnerability)
2. Verify all affected systems are clean before recovery
3. Rotate all credentials that could have been exposed

### Phase 5: Recover (hours 8–72)

1. Restore service from known-good state (backup restore if necessary: see BCP NISD2-ISMS-006)
2. Verify integrity of restored data
3. Increase monitoring for 7 days post-recovery
4. Communicate resolution to affected customers

### Phase 6: Post-incident review (within 7 days)

1. Write post-incident report: timeline, root cause, impact, actions taken
2. Identify what controls failed and what worked
3. Create improvement items in platform (nisd2.eu/improvements)
4. Update this IRP if the incident revealed gaps
5. Log review completion in platform

---

## 6. Evidence preservation

For any significant incident:

1. Export all relevant logs before taking systems offline:
   - Hetzner server logs (`/var/log/`)
   - AWS CloudTrail logs (S3 access logs)
   - Google Workspace audit log
   - Platform audit log (export from nisd2.eu/audit)
2. Store exported logs in a designated encrypted folder in Google Drive (`Incidents/YYYY-MM-DD/`)
3. Do not alter or delete any logs. Even accidental changes compromise forensic value
4. Note chain of custody: who accessed logs, when, for what purpose

---

## 7. GDPR breach response

GDPR Article 33 requires notification to LDI NRW **within 72 hours** of becoming aware of a personal data breach likely to result in risk to individuals' rights.

### Decision checklist

- [ ] Was personal data involved? (customer employee names, emails, compliance data)
- [ ] Did data leave our systems without authorization?
- [ ] Could data have been accessed by an unauthorized party?
- [ ] Is there risk to individuals? (identity theft, discrimination, financial harm)

If any answer is **yes or uncertain** → notify LDI NRW.

### Notification to LDI NRW

**Authority:** Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW)  
**Online:** ldi.nrw.de (Meldung einer Datenpanne)  
**Phone:** +49 211 38424-0  
**Email:** poststelle@ldi.nrw.de

Notification must include:
- Nature of the breach (what happened)
- Categories and approximate number of individuals affected
- Categories and approximate number of records affected
- Likely consequences
- Measures taken or proposed

If full information is not available within 72 hours: submit what you have and add further information later. An incomplete timely notification is better than a complete late one.

### Notification to affected customers

Customers must be notified without undue delay if the breach is likely to result in a high risk to their users' rights (GDPR Art. 34).

Template: `docs/iso27001/templates/customer-breach-notification.md`

---

## 8. Runbooks

### Runbook A: Compromised Google account

1. Go to Google Admin Console → Users → [affected user] → Security → Sign out of all sessions
2. Reset password via Admin Console
3. Revoke all app tokens
4. Review last 30 days of Google Workspace audit log for data access
5. If platform accessed via OAuth: invalidate all active sessions in platform DB (`DELETE FROM session WHERE userId = ?`)
6. Change all credentials the user had access to in 1Password
7. Classify incident and follow response procedure above

### Runbook B: Database restore

See BCP (NISD2-ISMS-006) Section 4 for full restore procedure.

### Runbook C: Lost or stolen laptop

1. Remote wipe immediately via Apple MDM (System Preferences → [Apple ID] → Find My Mac → Erase)
2. Revoke all active sessions: Google, GitHub, 1Password (emergency kit in shared vault)
3. Rotate any credentials the device may have had access to (check 1Password audit log)
4. File police report if theft (required for insurance)
5. Classify as incident, assess what data was on the device (should be none: see Acceptable Use Policy)
6. Order replacement device; apply MDM policy before first use

---

## 9. Contact list (stored in 1Password Emergency Kit)

| Contact | Purpose | Location in 1Password |
|---|---|---|
| LDI NRW | GDPR breach notification | "Regulatory Contacts" vault |
| Hetzner support | Infrastructure incidents | "Supplier Contacts" vault |
| AWS support | S3 incidents | "Supplier Contacts" vault |
| Google Workspace support | Account compromise | "Supplier Contacts" vault |
| DQS / Certification body | Notify of significant incident affecting ISMS | "Regulatory Contacts" vault |

---

## 10. Testing

This plan must be tested via tabletop exercise at least annually. Exercise records will be maintained in the platform. **TODO: schedule and run first tabletop exercise within 90 days of this plan's effective date.**
