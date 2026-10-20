/**
 * The mail poll: puts the emails Resend has sent onto the recipients' contacts in
 * Close, as notes dated when each mail was sent. It runs as the last step of the
 * close-sync (./sync), after the people are in Close.
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
 * A mail is logged only once it is settled, after its notes are written; a failure to
 * reach Close or Resend ends the poll and leaves that mail for the next run.
 */
import type { CloseClient, CloseLink, CloseResult } from "./close";
import { classifyMail, type MailSources } from "./mail-rules";
import type { ResendClient, ResendMail } from "./resend-history";

/** Mails already dealt with that end the walk. */
export const KNOWN_TO_STOP = 2;
/** Resend keeps about 30 days; this is a ceiling, not a target (60 pages = 6,000 mails). */
export const MAX_PAGES = 60;
/** Notes written per run; the rest waits for the next run. */
export const MAX_NOTES_PER_RUN = 300;
/** Resend allows two requests a second. */
const RESEND_PAUSE_MS = 600;

export type MailOutcome =
  | "noted"
  | "skipped_not_listed"
  | "skipped_not_delivered"
  | "skipped_no_contact";

export type MailLogRow = {
  readonly resendId: string;
  readonly sentAt: Date;
  readonly outcome: MailOutcome;
  /** Notes written for this mail, one per recipient found in Close. */
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
  /** Wait between Resend pages; tests pass 0. */
  readonly pauseMs?: number;
};

export type MailPollResult = {
  /** Notes written to Close this run. */
  readonly noted: number;
  /** Mails logged without a note: not listed, not delivered, or nobody in Close. */
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

/** One note per recipient who is a contact in Close; the count, or why it must stop. */
async function noteRecipients(
  close: CloseClient,
  contacts: Contacts,
  mail: ResendMail,
  text: string,
): Promise<{ readonly notes: number } | { readonly stopped: string }> {
  const addresses = [...new Set(mail.to.map((a) => a.trim().toLowerCase()))];
  let notes = 0;
  for (const address of addresses) {
    const contact = await contactOf(close, contacts, address);
    if (!contact.ok) return { stopped: contact.detail };
    if (!contact.value) continue;
    const written = await close.addNote(contact.value, text, mail.sentAt);
    if (written.ok) notes += 1;
    // Refused for this note (the lead was deleted since): nothing to write, nothing to retry.
    else if (written.kind === "unavailable") return { stopped: written.detail };
  }
  return { notes };
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
  let noted = 0;
  let skipped = 0;
  const end = (index: number, stopped: string | null): MailPollResult => ({
    noted,
    skipped,
    pending: queue.length - index,
    stopped,
  });

  for (const [index, mail] of queue.entries()) {
    if (noted >= MAX_NOTES_PER_RUN) return end(index, null);
    const verdict = classifyMail(mail, poll.sources, now);
    if (verdict.kind === "wait") return end(index, null);

    const log = (outcome: MailOutcome, notes: number) =>
      store.recordMail({ resendId: mail.id, sentAt: mail.sentAt, outcome, notes });

    if (verdict.kind === "skip") {
      await log(verdict.outcome, 0);
      skipped += 1;
      continue;
    }
    const written = await noteRecipients(close, contacts, mail, verdict.text);
    if ("stopped" in written) return end(index, written.stopped);
    noted += written.notes;
    if (written.notes > 0) {
      await log("noted", written.notes);
    } else {
      await log("skipped_no_contact", 0);
      skipped += 1;
    }
  }
  return end(queue.length, null);
}
