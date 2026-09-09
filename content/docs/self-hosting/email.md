Registration verifies the address with a one-time code, so email is what stands between a running instance and a first login.

There are three ways to deal with that, and you need exactly one of them.

| | What it is | Gets you in | Lets you add people |
|---|---|---|---|
| **Bootstrap admin** | Two environment variables. No mail of any kind. | Yes | **No** |
| **SMTP** | Your own relay. | Yes | Yes |
| **Resend** | A hosted mail API. | Yes | Yes |

Resend is not required and never was. It is what nisd2.eu happens to run; SMTP is a first-class transport, not a fallback, and it is the one that keeps working on a network that cannot reach a hosted API.

**The bootstrap admin is a one-person answer.** It creates your account and nothing else. Every other person who needs access gets there through an invitation, and an invitation is an email, so the moment there is a second person you need SMTP or Resend. The app is explicit about this rather than quiet: inviting somebody on an instance with no transport still creates the invite and gives you the link, and says the link is yours to deliver instead of claiming a message was sent.

You can also skip the whole question with Google OAuth, which is covered at the end: Google asserts the address is verified, so no code is ever needed.

## Bootstrap admin: no mail at all

Two environment variables create the first account at startup, so there is no code to wait for and nothing to configure:

```ini
BOOTSTRAP_ADMIN_EMAIL=you@example.com
BOOTSTRAP_ADMIN_PASSWORD=a-password-you-choose
```

Start the stack, then sign in with exactly those credentials. The log says so:

```text
[bootstrap] created you@example.com. Sign in, create your organisation, and then remove BOOTSTRAP_ADMIN_PASSWORD from the environment.
```

What it does and does not do, precisely:

- It writes the same row registering would have written: same bcrypt cost, the same `member` role, no organisation. Creating your first organisation promotes you to admin through the ordinary path, so this grants nothing that signing up would not have. The name "admin" is about who this is for, not about a privilege level.
- It runs only when **both** variables are set, and only when that address has no account yet. An existing account is never touched.
- It is deliberately not an upsert. A variable that rewrote the password on every restart would be a backdoor with a friendly name: anyone who could read the compose file would own the account permanently, and a password you changed in the app would revert on the next deploy.
- The password is hashed before it is stored, exactly as the sign-up form does it. It is not kept anywhere in plaintext except your `.env`.
- A password shorter than 8 characters, or a malformed address, is refused with a message in the log and the instance starts anyway. It does not crash-loop over a typo.

Remove `BOOTSTRAP_ADMIN_PASSWORD` once you are in. Leaving it set is not a live backdoor, because the account already exists and the value is then ignored, but a password sitting in an environment file is worth deleting on principle.

This is the whole answer for a single-operator instance: no SMTP, no Resend, no Google, no mail server of any kind. The moment a second person needs an account, they need a code, and a code needs one of the transports below.

### If you would rather not set the variables

There is a second way in with no mail, and it predates the one above. With no transport set, the sign-in code is written to the container log instead of being sent. Register in the browser, then:

```bash
docker compose logs app | grep "sign-in code"
```

```text
[mail] No mail transport is configured, so nothing was sent. The sign-in code for you@example.com is 481920.
```

That exists so a correct install does not look like a broken one: sign-up used to report success while the code went nowhere. The bootstrap variables are the tidier version of the same idea, and they are what the installation guide uses.

Either way the limit is the same: it is enough for one administrator on a machine only they can reach, and the wrong place to stop once other people have accounts, because anyone who can read the container log can take over an account. On a single-organisation self-host that person already holds the Docker socket, which is root on the host and a shell in the database, so the log is not the weak link. Neither happens on an instance with a transport configured.

## SMTP: your own relay

Set `SMTP_HOST` and it is selected, even if a Resend key is also present.

```ini
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=openisms@example.com
SMTP_PASSWORD=...
MAIL_FROM_EMAIL=noreply@example.com
```

`MAIL_FROM_EMAIL` is not optional here, and the app refuses to send without it rather than falling back. The fallback would be this project's own `noreply@nisd2.eu`, which is a domain you do not own: your relay would either reject the message or deliver mail your recipients cannot reply to. The refusal names the variable, and shows up in the log and on the platform-admin email page. `MAIL_FROM_NAME` is worth setting too, since it is the first thing a recipient reads; it defaults to `NISD2`, which will mean nothing to your colleagues.

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

## Resend

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

## Google OAuth, instead of any of them

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

## When a send fails

A send that fails is recorded rather than swallowed. Most of the code that sends mail is deliberately fire-and-forget, because a broken notification must not fail the action that triggered it, and for a long time that meant a failure left no trace anywhere. It now leaves two.

In the container log:

```bash
docker compose logs app | grep "\[mail\] send failed"
```

```text
[mail] send failed type=work.review_decision to=jan@example.com: Invalid login: 535 Authentication failed
```

And in the app, on the **email** tab of `/platform-admin`, as a **Failed sends** card listing the last 30 days: what failed, for whom, and the reason the transport gave. The card is absent when there is nothing wrong, so its presence is the signal.

Both are written from one place inside the send path rather than at each call site, so a failure does not depend on the calling code having remembered to check a return value.

What it does not do is retry later. Three attempts happen inside the send itself, with a short backoff; after that the message is gone and the record is what remains. For a registration code that is fine, because the person will ask for another one. For a deadline reminder it means one reminder was missed, so a card with entries in it is worth reading rather than dismissing.

## What language email arrives in

| Message | Languages |
|---|---|
| Registration and password-reset codes | Ten. They follow the language of the page that asked for them, and the choice is stored on the account. |
| Re-engagement nudges | German, English, Dutch, resolved from the stored language, then the organisation's country, then German. |
| The opt-out footer on optional mail | German, English, Dutch, following the recipient. |
| Everything else | English. |

That last row covers the digests, assignment notices, review decisions, invitations and the welcome mail. It is a real gap rather than a design decision: a German recipient gets English copy above a German opt-out line, which is at least honest about which half is translated. The footer follows the recipient rather than the body on purpose, because the preference centre it links to has to open in a language they can read.
