Three endpoints do scheduled work. None runs on its own: nothing inside the container has a timer, so an instance where these are never called simply never does any of it.

| Path | Suggested schedule (UTC) | |
|---|---|---|
| `/api/cron/deadlines` | `0 6 * * *` | the daily heartbeat, seven phases |
| `/api/cron/course-reminders` | `0 7 * * *` | follow-ups for people who started a course and have not finished |
| `/api/cron/lifecycle` | `0 8 * * *` | one-time re-engagement emails, e.g. the activation nudge for quiet accounts with open path steps |

## What the daily heartbeat actually does

Calling it "deadline reminders" undersells it. One request runs seven phases in order:

1. **Status transitions.** Requirements whose next review date has passed move to `needs_review`.
2. **Backfill.** Requirements with no review date get one, computed from their priority.
3. **Notification scheduling.** Reminders are created for approaching deadlines.
4. **Escalation.** Overdue items move through the escalation chain.
5. **Digest compilation.** Pending notifications are batched into the daily or weekly digest and sent, then marked sent.
6. **Supplier broadcasts.** Queued supplier publication events, incident notifications among them, are drained. The synchronous fan-out at publish time is the fast path; this is the safety net for the ones that failed.
7. **GDPR retention.** Erasure records past their three-year window are minimised, leaving only the pseudonymous fingerprint and dropping the raw email.

Skip it and none of that happens. Requirements stay in the status they were last given, escalation never fires, queued supplier notifications sit in the queue, and erasure records keep an email address they were supposed to shed. Phase 7 in particular is a compliance obligation of your own, not a convenience.

## Lifecycle emails

Scheduling this one is optional, and nisd2.eu deliberately does not. Re-engagement mail goes to people who have gone quiet, and the cost of getting it wrong is paid by a real person's inbox, so the platform admin carries a send console instead: it shows exactly who is queued, lets you choose how many to send, and sends only when somebody presses the button. If you would rather a human approve every batch, skip the schedule below and use that. If you would rather it run itself, schedule it — the endpoint and the console share the same selection and the same at-most-once guarantee, so neither can double-send.

`/api/cron/lifecycle` sends the one-shot re-engagement emails. Each user receives each email type at most once, ever: the send is recorded in the database before the email goes out, and a unique index makes a second send impossible even if two runs overlap. On an instance with no mail transport configured, meaning neither `SMTP_HOST` nor `RESEND_API_KEY`, the endpoint reports `skipped` and records nothing, so enabling email later starts with a clean slate. Users with `emailFollowupsDisabled` are never selected, and every one of these emails carries an unsubscribe link that sets exactly that flag.

Who gets the first campaign (the activation nudge): accounts with a verified email, a company, at least one open step on the NIS 2 path, and no sign-in or recorded activity for 3 days or more. Selection runs oldest-dormant first.

Reading the response. `{"skipped": ...}` means the run did nothing on purpose (no mail transport, or another run was still in flight). Otherwise you get per-type stats:

| Field | Meaning |
|---|---|
| `prepared` | users eligible this run |
| `sent` | emails handed to the mail provider |
| `deferred` | eligible but past the 100-per-run cap; tomorrow's run takes them, oldest first |
| `alreadyClaimed` | claimed by an earlier or concurrent run; nothing sent, nothing lost |
| `released` | claim rolled back because the transport was suppressed mid-run |
| `optedOut` | unsubscribed between selection and send |
| `failed` | transport failed after retries; see below |
| `error` | this email type could not run at all; the endpoint also returns HTTP 500 so a `curl -f` cron line goes red |

A `failed` send keeps its database row so the user cannot be double-mailed, marked with `urgency = 'warning'` and paired with an `email.lifecycle_failed` row in the audit log naming the address. If you decide the email never arrived and want that one user re-armed, delete the claim:

```sql
DELETE FROM notification
WHERE entity_type = 'lifecycle_email' AND urgency = 'warning'
  AND recipient_id = '<user id from the audit row>';
```

On a large backlog the request can stay open for a minute or two (sends are paced to the mail provider's rate limit). If your reverse proxy times out first, the run still completes server-side and the stats land in the audit log under `cron.lifecycle`; do not re-trigger in a loop, the next scheduled run continues where this one stopped.

First rollout, done carefully. Two query parameters (valid only with the bearer token) turn the endpoint into its own canary:

```bash
# 1. See who would get what. Sends nothing, records nothing.
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://isms.example.com/api/cron/lifecycle?dryRun=1" | jq

# 2. First real run to exactly one person (oldest-dormant first).
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://isms.example.com/api/cron/lifecycle?limit=1" | jq

# 3. Ramp: limit=5, then limit=25, then no limit. Then add the schedule.
```

`limit` can only lower the built-in per-run cap, never raise it. The platform admin's Emails tab also has "Send me a test nudge", which delivers the rendered email to your own mailbox without touching any claim.

## Authentication

All three endpoints check a bearer token against `CRON_SECRET`. With the variable unset they return 500 and `CRON_SECRET not configured` rather than running unauthenticated, so an empty value is a closed door and not an open one.

```ini
CRON_SECRET=   # openssl rand -hex 32
```

## Scheduling them

Anything that can make an HTTP request will do. From the host's crontab:

```bash
0 6 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://isms.example.com/api/cron/deadlines > /dev/null
0 7 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://isms.example.com/api/cron/course-reminders > /dev/null
0 8 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://isms.example.com/api/cron/lifecycle > /dev/null
```

Use the public URL rather than `localhost`, so the request passes through the same proxy a browser would, and keep `-f` so a failing job shows up as a failing cron line rather than a silent 500.

All three are safe to run more than once a day. Work is selected by what is due and what has not yet been marked sent, so a second call in the same day finds little to do. Users with `emailFollowupsDisabled` are skipped entirely by the course and lifecycle jobs.

## Checking that it ran

The response body is a JSON summary with a count per phase, which is worth logging somewhere you will see it:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://isms.example.com/api/cron/deadlines | jq
```
