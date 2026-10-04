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
 * "loading" while a list the answer depends on is still on its way, so the footer does not
 * offer "Not possible yet" for the moment before the person's own rows arrive.
 */
export type ScreenGate = "loading" | "incomplete" | "complete";

const gate = (complete: boolean | undefined): ScreenGate =>
  complete === undefined ? "loading" : complete ? "complete" : "incomplete";

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
): ScreenGate {
  const screen = entry?.screen;
  const evidence = trpc.evidence.listByRequirementStatus.useQuery(
    { requirementStatusId: item.statusId ?? "" },
    { enabled: screen?.kind === "evidence" && item.statusId !== null },
  );
  const trainings = trpc.training.list.useQuery(undefined, {
    enabled: screen?.kind === "register" && screen.module === "training_record",
  });
  const managementOnly =
    screen?.kind === "register" &&
    screen.module === "training_record" &&
    screen.audience === "management";
  const course = trpc.training.managementCourse.useQuery(undefined, {
    enabled: managementOnly,
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
      return gate(
        screen.fields.every(
          (key) =>
            !item.fields[key]?.required ||
            isAnswered(item.fields[key], draft.values[key]),
        ),
      );
    case "evidence":
      // Without a status row nothing can have been uploaded, and the query never runs.
      return item.statusId === null
        ? "incomplete"
        : gate(evidence.data && evidence.data.length > 0);
    case "prepare":
      return gate(!screen.confirm || draft.ready);
    case "register":
      switch (screen.module) {
        case "training_record": {
          // The list shows the platform's course for management as a training, so a member who
          // finished it counts like an entered line.
          const entered = trainings.data?.some((row) => inAudience(row, screen.audience));
          const finished =
            !managementOnly || course.isError
              ? false
              : course.data?.participants.some((p) => p.status === "finished");
          if (entered || finished) return "complete";
          return entered === undefined || finished === undefined
            ? "loading"
            : "incomplete";
        }
        case "management_review":
          return gate(
            reviews.data &&
              reviewedWithinYear(
                reviews.data.map((r) => r.reviewDate),
                recordDay(new Date()),
              ),
          );
        default:
          return "complete";
      }
    case "approve":
      return policies.data ? gate(approvalReady(policies.data)) : "loading";
    case "policy":
      return gate(draft.read);
    case "rate":
      return gate(ratings?.every((row) => rowSettled(row, draft)));
    case "agreements":
      return gate(agreements?.every((row) => answerOf(row, draft) !== null));
    case "logins":
      return logins === undefined ? "loading" : "complete";
    case "crypto":
      return draft.adopt ? "complete" : gate(crypto.data?.stored);
    default:
      return "complete";
  }
}
