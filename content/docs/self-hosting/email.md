Registration verifies the address with a one-time code, so email is what stands between a running instance and a first login.

## Getting in before you have configured anything

With no mail provider set, the code is written to the container log instead of being sent. Register in the browser, then:

```bash
docker compose logs app | grep "sign-in code"
```

```text
[mail] No mail transport is configured, so nothing was sent. The sign-in code for you@example.com is 481920.
```

That exists so a correct install does not look like a broken one: sign-up used to report success while the code went nowhere.

It is enough to create your own account and look around. It is not enough to invite anyone, because the second person's code goes to the same log rather than to them.

It is enough for one administrator on a machine only they can reach, and it is the wrong place to stop once other people have accounts, because anyone who can read the container log can take over an account. On a single-organisation self-host that person already holds the Docker socket, which is root on the host and a shell in the database, so the log is not the weak link. It never happens on an instance with `RESEND_API_KEY` set.

## Option 1: your own SMTP relay

Set `SMTP_HOST` and it is selected, even if a Resend key is also present.

```ini
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=openisms@example.com
SMTP_PASSWORD=...
MAIL_FROM_EMAIL=noreply@example.com
```

Port 587 opens in the clear and upgrades with STARTTLS, which is what most relays want and what happens by default. Port 465 turns on implicit TLS by itself. `SMTP_SECURE` overrides that pairing for a relay that disagrees.

`SMTP_ALLOW_SELF_SIGNED=1` turns off certificate verification for an internal relay whose certificate you signed yourself. It removes the guarantee that you are talking to the server you think you are, so it belongs on a network you control and nowhere else.

This is also what makes an air-gapped instance workable: a relay inside your own network is reachable where a hosted mail API is not.

### Trying it without any mail account at all

The `mail` profile starts a Mailpit container that accepts everything the app sends and shows it in a web inbox. Nothing leaves the machine.

```ini
COMPOSE_PROFILES=minio,backup,mail
SMTP_HOST=mailpit
SMTP_PORT=1025
MAIL_FROM_EMAIL=noreply@example.test
```

Then `docker compose up -d`, register in the browser, and read the code out of the inbox at <http://localhost:8025>. Building from source with the repository's own `docker-compose.yml` instead? Same thing, spelled `docker compose --profile mail up -d`.

Mailpit holds mail in memory, so restarting it empties the inbox, and its SMTP port stays on the compose network rather than being published to your host. It is for evaluating the stack, not for running it: it cannot deliver to a real address.

## Option 2: Resend

```ini
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=isms@example.com
```

The From address has to be on a domain you have verified in Resend, or their API rejects the send. That verification is a prerequisite for the first login, not an optional extra, so do it before you invite anyone.

Optional, once that works:

```ini
RESEND_FROM_EMAIL_NEWS=news@example.com   # separate mailbox for newsletter sends
NEWSLETTER_REPLY_TO=hello@example.com
SUPPORT_EMAIL=support@example.com
```

`SUPPORT_EMAIL` is read in three places: the reply-to on outbound mail, the
contact on `/email/unsubscribed`, and the address the in-product help dialog
offers a signed-in user. Leave it unset and the help dialog renders no address
row rather than a placeholder one, so an instance never publishes a mailbox its
operator did not choose.

`RESEND_FROM_EMAIL` still works as the From address and is what existing deployments set. `MAIL_FROM_EMAIL` is the name to use on a new instance, and takes precedence when both are present.

## Option 3: Google OAuth only

```ini
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Google asserts that the address is verified, so this path skips the one-time code entirely. An instance where every user has a Google Workspace account can run with no mail provider at all.

Only verified Google addresses are accepted. Users who signed up with email and password and later sign in with Google on the same address end up on one account.

## What email is used for

| Message | Trigger |
|---|---|
| Registration code | Sign-up, and any later address verification |
| Password reset | The forgot-password flow |
| Deadline reminders | The `/api/cron/deadlines` job, if you schedule it |
| Course reminders | The `/api/cron/course-reminders` job, if you schedule it |
| Re-engagement nudges | The `/api/cron/lifecycle` job, if you schedule it |
| Supplier invitations | Sending a questionnaire to a supplier |
| Newsletter | Only if you operate one |

Turn all of it off with `DISABLE_EMAIL=1`, which is the right setting for a staging copy of production data. Nobody gets a reminder addressed to a real person from a test instance.

## Known gap

The welcome mail is English regardless of the recipient's language. The signup locale is now stored on the account and the lifecycle nudges use it; the registration and reset codes follow the language of the page that requested them; the welcome mail uses neither yet. That is a real defect rather than a design decision, and it is on the list.
