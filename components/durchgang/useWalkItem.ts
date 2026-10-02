import { useRef, useState } from "react";
import {
  BACKUP_FREQUENCIES,
  type BackupFrequency,
  type WaitReason,
} from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { changedAnswers, type Draft, fullRating, initialDraft } from "./draft";
import { methodOf, mfaOf, useLoginRows } from "./LoginScreen";
import type { ItemView } from "./view";

const isBackupFrequency = (value: string | null): value is BackupFrequency =>
  BACKUP_FREQUENCIES.some((f) => f === value);

/**
 * One item's working state and how it is stored: the draft its screens edit, and the writes that
 * record it when the person moves on.
 *
 * The screen moves ahead before its write settles, so the writes run one after another on one
 * queue. Two answer saves in flight at once would each merge into the same stored answers, the
 * later overwriting the earlier, and "done" must not land before the last answers do.
 */
export function useWalkItem(item: ItemView, waiting: boolean) {
  const [draft, setDraft] = useState<Draft>(() =>
    initialDraft(item.answers, item.fields),
  );
  const [adoptedAt, setAdoptedAt] = useState(item.adoptedAt);
  /** What the server holds, so an unchanged screen sends nothing. */
  const saved = useRef(draft.values);
  /** A visit resumes a waiting item once. */
  const resumed = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  /**
   * The screens whose save was refused and not yet stored again. The queue goes on after a
   * refusal, so later screens still save, but the item is not finished while one is missing.
   */
  const refused = useRef(new Set<number>());

  const saveAnswers = trpc.intake.saveRequirementAnswers.useMutation();
  const adopt = trpc.durchgang.adoptMethod.useMutation();
  const addAssets = trpc.durchgang.addAssets.useMutation();
  const specify = trpc.durchgang.specifyAssets.useMutation();
  const rate = trpc.durchgang.rate.useMutation();
  const recordAgreements = trpc.durchgang.recordAgreements.useMutation();
  const recordLogins = trpc.durchgang.recordLogins.useMutation();
  const writePolicy = trpc.durchgang.writePolicy.useMutation();
  const recordCritical = trpc.durchgang.recordCritical.useMutation();
  const recordBackups = trpc.durchgang.recordBackups.useMutation();
  const adoptCrypto = trpc.durchgang.adoptCrypto.useMutation();
  // Every sign-in shown starts with an answer, so 11.1 records them all, not only the touched ones.
  const loginRows = useLoginRows(item.screens.some((s) => s.screen.kind === "logins"));
  const finish = trpc.durchgang.finish.useMutation();
  const utils = trpc.useUtils();
  const resume = trpc.durchgang.resume.useMutation();
  const wait = trpc.durchgang.wait.useMutation();
  const declineItem = trpc.durchgang.decline.useMutation();

  const answer = async (answers: Record<string, unknown>) => {
    if (Object.keys(answers).length === 0 || !item.assessmentId) return;
    await saveAnswers.mutateAsync({
      assessmentId: item.assessmentId,
      categoryId: item.categoryId,
      requirementCode: item.code,
      answers,
    });
  };

  /**
   * What a screen records when the person leaves it forward. The method is adopted separately,
   * and management's approval is a signature, saved before anything moves on.
   */
  const record = async (at: number, snapshot: Draft) => {
    const screen = item.screens[at]?.screen;
    switch (screen?.kind) {
      case "fields": {
        const answers = changedAnswers(
          screen.fields,
          snapshot.values,
          saved.current,
          item.fields,
        );
        await answer(answers);
        saved.current = {
          ...saved.current,
          ...Object.fromEntries(Object.keys(answers).map((k) => [k, snapshot.values[k]])),
        };
        return;
      }
      case "policy":
        // Always written, so the base text is stored even when no clause is added.
        await writePolicy.mutateAsync({
          code: item.code,
          clauses: snapshot.clauses ? [...snapshot.clauses] : null,
          own: snapshot.own,
        });
        await Promise.all([
          utils.durchgang.policyDraft.invalidate(),
          utils.policy.list.invalidate(),
        ]);
        return;
      case "evidence":
        if (screen.field && snapshot.uploaded) {
          await answer({ [screen.field]: snapshot.uploaded });
        }
        return;
      case "assets":
        if (snapshot.checked.length > 0 || snapshot.custom.length > 0) {
          await addAssets.mutateAsync({
            catalogIds: [...snapshot.checked],
            custom: snapshot.custom.map((c) => ({ name: c.name, layer: c.layer })),
          });
          await utils.asset.list.invalidate();
        }
        return;
      case "specify": {
        // An emptied name keeps the stored one, and the server writes only what changed.
        const rows = Object.entries(snapshot.specified).flatMap(([id, s]) =>
          s.name.trim()
            ? [
                {
                  id,
                  name: s.name.trim(),
                  description: s.description,
                  providers: s.providers.map((p) => p.trim()).filter(Boolean),
                },
              ]
            : [],
        );
        if (rows.length > 0) {
          await specify.mutateAsync({ rows });
          await Promise.all([
            utils.asset.list.invalidate(),
            utils.supplier.list.invalidate(),
            utils.durchgang.providers.invalidate(),
          ]);
        }
        return;
      }
      case "rate":
      case "riskmap": {
        const rows = Object.values(snapshot.ratings).flatMap((r) => {
          const rating = fullRating(r);
          const note = r.note === undefined ? {} : { note: r.note.trim() };
          return rating ? [{ kind: r.kind, id: r.id, ...rating, ...note }] : [];
        });
        if (rows.length > 0) {
          await rate.mutateAsync({ rows });
          await Promise.all([
            utils.risk.listWithAssets.invalidate(),
            utils.risk.listWithSuppliers.invalidate(),
            utils.supplier.list.invalidate(),
          ]);
        }
        return;
      }
      case "agreements": {
        const rows = Object.entries(snapshot.agreements).map(([supplierId, agreed]) => ({
          supplierId,
          ...agreed,
        }));
        if (rows.length > 0) {
          await recordAgreements.mutateAsync({ code: item.code, rows });
          await utils.supplier.list.invalidate();
        }
        return;
      }
      case "logins": {
        const rows = (loginRows ?? []).map((row) => ({
          assetId: row.id,
          mfa: mfaOf(row, snapshot),
          method: methodOf(row, snapshot),
        }));
        if (rows.length > 0) {
          await recordLogins.mutateAsync({ code: item.code, rows });
          await utils.asset.list.invalidate();
        }
        return;
      }
      case "critical": {
        const rows = Object.entries(snapshot.critical).map(([assetId, value]) => ({
          assetId,
          critical: value.on,
          how: value.how.trim(),
        }));
        if (rows.length > 0) {
          await recordCritical.mutateAsync({ code: item.code, rows });
          await Promise.all([
            utils.asset.list.invalidate(),
            utils.durchgang.policyDraft.invalidate(),
          ]);
        }
        return;
      }
      case "backups": {
        const rows = Object.entries(snapshot.backups).map(([assetId, b]) => ({
          assetId,
          frequency:
            b.frequency === null || isBackupFrequency(b.frequency)
              ? b.frequency
              : undefined,
          lastRestore: b.lastRestore || null,
        }));
        if (rows.length > 0) {
          await recordBackups.mutateAsync({ code: item.code, rows });
          await utils.asset.list.invalidate();
        }
        return;
      }
      case "crypto":
        if (snapshot.adopt) {
          await adoptCrypto.mutateAsync({ code: item.code });
          await Promise.all([
            utils.durchgang.cryptoList.invalidate(),
            utils.durchgang.policyDraft.invalidate(),
          ]);
        }
        return;
      default:
        return;
    }
  };

  /**
   * Stores what screen `at` recorded, after every earlier write, on the way to screen `to`. The
   * choices are made now, from this screen's state; `onRefused` runs when any of the writes is
   * refused. Arriving at the done screen finishes the item, also when the screens between were
   * passed over.
   */
  const leave = (at: number, to: number, onRefused: () => void) => {
    const snapshot = draft;
    const resuming = at === 0 && waiting && !resumed.current;
    const adopting = item.screens[at]?.screen.kind === "adopt" && adoptedAt === null;
    const finishing = item.screens[to]?.screen.kind === "done";
    if (resuming) resumed.current = true;
    if (adopting) setAdoptedAt(new Date());
    queue.current = queue.current
      .then(async () => {
        if (resuming) await resume.mutateAsync({ code: item.code });
        if (adopting) await adopt.mutateAsync();
        await record(at, snapshot);
        refused.current.delete(at);
        if (finishing && refused.current.size === 0) {
          await finish.mutateAsync({ code: item.code });
        }
      })
      .catch(() => {
        if (resuming) resumed.current = false;
        if (adopting) setAdoptedAt(null);
        refused.current.add(at);
        onRefused();
      });
  };

  /** Runs a write after the pending ones; the returned promise tells whether it was stored. */
  const after = (write: () => Promise<unknown>): Promise<void> => {
    const stored = queue.current.then(async () => {
      await write();
    });
    queue.current = stored.catch(() => {});
    return stored;
  };

  /**
   * Stores what screen `at` holds so far, on the way out of the item: what was entered before
   * leaving, parking or declining stays. A refused write fails the whole step, so the person
   * is told rather than losing it.
   */
  const keep = (at: number) => {
    const snapshot = draft;
    return after(() => record(at, snapshot));
  };

  /** Parks the item: not possible yet, with a reason and an optional note. */
  const park = (at: number, reason: WaitReason, note: string) => {
    const snapshot = draft;
    return after(async () => {
      await record(at, snapshot);
      await wait.mutateAsync({ code: item.code, reason, note: note.trim() || undefined });
    });
  };

  /** Closes the item as decided not to do, with the written reason for the signature. */
  const decline = (at: number, reason: string) => {
    const snapshot = draft;
    return after(async () => {
      await record(at, snapshot);
      await declineItem.mutateAsync({ code: item.code, reason: reason.trim() });
    });
  };

  return { draft, setDraft, adoptedAt, leave, keep, park, decline } as const;
}
