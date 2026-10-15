"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { recordDay } from "@/lib/durchgang";
import { type RouterInputs, type RouterOutputs, trpc } from "@/lib/trpc/client";
import { nameOf } from "./PersonPick";

type Measure = RouterOutputs["durchgang"]["measures"][number];
type Plan = Omit<RouterInputs["durchgang"]["planMeasure"], "code">;

/**
 * Who takes care of one open point and by when, saved as a line on the improvement register.
 * Each pick takes effect at once (ui-design principle 12). The saved line is the one source of
 * both values; the day field holds its own text only while that text is not a day that can be
 * saved: typing a year passes through days like 0202, and a day before today is not a due day.
 * Picking a person sends the saved day, never that text. A failed save puts back what was saved
 * and says so. Nothing is guessed: nobody and no day until someone picks them (principle 18).
 */
export function OpenPointPlan({
  code,
  measure,
}: {
  code: string;
  measure: Measure | undefined;
}) {
  const t = useTranslations("durchgang.ui.approve.gaps");
  const utils = trpc.useUtils();
  const { data: team = [] } = trpc.team.listMembers.useQuery();
  const owner = measure?.assignedTo ?? null;
  const saved = measure?.targetDate ?? null;
  const [typing, setTyping] = useState<string | null>(null);
  const today = recordDay(new Date());

  const plan = trpc.durchgang.planMeasure.useMutation({
    onMutate: async (input) => {
      await utils.durchgang.measures.cancel();
      const before = utils.durchgang.measures.getData();
      utils.durchgang.measures.setData(undefined, (rows = []) => [
        ...rows.filter((row) => row.code !== code),
        { ...input, ownerName: null, ownerEmail: null },
      ]);
      return { before };
    },
    onError: (_err, _input, context) => {
      utils.durchgang.measures.setData(undefined, context?.before);
      toast.error(t("saveFailed"));
    },
    onSettled: () => utils.durchgang.measures.invalidate(),
  });
  const save = (next: Plan) => plan.mutate({ code, ...next });

  // Someone who has left the team keeps the line, named only as gone, until another is picked.
  const gone = owner !== null && !team.some((member) => member.id === owner);
  const ownerId = `dg-plan-owner-${code}`;
  const dayId = `dg-plan-day-${code}`;

  return (
    <div className="mt-2.5 flex flex-wrap items-end gap-x-5 gap-y-3">
      <div className="space-y-1">
        <label
          htmlFor={ownerId}
          className="block text-xs font-medium text-muted-foreground"
        >
          {t("owner")}
        </label>
        <NativeSelect
          id={ownerId}
          className="h-11 min-w-52 bg-background py-1 text-base sm:h-8 sm:text-sm"
          value={owner ?? ""}
          onChange={(e) =>
            save({ assignedTo: e.target.value || null, targetDate: saved })
          }
        >
          <NativeSelectOption value="">{t("nobody")}</NativeSelectOption>
          {team.map((member) => (
            <NativeSelectOption key={member.id} value={member.id}>
              {nameOf(member)}
            </NativeSelectOption>
          ))}
          {gone && (
            <NativeSelectOption value={owner}>{t("formerMember")}</NativeSelectOption>
          )}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <label
          htmlFor={dayId}
          className="block text-xs font-medium text-muted-foreground"
        >
          {t("due")}
        </label>
        <Input
          id={dayId}
          type="date"
          min={today}
          className="h-11 w-44 bg-background sm:h-8"
          value={typing ?? saved ?? ""}
          onChange={(e) => {
            const next = e.target.value;
            if (next !== "" && next < today) {
              setTyping(next);
              return;
            }
            setTyping(null);
            save({ assignedTo: owner, targetDate: next || null });
          }}
        />
      </div>
    </div>
  );
}
