import { type ResolvedScreen, recordDay, reviewedWithinYear } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { answerOf, useAgreementRows } from "./AgreementScreen";
import { approvalReady } from "./ApproveScreen";
import { type Draft, isAnswered } from "./draft";
import { useLoginRows } from "./LoginScreen";
import { rowSettled, useRatingRows } from "./RatingScreens";
import { inAudience } from "./TrainingRecords";
import type { ItemView } from "./view";

/**
 * Whether the person may move on from this screen: every field the schema requires is answered,
 * a file is in place, what the next step needs is at hand, a training of the screen's audience or
 * a management review is on the list, every listed thing is rated, every supplier's agreements
 * are answered, a policy has been read, a crypto list is kept or the BSI's is taken over, and
 * management has approved every document. Sign-ins start answered, backup answers may stay open,
 * and naming assets and their providers is never required. Screens that only
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
  const reviews = trpc.managementReview.list.useQuery(undefined, {
    enabled: screen?.kind === "register" && screen.module === "management_review",
  });
  const policies = trpc.durchgang.walkPolicies.useQuery(undefined, {
    enabled: screen?.kind === "approve",
  });
  const ratings = useRatingRows(screen?.kind === "rate" ? screen.targets : null);
  const agreements = useAgreementRows(screen?.kind === "agreements");
  const logins = useLoginRows(screen?.kind === "logins");
  const crypto = trpc.durchgang.cryptoList.useQuery(undefined, {
    enabled: screen?.kind === "crypto",
  });
  switch (screen?.kind) {
    case "fields":
      return screen.fields.every(
        (key) =>
          !item.fields[key]?.required || isAnswered(item.fields[key], draft.values[key]),
      );
    case "evidence":
      return (evidence.data?.length ?? 0) > 0;
    case "prepare":
      return !screen.confirm || draft.ready;
    case "register":
      switch (screen.module) {
        case "training_record":
          return (trainings.data ?? []).some((row) => inAudience(row, screen.audience));
        case "management_review":
          return reviewedWithinYear(
            (reviews.data ?? []).map((r) => r.reviewDate),
            recordDay(new Date()),
          );
        default:
          return true;
      }
    case "approve":
      return approvalReady(policies.data);
    case "policy":
      return draft.read;
    case "rate":
      return ratings?.every((row) => rowSettled(row, draft)) ?? false;
    case "agreements":
      return agreements?.every((row) => answerOf(row, draft) !== null) ?? false;
    case "logins":
      return logins !== undefined;
    case "crypto":
      return crypto.data?.stored === true || draft.adopt;
    default:
      return true;
  }
}
