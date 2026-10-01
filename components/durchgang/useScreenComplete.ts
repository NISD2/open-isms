import type { ResolvedScreen } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { answerOf, useAgreementRows } from "./AgreementScreen";
import { type Draft, isAnswered } from "./draft";
import { mfaOf, useLoginRows } from "./LoginScreen";
import { rowSettled, useRatingRows } from "./RatingScreens";
import { inAudience } from "./TrainingRecords";
import type { ItemView } from "./view";

/**
 * Whether the person may move on from this screen: every field the schema requires is answered,
 * a file is in place, a source is ticked, a training of the screen's audience is on the list,
 * every listed thing is rated, every supplier's agreements and every sign-in are answered. Naming
 * assets and their providers is never required. Screens that only explain are always complete.
 * Lists are read from the same queries their screens show, so the answer follows each upload and
 * each new line without a second copy of the count.
 */
export function useScreenComplete(
  item: ItemView,
  entry: ResolvedScreen | undefined,
  draft: Draft,
): boolean {
  const screen = entry?.screen;
  const evidence = trpc.evidence.listByRequirementStatus.useQuery(
    { requirementStatusId: item.statusId ?? "" },
    { enabled: screen?.kind === "evidence" && item.statusId !== null },
  );
  const trainings = trpc.training.list.useQuery(undefined, {
    enabled: screen?.kind === "register" && screen.module === "training_record",
  });
  const ratings = useRatingRows(screen?.kind === "rate" ? screen.targets : null);
  const agreements = useAgreementRows(screen?.kind === "agreements");
  const logins = useLoginRows(screen?.kind === "logins");
  switch (screen?.kind) {
    case "fields":
      return screen.fields.every(
        (key) =>
          !item.fields[key]?.required || isAnswered(item.fields[key], draft.values[key]),
      );
    case "evidence":
      return (evidence.data?.length ?? 0) > 0;
    case "sources":
      return draft.sources.length > 0;
    case "register":
      return (
        screen.module !== "training_record" ||
        (trainings.data ?? []).some((row) => inAudience(row, screen.audience))
      );
    case "rate":
      return ratings?.every((row) => rowSettled(row, draft)) ?? false;
    case "agreements":
      return agreements?.every((row) => answerOf(row, draft) !== null) ?? false;
    case "logins":
      return logins?.every((row) => mfaOf(row, draft) !== null) ?? false;
    default:
      return true;
  }
}
