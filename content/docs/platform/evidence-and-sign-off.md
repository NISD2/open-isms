The claim behind the product is that evidence should accumulate while you operate, rather than be assembled the week before an audit. This page is what that means in tables and columns, so you can judge the claim rather than take it.

## Assignment

A requirement's status row is the unit of work. Someone assigns it to a person, and that assignment records who assigned it and when.

```text
requirement_assignment
  status_id        which requirement, for which company
  user_id          who owns it
  assigned_by      who gave it to them
  assigned_at
  signed_off_at    null until they sign
  signed_off_role  the role they signed in
```

Sign-off is not a separate approval workflow bolted on afterwards. The assignment is the thing that gets signed, which is why the two live in one row.

## Sign-off history and the hash chain

Every sign-off appends a row to `sign_off_history`, and those rows are chained.

```text
sign_off_history
  status_id         the requirement being signed off
  version           1, 2, 3 ... per status
  signed_off_by     user id
  signed_off_role
  snapshot          JSONB: the answers, the company profile, the template
                    version, and a reference to every evidence file with its
                    content hash
  checksum          SHA-256 over the above plus the previous checksum
  previous_checksum null on the first entry
```

The checksum is computed over a canonicalised JSON payload: object keys sorted recursively, dates as ISO strings, arrays left in order. The same input always produces the same hash, and the first entry chains against the literal string `GENESIS`.

What that buys you: altering a past sign-off, or removing one from the middle, breaks every checksum after it. Recomputing the chain to hide the change requires rewriting every later row.

What it does not buy you: this is a tamper-**evident** structure, not a signature. It proves the sequence has not been edited by someone who did not also rewrite what follows. It is not an electronic signature under eIDAS, and nothing here should be described as an advanced or qualified one.

## Evidence files

```text
evidence
  requirement_status_id   what it evidences
  file_name, file_type, file_size
  storage_key             the object in S3 or MinIO
  content_hash            SHA-256 of the bytes
  version, previous_version_id
  uploaded_by, uploaded_at
  reviewed_by, reviewed_at, rejection_reason
```

Files are versioned rather than overwritten, and each version keeps its own hash. Because the sign-off snapshot stores the evidence reference **with its content hash**, a sign-off points at the exact bytes that were signed. Swapping the file afterwards does not silently change what was approved.

The bytes themselves never pass through the application server. The browser uploads straight to object storage with a presigned URL, which is why [Evidence storage](/docs/self-hosting/storage) is worth reading before you configure anything.

## The audit log

```text
audit_log
  company_id, user_id
  action, entity_type, entity_id
  description
  previous_value, new_value   JSONB before and after
  ip_address, user_agent
  checksum                    SHA-256 of the entry
  created_at
```

Append-only, and worth being precise about what that means here. Nothing in the application updates or deletes these rows in the course of normal work; the write path only inserts. It is a convention held by the code, not a database grant or a trigger, and a Postgres superuser with a `psql` prompt can do as they like.

Two paths do write, both on purpose:

- **GDPR erasure.** A person's right to erasure reaches audit rows too. The erasure path minimises them rather than pretending the obligation does not exist, and the daily job drops the raw email from erasure records once their three-year window has passed.
- **The development router**, which is excluded from the production build.

## What an auditor can be shown

For any requirement: who owned it, when they signed it, in what role, what the answers said at that moment, which documents were attached and the hash of each, and whether anything in that chain has been edited since. Produced from rows that were written while the work happened, which is the only kind of evidence that is cheap to produce and hard to fabricate.
