# Access Control Policy: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-007  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## 1. Principles

**Least privilege**: Access is granted only to what is needed, at the level needed, for as long as needed. Default is no access.

**Need to know**: Customer data is accessible only to the systems that process it. No human has routine access to production customer data without a specific operational reason.

**Single identity**: One account per person per system. No shared accounts. No anonymous access to anything that touches customer data.

---

## 2. Identity provider

Google Workspace is the identity provider for Kardashev Catalyst UG. All systems that support SSO use Google OAuth. Google accounts are the authoritative identity: access to Google equals access to the company's systems.

Google Workspace admin account: Simon Orzel only.

---

## 3. Authentication requirements

| System | MFA requirement | MFA method |
|---|---|---|
| Google Workspace (all) | Mandatory, admin-enforced | Hardware security key (YubiKey) primary; TOTP backup |
| GitHub org | Mandatory, org-enforced | Hardware security key; TOTP |
| Hetzner Cloud Console | Mandatory | TOTP |
| AWS Console | Mandatory | TOTP |
| 1Password | Mandatory | TOTP + secret key |
| nisd2.eu platform (admin) | Via Google OAuth (inherits Google MFA) |   |

Password minimum length: 16 characters. All passwords generated and stored in 1Password Teams.

---

## 4. Access rights by system

### Google Workspace
| Role | Users | Access |
|---|---|---|
| Super Admin | Simon Orzel | Full admin: user management, security settings, audit log |
| User | Cory Hisey | Email, Drive, Meet, Docs |

Drive permissions: no files shared externally by default. External sharing requires explicit justification per file.

### GitHub
| Role | Users | Access |
|---|---|---|
| Owner | Simon Orzel | Full org admin, all repositories |
| Member | Cory Hisey | All repositories, PR review, no admin |

Branch protection on `main`: required PR review, no direct push, status checks must pass.

### Hetzner Cloud Console
| Role | Users | Access |
|---|---|---|
| Owner | Simon Orzel | Full admin: servers, networking, billing |
| Member | Cory Hisey | Read access for monitoring; no server modification |

Production server SSH: Simon Orzel only, via SSH key (no password auth). Key stored in 1Password.

### AWS Console
| Role | Users | Access |
|---|---|---|
| Root account | Emergency use only | Not used for routine operations. Credentials in 1Password Emergency Kit. |
| Admin (IAM) | Simon Orzel | S3 management, CloudTrail, IAM |
| Read-only | Cory Hisey | S3 read, CloudTrail read |

Production S3 bucket: no public access. Access via IAM role (application) or IAM user (Simon, MFA-enforced).

### nisd2.eu platform
| Role | Users | Access |
|---|---|---|
| Admin | Simon Orzel, Cory Hisey | Full platform access, all company data, admin panel |
| Customer admin | Customer users | Their company's data only: enforced via `companyId` scoping in API |

No Kardashev Catalyst UG employee has routine programmatic access to customer compliance data. Admin access to the platform is used only for support purposes and is logged in the audit trail.

---

## 5. Privileged access

Privileged access (production server SSH, database admin, AWS root) is:
- Limited to Simon Orzel
- Used only for operational necessity: not for routine tasks
- All privileged sessions are documented in the incident/change log if they involve customer data or production changes

Database direct access: only via Hetzner private network (not exposed to internet). No production database access from development machines.

---

## 6. Access lifecycle

### Provisioning (new person)
1. Create Google Workspace account
2. Add to GitHub org with appropriate role
3. Add to 1Password Teams (share relevant vaults only)
4. Grant Hetzner and AWS access if required by role
5. Complete security awareness training before access is active
6. Document in the onboarding checklist

### Review (quarterly)
1. Review all active accounts across Google, GitHub, Hetzner, AWS
2. Confirm each account holder still requires the access level granted
3. Document review completion in platform (nisd2.eu/improvements or management review)

### Revocation (departure or role change)
1. Disable Google Workspace account immediately (triggers loss of SSO access to all Google-integrated systems)
2. Remove from GitHub org
3. Remove from 1Password Teams
4. Revoke Hetzner and AWS access
5. Rotate any credentials the person had knowledge of
6. Complete within **4 hours** of departure

---

## 7. Third-party and supplier access

No supplier has standing access to production systems. If temporary access is required for support:
- Create a time-limited account with minimum required permissions
- Log the access grant and purpose in the change log
- Revoke immediately when support is complete
- Audit what was accessed during the session
