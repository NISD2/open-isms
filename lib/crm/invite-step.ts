/**
 * The invite step of the close-sync (./sync): everyone a platform user invited, a
 * colleague into their company or a supplier sent the questionnaire, becomes a contact
 * on the inviter's lead in Close, so the invited address sits in the same company as
 * whoever invited it. The invites are the ones the platform admin's "Invited users" tab
 * lists (lib/platform-admin/invites.ts), read by the store.
 *
 * It runs before the people step. When an invitee later signs up, the people step finds
 * the contact by address and links it instead of opening a second lead.
 *
 * - An address Close already holds, on any lead, is left where it is.
 * - An invite is dealt with once (close_invite_sync): a contact that sales deletes in
 *   Close is not added again.
 * - A withdrawn (revoked) invite is not added; an expired one still is, since the
 *   person was named by a customer.
 * - The contact says "Platform may email: No" where that field is configured: an
 *   invitee has no account, so the platform's follow-ups do not reach them, and nobody
 *   should read the contact as agreeing to mail from us.
 *
 * Free of the database and the environment, so it is tested without either.
 */
import type { CloseClient, CloseLink } from "./close";
import type { CloseFieldIds } from "./fields";

export const MAX_INVITES_PER_RUN = 50;

export interface CloseInvite {
  readonly id: string;
  readonly kind: "team" | "supplier";
  /** Lowercased, as the invite row stores it. */
  readonly email: string;
  /** The name of the account this address already has; null while it has none. */
  readonly name: string | null;
  readonly invitedAt: Date;
  readonly inviterName: string;
  /** Where the inviter sits in Close: the lead the invitee joins. */
  readonly link: CloseLink;
}

export type InviteOutcome = "added" | "already_in_close" | "refused";

export interface InviteStore {
  /**
   * Invites not dealt with yet whose inviter is in Close, oldest first, at most
   * `limit`, and how many are waiting in all.
   */
  openInvites(
    limit: number,
  ): Promise<{ readonly invites: readonly CloseInvite[]; readonly waiting: number }>;
  inviteHandled(row: {
    readonly inviteId: string;
    readonly kind: CloseInvite["kind"];
    readonly outcome: InviteOutcome;
    readonly link: CloseLink | null;
  }): Promise<void>;
}

export type InviteResult = {
  readonly added: number;
  readonly known: number;
  readonly refused: number;
  /** Invites left for the next run: the budget, or an early end. */
  readonly pending: number;
  readonly stopped: string | null;
};

const NONE: InviteResult = { added: 0, known: 0, refused: 0, pending: 0, stopped: null };

const KIND_WORDS: Record<CloseInvite["kind"], string> = {
  team: "colleague invite",
  supplier: "supplier questionnaire",
};

const inviteeFields = (fieldIds: CloseFieldIds): Readonly<Record<string, string>> =>
  fieldIds.mayEmail ? { [`custom.${fieldIds.mayEmail}`]: "No" } : {};

type Handled = "added" | "known" | "refused" | { readonly stopped: string };

async function handle(
  close: CloseClient,
  store: InviteStore,
  invite: CloseInvite,
  fieldIds: CloseFieldIds,
): Promise<Handled> {
  const record = (outcome: InviteOutcome, link: CloseLink | null) =>
    store.inviteHandled({ inviteId: invite.id, kind: invite.kind, outcome, link });

  const existing = await close.findContact(invite.email);
  if (!existing.ok) {
    if (existing.kind === "unavailable") return { stopped: existing.detail };
    await record("refused", null);
    return "refused";
  }
  if (existing.value) {
    await record("already_in_close", existing.value);
    return "known";
  }

  const created = await close.createContact(
    invite.link.leadId,
    { name: invite.name ?? invite.email, email: invite.email },
    inviteeFields(fieldIds),
  );
  if (!created.ok) {
    if (created.kind === "unavailable") return { stopped: created.detail };
    // The lead is gone or Close does not take the address: about this contact only.
    await record("refused", null);
    return "refused";
  }
  await record("added", created.value);
  // Best effort: the contact is what matters, the note only says how it got there.
  await close.addNote(
    created.value,
    `Invited to the platform by ${invite.inviterName} (${KIND_WORDS[invite.kind]}).`,
    invite.invitedAt,
  );
  return "added";
}

export async function syncInvites(
  close: CloseClient,
  store: InviteStore,
  fieldIds: CloseFieldIds,
): Promise<InviteResult> {
  const open = await store.openInvites(MAX_INVITES_PER_RUN);
  let result: InviteResult = { ...NONE, pending: open.waiting };
  for (const invite of open.invites) {
    const done = await handle(close, store, invite, fieldIds);
    if (typeof done === "object") return { ...result, stopped: done.stopped };
    result = {
      ...result,
      pending: result.pending - 1,
      added: result.added + Number(done === "added"),
      known: result.known + Number(done === "known"),
      refused: result.refused + Number(done === "refused"),
    };
  }
  return result;
}
