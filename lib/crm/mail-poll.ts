/**
 * The mail poll: puts the emails Resend has sent onto the recipients' contacts in
 * Close, each as a logged email with its sender, recipient, subject, plain-text body
 * and the time it was sent. It runs as the last step of the close-sync (./sync), after
 * the people are in Close.
 *
 * Where it stops. It reads Resend's list from the newest mail down and stops at the
 * second mail it already dealt with (a row in close_resend_log), the way you stop
 * reading a feed at the first things you have seen. On an empty log there is nothing
 * to meet, so the first run reads everything Resend still holds (about 30 days) and
 * the history is caught up over several runs.
 *
 * Why oldest first. The unseen mails are collected newest first but written oldest
 * first. If a run ends early (a budget, an outage, a mail still on its way), what is
 * done is the older part and what is left is the newer part, which the next walk meets
 * before it reaches anything it already did. Written newest first, an interrupted run
 * would leave a hole in the middle that the stop rule can never see again.
 *
 * A mail is logged only once it is settled, after its emails are written; a failure to
 * reach Close or Resend ends the poll and leaves that mail for the next run.
 *
 * The body is one more Resend request per mail (the list carries none), so a run stops
 * on a time budget as well as a count, and the history arrives over more runs.
 */
import type { CloseClient, CloseLink, CloseResult } from "./close";
import { classifyMail, type MailSources } from "./mail-rules";
import type { ResendClient, ResendMail } from "./resend-history";

/**
 * Which way of writing mail to Close this code stands for; see close_resend_log.format.
 * 1 was a one-line note per mail, 2 is a logged email. Raise it to redo all history.
 */
export const MAIL_LOG_FORMAT = 2;
/** Mails already dealt with that end the walk. */
export const KNOWN_TO_STOP = 2;
/** Resend keeps about 30 days; this is a ceiling, not a target (60 pages = 6,000 mails). */
export const MAX_PAGES = 60;
/** Emails written to Close per run; the rest waits for the next run. */
export const MAX_ENTRIES_PER_RUN = 300;
/** A run stops starting new mails after this long, so "Run now" answers in reasonable time. */
export const RUN_BUDGET_MS = 120_000;
/** Resend allows two requests a second. */
const RESEND_PAUSE_MS = 600;
/** Close takes long bodies, but a newsletter past this is not worth a CRM record. */
const MAX_BODY_CHARS = 30_000;

export type MailOutcome =
  | "noted"
  | "skipped_not_listed"
  | "skipped_not_delivered"
  | "skipped_no_contact";

export type MailLogRow = {
  readonly resendId: string;
  readonly sentAt: Date;
  readonly outcome: MailOutcome;
  /**
   * Emails written to Close for this mail, one per recipient found there. The column
   * is still called notes, from before the entries became emails.
   */
  readonly notes: number;
};

export interface MailStore {
  /** Which of these Resend email ids already have a row. */
  knownMail(ids: readonly string[]): Promise<ReadonlySet<string>>;
  recordMail(row: MailLogRow): Promise<void>;
}

export type MailPoll = {
  readonly resend: ResendClient;
  readonly sources: MailSources;
  /** Wait between Resend requests; tests pass 0. */
  readonly pauseMs?: number;
  /** How long a run keeps starting new mails; tests shorten it. */
  readonly budgetMs?: number;
};

export type MailPollResult = {
  /** Emails written to Close this run. */
  readonly noted: number;
  /** Mails logged without an email: not listed, not delivered, or nobody in Close. */
  readonly skipped: number;
  /** Mails seen and left for the next run (budget, still on its way, or an early end). */
  readonly pending: number;
  readonly stopped: string | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Unseen mails, newest first, down to the second one already dealt with. */
async function collectUnseen(
  poll: MailPoll,
  store: MailStore,
): Promise<CloseResult<ResendMail[]>> {
  const unseen: ResendMail[] = [];
  let known = 0;
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const listed = await poll.resend.list(after);
    if (!listed.ok) return listed;
    const seen = await store.knownMail(listed.value.mails.map((m) => m.id));
    for (const mail of listed.value.mails) {
      if (!seen.has(mail.id)) {
        unseen.push(mail);
        continue;
      }
      known += 1;
      if (known >= KNOWN_TO_STOP) return { ok: true, value: unseen };
    }
    const last = listed.value.mails.at(-1);
    if (!listed.value.hasMore || !last) return { ok: true, value: unseen };
    after = last.id;
    await sleep(poll.pauseMs ?? RESEND_PAUSE_MS);
  }
  return { ok: true, value: unseen };
}

type Contacts = Map<string, CloseLink | null>;

/** The contact holding this address; a refusal about one address is "not found", an outage is not. */
async function contactOf(
  close: CloseClient,
  contacts: Contacts,
  address: string,
): Promise<CloseResult<CloseLink | null>> {
  const cached = contacts.get(address);
  if (cached !== undefined) return { ok: true, value: cached };
  const found = await close.findContact(address);
  if (found.ok) contacts.set(address, found.value);
  return found.ok || found.kind === "unavailable" ? found : { ok: true, value: null };
}

/**
 * The mail's plain text, fetched once and only when someone in Close needs it. A mail
 * Resend no longer holds has no body, and is logged without one; an outage is not that.
 */
async function bodyOf(
  poll: MailPoll,
  mail: ResendMail,
): Promise<CloseResult<string | null>> {
  await sleep(poll.pauseMs ?? RESEND_PAUSE_MS);
  const body = await poll.resend.bodyText(mail.id);
  if (body.ok) return { ok: true, value: body.value?.slice(0, MAX_BODY_CHARS) ?? null };
  return body.kind === "rejected" ? { ok: true, value: null } : body;
}

/** One logged email per recipient who is a contact in Close; the count, or why it must stop. */
async function logRecipients(
  close: CloseClient,
  poll: MailPoll,
  contacts: Contacts,
  mail: ResendMail,
): Promise<{ readonly logged: number } | { readonly stopped: string }> {
  const addresses = [...new Set(mail.to.map((a) => a.trim().toLowerCase()))];
  const links = [];
  for (const address of addresses) {
    const contact = await contactOf(close, contacts, address);
    if (!contact.ok) return { stopped: contact.detail };
    if (contact.value) links.push({ address, link: contact.value });
  }
  if (links.length === 0) return { logged: 0 };

  const body = await bodyOf(poll, mail);
  if (!body.ok) return { stopped: body.detail };
  let logged = 0;
  for (const { address, link } of links) {
    const written = await close.logSentEmail(link, {
      sender: mail.from,
      to: address,
      subject: mail.subject,
      bodyText: body.value,
      sentAt: mail.sentAt,
    });
    if (written.ok) logged += 1;
    // Refused for this email (the lead was deleted since): nothing to write, nothing to retry.
    else if (written.kind === "unavailable") return { stopped: written.detail };
  }
  return { logged };
}

export async function pollMail(
  close: CloseClient,
  store: MailStore,
  poll: MailPoll,
  now: Date = new Date(),
): Promise<MailPollResult> {
  const unseen = await collectUnseen(poll, store);
  if (!unseen.ok) return { noted: 0, skipped: 0, pending: 0, stopped: unseen.detail };

  const queue = [...unseen.value].reverse();
  const contacts: Contacts = new Map();
  const started = Date.now();
  const budgetMs = poll.budgetMs ?? RUN_BUDGET_MS;
  let noted = 0;
  let skipped = 0;
  const end = (index: number, stopped: string | null): MailPollResult => ({
    noted,
    skipped,
    pending: queue.length - index,
    stopped,
  });

  for (const [index, mail] of queue.entries()) {
    // At least one mail per run, so a budget of zero still makes progress.
    const outOfTime = index > 0 && Date.now() - started >= budgetMs;
    if (noted >= MAX_ENTRIES_PER_RUN || outOfTime) return end(index, null);
    const verdict = classifyMail(mail, poll.sources, now);
    if (verdict.kind === "wait") return end(index, null);

    const log = (outcome: MailOutcome, notes: number) =>
      store.recordMail({ resendId: mail.id, sentAt: mail.sentAt, outcome, notes });

    if (verdict.kind === "skip") {
      await log(verdict.outcome, 0);
      skipped += 1;
      continue;
    }
    const written = await logRecipients(close, poll, contacts, mail);
    if ("stopped" in written) return end(index, written.stopped);
    noted += written.logged;
    if (written.logged > 0) {
      await log("noted", written.logged);
    } else {
      await log("skipped_no_contact", 0);
      skipped += 1;
    }
  }
  return end(queue.length, null);
}
