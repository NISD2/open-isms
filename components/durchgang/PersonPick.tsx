"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { InlineInvite } from "@/components/team/InlineInvite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MANAGEMENT_ROLE } from "@/lib/durchgang";
import type { Elsewhere, ItemView, Team } from "./view";

/** How a person is written into the record: their name, or their email where they have none. */
export const nameOf = (member: Team[number]) => member.name?.trim() || member.email;

const OTHER = "__other";

/**
 * A field that names a person: the team to pick from, someone outside it by name, and for an
 * admin an invite by email. A required one starts on the person walking; an optional one starts
 * empty (`startOnViewer`), where naming nobody is an answer. An invited person is written by
 * email and shows as picked once they joined; the answer changes only when someone picks, since
 * a changed name sends an approved step back to management.
 */
export function PersonPick({
  id,
  label,
  value,
  onChange,
  team,
  viewer,
  startOnViewer,
  other,
  carried,
  apart = [],
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  team: Team;
  viewer: ItemView["viewer"];
  startOnViewer: boolean;
  /** The choice for someone outside the team, where the field names it (an external DPO). */
  other?: { readonly label: string; readonly placeholder: string };
  /** Another item's answer the field started on, said under it while it is still that answer. */
  carried?: Elsewhere;
  /** Answers elsewhere that should name someone else; the same team member gets a quiet note. */
  apart?: readonly Elsewhere[];
}) {
  const t = useTranslations("durchgang.ui.person");
  const [typing, setTyping] = useState(false);
  const members = [
    ...team.filter((m) => m.id === viewer.id),
    ...team.filter((m) => m.id !== viewer.id),
  ];
  const memberOf = (text: string) =>
    text === "" ? undefined : members.find((m) => nameOf(m) === text || m.email === text);
  const me = members.find((m) => m.id === viewer.id);
  const picked = typing ? undefined : memberOf(value);
  const typed = typing || (value !== "" && !picked);

  // Nobody named yet: the person walking is the first answer, which they can change.
  useEffect(() => {
    if (startOnViewer && value === "" && me && !typing) onChange(nameOf(me));
  }, [startOnViewer, value, me, typing, onChange]);

  const notes = picked
    ? [
        ...apart
          .filter((a) => memberOf(a.value)?.id === picked.id)
          .map((a) =>
            t("apart.same", { name: nameOf(picked), code: a.code, headline: a.headline }),
          ),
        ...(apart.length > 0 && picked.jobTitle === MANAGEMENT_ROLE
          ? [t("apart.management", { name: nameOf(picked) })]
          : []),
      ]
    : [];

  return (
    <div className="mt-2 space-y-3">
      <RadioGroup
        aria-label={label}
        value={picked ? picked.id : typed ? OTHER : ""}
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
          <span className="text-sm">{other?.label ?? t("other")}</span>
        </Label>
      </RadioGroup>
      {typed && (
        <Input
          id={id}
          aria-label={other?.placeholder ?? t("otherName")}
          placeholder={other?.placeholder ?? t("otherName")}
          className="h-12 rounded-xl text-base"
          maxLength={255}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {carried && value === carried.value && (
        <p className="text-xs text-muted-foreground">
          {t("carried", { code: carried.code, headline: carried.headline })}
        </p>
      )}
      {notes.map((note) => (
        <p key={note} className="max-w-[62ch] text-sm leading-6 text-muted-foreground">
          {note}
        </p>
      ))}
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
