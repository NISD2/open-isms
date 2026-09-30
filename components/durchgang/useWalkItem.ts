import { useRef, useState } from "react";
import type { WaitReason } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { changedAnswers, type Draft, initialDraft } from "./draft";
import type { ItemView } from "./view";

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

  const saveAnswers = trpc.intake.saveRequirementAnswers.useMutation();
  const sources = trpc.durchgang.sources.useMutation();
  const adopt = trpc.durchgang.adoptMethod.useMutation();
  const addAssets = trpc.durchgang.addAssets.useMutation();
  const finish = trpc.durchgang.finish.useMutation();
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

  /** What a screen records when the person leaves it forward. The method is adopted separately. */
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
      case "evidence":
        if (screen.field && snapshot.uploaded) {
          await answer({ [screen.field]: snapshot.uploaded });
        }
        return;
      case "sources":
        if (snapshot.sources.length > 0) {
          await sources.mutateAsync({ code: item.code, sources: [...snapshot.sources] });
        }
        return;
      case "assets":
        if (snapshot.checked.length > 0 || snapshot.custom.length > 0) {
          await addAssets.mutateAsync({
            catalogIds: [...snapshot.checked],
            custom: snapshot.custom.map((c) => ({ name: c.name })),
          });
        }
        return;
      default:
        return;
    }
  };

  /**
   * Stores what screen `at` recorded, after every earlier write. The choices are made now, from
   * this screen's state; `onRefused` runs when any of the writes is refused.
   */
  const leave = (at: number, onRefused: () => void) => {
    const snapshot = draft;
    const resuming = at === 0 && waiting && !resumed.current;
    const adopting = item.screens[at]?.screen.kind === "adopt" && adoptedAt === null;
    const finishing = item.screens[at + 1]?.screen.kind === "done";
    if (resuming) resumed.current = true;
    if (adopting) setAdoptedAt(new Date());
    queue.current = queue.current
      .then(async () => {
        if (resuming) await resume.mutateAsync({ code: item.code });
        if (adopting) await adopt.mutateAsync();
        await record(at, snapshot);
        if (finishing) await finish.mutateAsync({ code: item.code });
      })
      .catch(() => {
        if (resuming) resumed.current = false;
        if (adopting) setAdoptedAt(null);
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

  /** Parks the item: not possible yet, with a reason and an optional note. */
  const park = (reason: WaitReason, note: string) =>
    after(() =>
      wait.mutateAsync({ code: item.code, reason, note: note.trim() || undefined }),
    );

  /** Closes the item as decided not to do, with the written reason for the signature. */
  const decline = (reason: string) =>
    after(() => declineItem.mutateAsync({ code: item.code, reason: reason.trim() }));

  return { draft, setDraft, adoptedAt, leave, park, decline } as const;
}
