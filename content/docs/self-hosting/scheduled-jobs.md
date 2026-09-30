Five endpoints do scheduled work. Four of them run only when something calls them: nothing inside the container has a timer for them, so an instance where they are never called simply never does any of it. The fifth, the Close CRM sync, runs by itself inside the app every 30 minutes once `CLOSE_API_KEY` is set, and its endpoint is only for running it by hand.

| Path | Suggested schedule (UTC) | |
|---|---|---|
| `/api/cron/deadlines` | `0 6 * * *` | the daily heartbeat, eight phases |
| `/api/cron/course-reminders` | `0 7 * * *` | follow-ups for people who started a course and have not finished |
| `/api/cron/lifecycle` | `0 8 * * *` | one-time re-engagement emails, e.g. the activation nudge for quiet accounts with open path steps |
| `/api/cron/indexnow` | `0 5 * * *` | only if you set an IndexNow key: tells Bing and others which public pages changed |
| `/api/cron/close-sync` | none, runs itself | only if you use the Close CRM: keeps a lead per account there, up to date |

## What the daily heartbeat actually does

Calling it "deadline reminders" undersells it. One request runs eight phases in order:

1. **Status transitions.** Requirements whose next review date has passed move to `needs_review`.
2. **Backfill.** Requirements with no review date get one, computed from their priority.
3. **Notification scheduling.** Reminders are created for approaching deadlines.
4. **Escalation.** Overdue items move through the escalation chain.
5. **Digest compilation.** Pending notifications are batched into the daily or weekly digest and sent, then marked sent.
6. **Supplier broadcasts.** Queued supplier publication events, incident notifications among them, are drained. The synchronous fan-out at publish time is the fast path; this is the safety net for the ones that failed.
7. **GDPR retention.** Erasure records past their three-year window are minimised, leaving only the pseudonymous fingerprint and dropping the raw email.
8. **GDPR stored files.** When an erasure tore an organization down but could not delete all of its uploaded files from object storage, the deletion is tried again. Until it succeeds, that erasure's certificate says the files are outstanding. After 14 days the addresses in `PLATFORM_ADMIN_EMAILS` get an email to finish it by hand. That email is tried again each day until it has actually gone out, which it cannot while `PLATFORM_ADMIN_EMAILS` is empty or mail is off, and only then does the certificate say an operator has the rest. Deleting files nothing points at any more needs the storage credentials to allow listing the bucket (`s3:ListBucket` on AWS).

Skip it and none of that happens. Requirements stay in the status they were last given, escalation never fires, queued supplier notifications sit in the queue, erasure records keep an email address they were supposed to shed, and files an erasure could not delete stay in the bucket. Phases 7 and 8 in particular are compliance obligations of your own, not a convenience.

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

## Close CRM sync

Skip this unless you set `CLOSE_API_KEY`. Without it nothing runs, the endpoint answers `{"skipped": ...}` and nothing leaves the instance.

With a key, the app runs the sync by itself every 30 minutes, starting two minutes after the server boots. You schedule nothing. It only ever runs on a production build whose `NEXT_PUBLIC_APP_URL` is not a local address, so `next dev` or a local container with a copied key answers `skipped` instead of writing a local database into your live CRM. Runs take a Postgres advisory lock, so with several containers, or during a deploy when old and new overlap, only one runs at a time, and a manual call to `/api/cron/close-sync` while one is running answers `skipped`. Every run lands in the audit log as `cron.close_sync`, or `cron.close_sync.error` when it failed.

With a key, the job keeps every verified account in Close and writes what the platform knows into custom fields. Facts about the person go on their contact: when they signed up and last logged in, how often they logged in, whether they are grandfathered, may be emailed or use a free mail address, their CEO course progress and their access level. Facts about their company go on the lead: name, sector, size, country, supplier role and NIS 2 path progress; someone without a company on the platform writes none. Colleagues on one company lead therefore never overwrite each other. You choose which of these to sync with `CLOSE_FIELD_IDS`; `.env.example` lists each key, whether to create it as a contact or a lead field in Close, and its type. The platform owns those fields and overwrites them on every change, so do not edit them in Close by hand.

Each run:

1. Deletes erased accounts from Close. Erasing a user on the platform leaves only the Close ids behind in `close_crm_sync`. The run deletes the person's contact, wherever it sits by now, and the lead too when the job created it and nobody else is on it; if others are on it, the lead stays and loses the person's name as its title. Then it deletes that row.
2. Reads objections back, if you set `CLOSE_SUPPRESSED_STATUS_ID` to the lead status your sales team uses for "objected to contact". Everyone on a lead in that status gets all optional platform email switched off, recorded like an unsubscribe with source `crm` and in the audit log, so an objection taken on the phone holds for the platform's emails too. While the lead stays in that status, the opt-out is written back even if the person resubscribes on the platform; sales lifts it by changing the status.
3. Links new accounts. It searches Close for a contact with the account's email address. If one exists, as with people you imported by hand, the job writes its fields onto that contact and lead; otherwise it creates a lead with your `CLOSE_SIGNUP_STATUS_ID`.
4. Updates changed accounts. The job stores a fingerprint of the values it last wrote. When a fact changes, or you add a field id, the fingerprint no longer matches and the person is updated, so a new field reaches everyone already in Close over the next runs.

At most 50 accounts per run, new ones first. When a lead was merged in Close, the job follows the contact by its id, then by email, to the lead it now sits on. When the contact was deleted in Close, the job leaves that person alone and never creates them again.

Reading the result (in the audit log, or the response of a manual call): `created`, `linked`, `updated` and `erased` count this run's work, `optedOut` the accounts newly switched off because sales suppressed them, `refused` the accounts Close turned down because of their own data (retried on later runs), `gaveUp` the ones skipped for good, and `pending` what is left for the next run. After five refusals an account is skipped; `close_crm_sync.last_error` names what Close objected to, and setting `rejected_count` back to 0 retries it.

Two things stop a run at once and name the reason in `stopped`: Close being unavailable (down, rate limiting, the key refused, or an answer the job does not recognise), and Close refusing anything other than a person's own name or address, which means a setting is wrong for everyone: a field in `CLOSE_FIELD_IDS` with the wrong type, level or choices, or a wrong `CLOSE_SIGNUP_STATUS_ID`. Nobody is counted against for either; fix the cause and the next run continues. A stopped run, or one where Close refused an erasure (`erasureRefused`), is logged as `cron.close_sync.error` and a manual call answers HTTP 500.

## Authentication

All five endpoints check a bearer token against `CRON_SECRET`. With the variable unset they return 500 and `CRON_SECRET not configured` rather than running unauthenticated, so an empty value is a closed door and not an open one.

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
0 5 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://isms.example.com/api/cron/indexnow > /dev/null
```

The Close sync needs no line here; it schedules itself.

Use the public URL rather than `localhost`, so the request passes through the same proxy a browser would, and keep `-f` so a failing job shows up as a failing cron line rather than a silent 500.

All five are safe to run more than once a day. Work is selected by what is due and what has not yet been marked sent, so a second call in the same day finds little to do. Users with `emailFollowupsDisabled` are skipped entirely by the course and lifecycle jobs.

## Checking that it ran

The response body is a JSON summary with a count per phase, which is worth logging somewhere you will see it:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://isms.example.com/api/cron/deadlines | jq
```
