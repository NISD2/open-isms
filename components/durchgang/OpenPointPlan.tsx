"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { recordDay } from "@/lib/durchgang";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";

type Measure = RouterOutputs["durchgang"]["measures"][number];
type Plan = { readonly assignedTo: string | null; readonly targetDate: string | null };

/** How a person shows in the list: their name, or their email where they have none. */
const nameOf = (person: { name: string | null; email: string | null }) =>
  person.name?.trim() || person.email || "";

/**
 * Who takes care of one open point and by when, saved as a line on the improvement register.
 * Each pick takes effect at once (ui-design principle 12). A day saves once it is a whole day from
 * today on, or cleared: typing a year passes through days like 0202, which are skipped rather than
 * saved. A failed save puts back what was saved and says so. Nothing is guessed: nobody and no
 * day until someone picks them (principle 18).
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
  const owner = measure?.assignedTo ?? "";
  const [day, setDay] = useState(measure?.targetDate ?? "");
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
      setDay(context?.before?.find((row) => row.code === code)?.targetDate ?? "");
      toast.error(t("saveFailed"));
    },
    onSettled: () => utils.durchgang.measures.invalidate(),
  });
  const save = (next: Plan) => plan.mutate({ code, ...next });

  // Someone who has left the team stays named until another person is picked.
  const gone =
    measure && owner && !team.some((member) => member.id === owner)
      ? [
          {
            id: owner,
            label: nameOf({ name: measure.ownerName, email: measure.ownerEmail }),
          },
        ]
      : [];
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
          value={owner}
          onChange={(e) =>
            save({ assignedTo: e.target.value || null, targetDate: day || null })
          }
        >
          <NativeSelectOption value="">{t("nobody")}</NativeSelectOption>
          {team.map((member) => (
            <NativeSelectOption key={member.id} value={member.id}>
              {nameOf(member)}
            </NativeSelectOption>
          ))}
          {gone.map((person) => (
            <NativeSelectOption key={person.id} value={person.id}>
              {person.label}
            </NativeSelectOption>
          ))}
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
          value={day}
          onChange={(e) => {
            const next = e.target.value;
            setDay(next);
            if (next === "" || next >= today)
              save({ assignedTo: owner || null, targetDate: next || null });
          }}
        />
      </div>
    </div>
  );
}
