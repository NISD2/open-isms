# Business Continuity Plan: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-006  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## 1. Purpose

This plan ensures Kardashev Catalyst UG can restore critical services and protect customer data following a major disruption. It defines recovery targets, recovery procedures, and the criteria for activating the plan.

---

## 2. Critical services and recovery targets

| Service | RTO | RPO | Why critical |
|---|---|---|---|
| nisd2.eu compliance platform | 8 hours | 4 hours | Customers depend on platform for compliance submissions with regulatory deadlines |
| PostgreSQL database | 8 hours | 4 hours | Contains all customer compliance data: unavailability or data loss is the primary business risk |
| AWS S3 evidence storage | 4 hours | 0 (versioned) | Evidence files are regulatory documents: must not be lost |
| Customer email notifications | 24 hours | N/A | Not immediately critical; platform access takes priority |

**RTO** (Recovery Time Objective): maximum acceptable downtime before service restored.  
**RPO** (Recovery Point Objective): maximum acceptable data loss window.

---

## 3. Activation criteria

The BCP is activated when any of the following occur:

- Platform unavailable for more than **2 hours** with no estimated resolution
- Database corrupted or inaccessible with no fix path within 2 hours
- Confirmed ransomware or destructive attack on production systems
- Hetzner data centre inaccessible (regional outage, fire, physical incident)
- Both founders simultaneously unavailable for more than 4 hours during business hours

**Activation decision:** Made by the first available founder. Does not require both.

---

## 4. Recovery procedure

### Step 1: Assess (0–30 minutes)

1. Confirm the nature of the disruption (infrastructure failure vs. security incident vs. data corruption)
2. Check Hetzner status page and Better Uptime dashboard
3. If security incident: follow IRP (NISD2-ISMS-005) first: do not restore from backup until systems are confirmed clean
4. Estimate recovery path and notify customers if outage will exceed 1 hour

### Step 2: Restore the database (30 minutes: 4 hours)

Backups are stored in AWS S3 bucket `nisd2-backups` (eu-central-1). Daily automated backup runs at 02:00 UTC.

```bash
# 1. List available backups
aws s3 ls s3://nisd2-backups/postgres/ --profile nisd2-backup

# 2. Download the most recent backup
aws s3 cp s3://nisd2-backups/postgres/YYYY-MM-DD.dump.gz /tmp/ --profile nisd2-backup

# 3. Decompress
gunzip /tmp/YYYY-MM-DD.dump.gz

# 4. Restore to a fresh PostgreSQL instance
pg_restore --clean --no-acl --no-owner -d $DATABASE_URL /tmp/YYYY-MM-DD.dump

# 5. Verify row counts for key tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM company; SELECT COUNT(*) FROM company_requirement_status;"
```

Full credentials and exact commands: **1Password → "Recovery Runbooks" → "DB Restore"**

Expected restore time: 30–60 minutes for a typical database size.

### Step 3: Restore the application (1–4 hours)

If the Hetzner server is unrecoverable, provision a new server:

1. Provision a new Hetzner cloud server (CX21 or equivalent) in FSN1 (Falkenstein)
2. Install prerequisites: Ubuntu 24.04, Node.js, Bun
3. Deploy from GitHub: `git clone git@github.com:NISD2/nisd2-platform.git`
4. Set environment variables from 1Password → "Production Env Vars"
5. Point DATABASE_URL to restored database
6. Run `bun db:migrate` to ensure schema is current
7. Start application: `bun run start`
8. Update DNS via Cloudflare to point to new server IP

Full provisioning script: `scripts/provision-server.sh` in the repository.

### Step 4: Verify and re-open (4–8 hours)

1. Test critical paths: sign in, load compliance dashboard, upload a test evidence file
2. Verify S3 evidence files are accessible
3. Check audit log is writing
4. Run `bun run typecheck` to confirm application integrity
5. Monitor Better Uptime for 30 minutes before communicating recovery to customers
6. Send customer notification email via Resend (template: `docs/iso27001/templates/outage-resolved.md`)

---

## 5. Evidence file recovery (S3)

S3 evidence files are protected by S3 versioning. They are not included in the PostgreSQL backup. Recovery:

1. All files remain in S3 during a server/database failure: no action required
2. If S3 bucket is accidentally deleted: contact AWS Support immediately (bucket versioning enables recovery within a limited window)
3. If individual files are corrupted: restore previous version via S3 console or `aws s3api get-object --version-id`

S3 bucket name, region, and credentials: **1Password → "AWS Production"**

---

## 6. Communication during disruption

| Timeline | Action |
|---|---|
| Outage > 30 minutes | Post status update to status page (if available) |
| Outage > 1 hour | Email affected customers with estimated recovery time |
| Outage > 4 hours | Personal contact with customers with imminent compliance deadlines |
| Recovery complete | Email all customers with confirmation and incident summary |

Customer contact list: exported from nisd2.eu admin panel → Companies → Export CSV

---

## 7. Key-person contingency

If one founder is unavailable, the other has full access to:
- All credentials via shared 1Password Teams vault
- All runbooks in GitHub (`docs/runbooks/`)
- All infrastructure via Hetzner Cloud Console and AWS Console

If both founders are simultaneously unavailable for an extended period (medical emergency, etc.):
- Designated emergency contact: [to be documented in 1Password Emergency Kit]
- That person has read-only access to the Emergency Kit to contact relevant parties

---

## 8. Testing

The restore procedure is tested at minimum once per year. The test:
1. Restore the most recent backup to an isolated test database
2. Verify row counts and data integrity
3. Document the test result in the platform (nisd2.eu/exercises)

Most recent test result and actual restore time are recorded there.
