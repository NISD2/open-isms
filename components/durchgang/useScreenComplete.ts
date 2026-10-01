import type { ResolvedScreen } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { type Draft, isAnswered } from "./draft";
import { rowSettled, useRatingRows } from "./RatingScreens";
import type { ItemView } from "./view";

/**
 * Whether the person may move on from this screen: every field the schema requires is answered,
 * a file is in place, a source is ticked, a management training is on the list, every listed thing
 * is rated. Naming assets and their providers is never required. Screens that only
 * explain are always complete. Lists are read from the same queries their screens show, so the
 * answer follows each upload and each new line without a second copy of the count.
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
        (trainings.data ?? []).some((row) => row.isManagement)
      );
    case "rate":
      return ratings?.every((row) => rowSettled(row, draft)) ?? false;
    default:
      return true;
  }
}
