/**
 * The close-sync: keeps every verified account in Close, with the platform's facts
 * about the person on their contact and about their company on the lead
 * (./fields). The database side is ./store and the schedule is ./schedule; this
 * module decides and calls Close, so it is tested without either.
 *
 * Each run:
 *  1. Erasures first. Deleting a user leaves its close_crm_sync row with user_id
 *     null. The run deletes the person's contact in Close, wherever it sits by now,
 *     and the lead too when the sync created it and nobody else is left on it.
 *  2. Everyone else is compared with what was last written. A person with no link
 *     is looked up by email and linked to the contact Close already holds, or gets
 *     a new lead. A linked person whose values changed is updated. When the link
 *     no longer answers (a merge in Close), the contact is followed by its id, then
 *     by email; when it is gone for good the person is left alone, never recreated.
 *
 * New people first, newest signup first, then updates, then people Close refused
 * before; at most MAX_PER_RUN per run. A refusal about the person (their name or
 * address) is recorded and the run carries on; after MAX_REFUSALS the person is
 * skipped. A refusal about a custom field is a setting that is wrong for everyone,
 * so it ends the run like an outage, and nobody is counted against.
 */
import "@/lib/server-guard";
import type { InferSelectModel } from "drizzle-orm";
import type { closeCrmSync } from "@/schema";
import {
  type CloseClient,
  type CloseFailure,
  type CloseLink,
  type CloseResult,
  type CloseSettings,
  closeClient,
  type FetchLike,
} from "./close";
import {
  type CloseFacts,
  type CloseFieldIds,
  type CloseFieldValues,
  closeFieldValues,
} from "./fields";
import { fingerprint } from "./fingerprint";

export const MAX_PER_RUN = 50;
export const MAX_REFUSALS = 5;

type SyncRow = InferSelectModel<typeof closeCrmSync>;
export type CloseSyncLinkRow = Pick<
  SyncRow,
  "leadId" | "contactId" | "createdLead" | "fieldsHash" | "rejectedCount"
>;
export type ErasedCloseRow = Pick<SyncRow, "id" | "leadId" | "contactId" | "createdLead">;

export interface CloseSyncPerson {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly facts: CloseFacts;
  readonly sync: CloseSyncLinkRow | null;
}

export interface CloseSyncStore {
  erased(): Promise<ErasedCloseRow[]>;
  people(): Promise<CloseSyncPerson[]>;
  linked(
    userId: string,
    link: CloseLink,
    createdLead: boolean,
    fieldsHash: string,
  ): Promise<void>;
  refused(userId: string, detail: string, giveUp: boolean): Promise<void>;
  forget(rowId: string): Promise<void>;
}

export type CloseSyncRunResult =
  | { readonly skipped: string }
  | {
      readonly erased: number;
      readonly created: number;
      readonly linked: number;
      readonly updated: number;
      readonly refused: number;
      /** Erasures Close turned down; retried every run, and the run counts as failed. */
      readonly erasureRefused: number;
      /** Skipped for good: refused MAX_REFUSALS times, or gone from Close. */
      readonly gaveUp: number;
      /** Work left for the next run, refused people included. */
      readonly pending: number;
      /** Why the run ended early: Close unavailable, or a field setting it refuses. */
      readonly stopped: string | null;
    };

const linkOf = (sync: CloseSyncLinkRow | null): CloseLink | null =>
  sync?.leadId && sync.contactId
    ? { leadId: sync.leadId, contactId: sync.contactId }
    : null;

interface Work {
  readonly person: CloseSyncPerson;
  readonly fields: CloseFieldValues;
  readonly fieldsHash: string;
}

/** Who needs writing this run, in the order to write them, and how many are skipped for good. */
export const planCloseSync = (
  people: readonly CloseSyncPerson[],
  fieldIds: CloseFieldIds,
): { readonly work: readonly Work[]; readonly gaveUp: number } => {
  const refusals = (p: CloseSyncPerson) => p.sync?.rejectedCount ?? 0;
  const active = people.filter((p) => refusals(p) < MAX_REFUSALS);
  const work = active.flatMap((person) => {
    const fields = closeFieldValues(person.facts, fieldIds);
    const fieldsHash = fingerprint(fields);
    const upToDate =
      linkOf(person.sync) !== null && person.sync?.fieldsHash === fieldsHash;
    return upToDate ? [] : [{ person, fields, fieldsHash }];
  });
  const isNew = (w: Work) => linkOf(w.person.sync) === null;
  return {
    work: [...work].sort(
      (a, b) =>
        refusals(a.person) - refusals(b.person) ||
        Number(isNew(b)) - Number(isNew(a)) ||
        b.person.facts.signedUpAt.getTime() - a.person.facts.signedUpAt.getTime(),
    ),
    gaveUp: people.length - active.length,
  };
};

type Done =
  | "erased"
  | "created"
  | "linked"
  | "updated"
  | "refused"
  | "gone"
  | "erasureRefused";
type Step = Done | { readonly stopped: string };

const isStop = (step: Step): step is { readonly stopped: string } =>
  typeof step === "object";

const isNotFound = (result: CloseResult<unknown>) =>
  !result.ok && result.kind === "rejected" && result.status === 404;

/** An outage, or a refused custom field (a setting wrong for everyone), ends the run. */
const stopFor = (failure: CloseFailure): Step | null => {
  if (failure.kind === "unavailable") return { stopped: failure.detail };
  const settings = failure.fields.filter((f) => f.startsWith("custom."));
  return settings.length > 0
    ? {
        stopped: `Close refused ${settings.join(", ")}: check that field's type, level and choices in Close`,
      }
    : null;
};

async function eraseRow(
  close: CloseClient,
  store: CloseSyncStore,
  row: ErasedCloseRow,
): Promise<Step> {
  const fail = (failure: CloseFailure): Step => stopFor(failure) ?? "erasureRefused";

  if (row.contactId) {
    // The contact carries the person's fields; deleting it by id finds it on any lead.
    const contact = await close.deleteContact(row.contactId);
    if (!contact.ok) return fail(contact);
  }
  if (row.createdLead && row.leadId) {
    // A lead the sync made for this person goes too, unless sales put others on it.
    const left = await close.leadContactCount(row.leadId);
    if (!left.ok) return fail(left);
    if (left.value === 0) {
      const lead = await close.deleteLead(row.leadId);
      if (!lead.ok) return fail(lead);
    }
  }
  await store.forget(row.id);
  return "erased";
}

async function write(
  close: CloseClient,
  link: CloseLink,
  fields: CloseFieldValues,
): Promise<CloseResult<null>> {
  const contact = await close.updateContact(link.contactId, fields.contact);
  return contact.ok ? close.updateLead(link.leadId, fields.lead) : contact;
}

async function syncPerson(
  close: CloseClient,
  store: CloseSyncStore,
  work: Work,
): Promise<Step> {
  const { person, fields, fieldsHash } = work;

  const refuse = async (failure: CloseFailure): Promise<Step> => {
    const stop = stopFor(failure);
    if (stop) return stop;
    await store.refused(person.userId, failure.detail, false);
    return "refused";
  };

  const link = linkOf(person.sync);
  if (link) {
    const written = await write(close, link, fields);
    if (written.ok) {
      await store.linked(
        person.userId,
        link,
        person.sync?.createdLead ?? false,
        fieldsHash,
      );
      return "updated";
    }
    if (!isNotFound(written)) return refuse(written);
  }

  // Not linked yet, or the link no longer answers: find the person in Close.
  const byId = link ? await close.getContact(link.contactId) : null;
  if (byId && !byId.ok) return refuse(byId);
  const byEmail = byId?.value ? null : await close.findContact(person.email);
  if (byEmail && !byEmail.ok) return refuse(byEmail);
  const found = byId?.value ?? byEmail?.value ?? null;

  if (found) {
    const written = await write(close, found, fields);
    if (!written.ok) return refuse(written);
    const sameLead = link !== null && found.leadId === link.leadId;
    await store.linked(
      person.userId,
      found,
      sameLead && (person.sync?.createdLead ?? false),
      fieldsHash,
    );
    return link ? "updated" : "linked";
  }
  if (link) {
    // Sales deleted this person in Close. Respect that rather than recreate them.
    await store.refused(person.userId, "contact no longer in Close", true);
    return "gone";
  }

  const created = await close.createLead(
    { name: person.name.trim() || person.email, email: person.email },
    fields,
  );
  if (!created.ok) return refuse(created);
  await store.linked(person.userId, created.value, true, fieldsHash);
  return "created";
}

/** One step per item, in order, until an item answers "stopped". */
async function stepThrough<T>(
  items: readonly T[],
  step: (item: T) => Promise<Step>,
): Promise<Step[]> {
  const steps: Step[] = [];
  for (const item of items) {
    const result = await step(item);
    steps.push(result);
    if (isStop(result)) break;
  }
  return steps;
}

/**
 * One run. Callers hold the advisory lock (./schedule), so runs never overlap
 * across servers.
 */
export async function runCloseSync(
  store: CloseSyncStore,
  settings: CloseSettings | null,
  fetchImpl: FetchLike = fetch,
): Promise<CloseSyncRunResult> {
  if (!settings) return { skipped: "CLOSE_API_KEY is not set" };
  const close = closeClient(settings, fetchImpl);

  const erasures = await stepThrough(await store.erased(), (row) =>
    eraseRow(close, store, row),
  );
  const plan = erasures.some(isStop)
    ? { work: [], gaveUp: 0 }
    : planCloseSync(await store.people(), settings.fieldIds);
  const syncs = await stepThrough(plan.work.slice(0, MAX_PER_RUN), (work) =>
    syncPerson(close, store, work),
  );

  const steps = [...erasures, ...syncs];
  const count = (done: Done) => steps.filter((s) => s === done).length;
  const finished = count("created") + count("linked") + count("updated") + count("gone");
  const stop = steps.find(isStop);
  return {
    erased: count("erased"),
    created: count("created"),
    linked: count("linked"),
    updated: count("updated"),
    refused: count("refused"),
    erasureRefused: count("erasureRefused"),
    gaveUp: plan.gaveUp + count("gone"),
    pending: plan.work.length - finished,
    stopped: stop ? stop.stopped : null,
  };
}
