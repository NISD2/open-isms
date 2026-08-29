Two endpoints do scheduled work. Neither runs on its own: nothing inside the container has a timer, so an instance where these are never called simply never does any of it.

| Path | Suggested schedule (UTC) | |
|---|---|---|
| `/api/cron/deadlines` | `0 6 * * *` | the daily heartbeat, seven phases |
| `/api/cron/course-reminders` | `0 7 * * *` | follow-ups for people who started a course and have not finished |

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

## Authentication

Both endpoints check a bearer token against `CRON_SECRET`. With the variable unset they return 500 and `CRON_SECRET not configured` rather than running unauthenticated, so an empty value is a closed door and not an open one.

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
```

Use the public URL rather than `localhost`, so the request passes through the same proxy a browser would, and keep `-f` so a failing job shows up as a failing cron line rather than a silent 500.

Both are safe to run more than once a day. Work is selected by what is due and what has not yet been marked sent, so a second call in the same day finds little to do. Users with `emailFollowupsDisabled` are skipped entirely by the course job.

## Checking that it ran

The response body is a JSON summary with a count per phase, which is worth logging somewhere you will see it:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://isms.example.com/api/cron/deadlines | jq
```
