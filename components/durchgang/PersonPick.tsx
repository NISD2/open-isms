"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { InlineInvite } from "@/components/team/InlineInvite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ItemView, Team } from "./view";

/** How a person is written into the record: their name, or their email where they have none. */
const nameOf = (member: Team[number]) => member.name?.trim() || member.email;

const OTHER = "__other";

/**
 * A field that names a person in the company: the team to pick from, the person walking first
 * and picked until they choose someone else, someone not in the team by name, and for an admin
 * an invite by email, which names the invited person.
 */
export function PersonPick({
  id,
  label,
  value,
  onChange,
  team,
  viewer,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  team: Team;
  viewer: ItemView["viewer"];
}) {
  const t = useTranslations("durchgang.ui.person");
  const [typing, setTyping] = useState(false);
  const members = [
    ...team.filter((m) => m.id === viewer.id),
    ...team.filter((m) => m.id !== viewer.id),
  ];
  const me = members.find((m) => m.id === viewer.id);
  const picked = typing ? undefined : members.find((m) => nameOf(m) === value);
  const other = typing || (value !== "" && !picked);

  // Nobody named yet: the person walking is the first answer, which they can change.
  useEffect(() => {
    if (value === "" && me && !typing) onChange(nameOf(me));
  }, [value, me, typing, onChange]);

  return (
    <div className="mt-2 space-y-3">
      <RadioGroup
        aria-label={label}
        value={picked ? picked.id : other ? OTHER : ""}
        onValueChange={(v) => {
          const member = members.find((m) => m.id === v);
          setTyping(!member);
          if (member) onChange(nameOf(member));
          else if (picked) onChange("");
        }}
        className="grid gap-2 sm:grid-cols-2"
      >
        {members.map((member) => (
          <Label
            key={member.id}
            htmlFor={`${id}-${member.id}`}
            className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.05]"
          >
            <RadioGroupItem id={`${id}-${member.id}`} value={member.id} />
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {nameOf(member).charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {nameOf(member)}
                {member.id === viewer.id && (
                  <span className="font-normal text-muted-foreground"> ({t("you")})</span>
                )}
              </span>
              {member.name?.trim() && (
                <span className="block truncate text-xs text-muted-foreground">
                  {member.email}
                </span>
              )}
            </span>
          </Label>
        ))}
        <Label
          htmlFor={`${id}-other`}
          className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.05]"
        >
          <RadioGroupItem id={`${id}-other`} value={OTHER} />
          <span className="text-sm">{t("other")}</span>
        </Label>
      </RadioGroup>
      {other && (
        <Input
          id={id}
          aria-label={t("otherName")}
          placeholder={t("otherName")}
          className="h-12 rounded-xl text-base"
          maxLength={255}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {viewer.admin && (
        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          <p className="text-sm font-medium">{t("invite")}</p>
          <InlineInvite
            compact
            placeholder={t("placeholder")}
            onInvited={(email) => {
              setTyping(true);
              onChange(email);
            }}
          />
        </div>
      )}
    </div>
  );
}
