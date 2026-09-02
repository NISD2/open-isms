Registration verifies the address with a one-time code, so email is what stands between a running instance and a first login.

## Getting in before you have configured anything

With no mail provider set, the code is written to the container log instead of being sent. Register in the browser, then:

```bash
docker compose logs app | grep "sign-in code"
```

```text
[mail] No RESEND_API_KEY is set, so nothing was sent. The sign-in code for you@example.com is 481920.
```

That exists so a correct install does not look like a broken one: sign-up used to report success while the code went nowhere.

It is enough for one administrator on a machine only they can reach, and it is the wrong place to stop once other people have accounts, because anyone who can read the container log can take over an account. On a single-organisation self-host that person already holds the Docker socket, which is root on the host and a shell in the database, so the log is not the weak link. It never happens on an instance with `RESEND_API_KEY` set.

## Option 1: Resend

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

## Option 2: Google OAuth only

```ini
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Google asserts that the address is verified, so this path skips the one-time code entirely. An instance where every user has a Google Workspace account can run with no mail provider at all.

Only verified Google addresses are accepted. Users who signed up with email and password and later sign in with Google on the same address end up on one account.

## There is no SMTP transport

The code sends through the Resend HTTP API. There is no nodemailer, no SMTP host setting, and setting one in `.env` will do nothing.

If you need SMTP, the change is contained: `lib/mail/resend.ts` is the client, and everything above it goes through one `sendMail` function. A pull request that adds a transport switch would be welcome, and is the cleanest way to make this stack work on a network with no outbound HTTPS to a mail vendor.

## What email is used for

| Message | Trigger |
|---|---|
| Registration code | Sign-up, and any later address verification |
| Password reset | The forgot-password flow |
| Deadline reminders | The `/api/cron/deadlines` job, if you schedule it |
| Course reminders | The `/api/cron/course-reminders` job, if you schedule it |
| Supplier invitations | Sending a questionnaire to a supplier |
| Newsletter | Only if you operate one |

Turn all of it off with `DISABLE_EMAIL=1`, which is the right setting for a staging copy of production data. Nobody gets a reminder addressed to a real person from a test instance.

## Known gap

The welcome mail is English regardless of the recipient's language, because no locale is stored at that point in the flow. Every other template follows the recipient's locale. That is a real defect rather than a design decision, and it is on the list.
