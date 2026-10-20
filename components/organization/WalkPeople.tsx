"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FrameworkBadge } from "@/components/durchgang/FrameworkBadge";
import { PersonPick } from "@/components/durchgang/PersonPick";
import type { ItemView } from "@/components/durchgang/view";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { itemHref, type WalkFramework } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";

/** One role a walk names a person for, as the Organisation page lists it (`loadWalkPeople`). */
export interface WalkPerson {
  readonly framework: WalkFramework;
  readonly code: string;
  /** The index of the step's screen that asks it, where "Open the step" lands. */
  readonly at: number;
  readonly field: string;
  readonly label: string;
  readonly headline: string;
  readonly other: { readonly label: string; readonly placeholder: string } | null;
  readonly value: string | null;
  /** The company designates no DPO, so the role names nobody until the walk changes that. */
  readonly none: boolean;
  readonly assessmentId: string;
  readonly categoryId: string;
}

/**
 * Who holds each role the walks ask about, in one list beside the company's own data. A change
 * here saves the same answer the step saves, with the same consequence: a step management
 * approved goes back to them, since its documents name the person.
 */
export function WalkPeople({
  people,
  viewer,
}: {
  people: readonly WalkPerson[];
  viewer: ItemView["viewer"];
}) {
  const t = useTranslations("organization.people");
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const team = trpc.team.listMembers.useQuery(undefined, { enabled: editing !== null });
  const save = trpc.intake.saveRequirementAnswers.useMutation({
    onSuccess: () => {
      toast.success(t("saved"));
      setEditing(null);
      router.refresh();
    },
    onError: () => toast.error(t("failed")),
  });
  if (people.length === 0) return null;
  const keyOf = (p: WalkPerson) => `${p.code}:${p.field}`;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
      <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{t("lead")}</p>
      <ul className="mt-4 divide-y rounded-3xl border bg-card shadow-xs">
        {people.map((person) => {
          const key = keyOf(person);
          const open = editing === key;
          return (
            <li key={key} className="space-y-3 px-6 py-4">
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{person.label}</p>
                    <FrameworkBadge framework={person.framework} />
                  </div>
                  <p className="text-sm">
                    {person.none
                      ? t("noDpo")
                      : (person.value ?? (
                          <span className="text-muted-foreground">{t("notNamed")}</span>
                        ))}
                  </p>
                  <Link
                    href={itemHref(person.framework, person.code, person.at)}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {person.code} {person.headline}
                  </Link>
                </div>
                {viewer.admin && !person.none && !open && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValue(person.value ?? "");
                      setEditing(key);
                    }}
                  >
                    {t("change")}
                  </Button>
                )}
              </div>
              {open && (
                <div className="space-y-3 rounded-2xl bg-muted/30 p-4">
                  <PersonPick
                    id={`org-${person.code}-${person.field}`}
                    label={person.label}
                    value={value}
                    onChange={setValue}
                    team={team.data ?? []}
                    viewer={viewer}
                    startOnViewer={false}
                    other={person.other ?? undefined}
                  />
                  <p className="max-w-[62ch] text-xs text-muted-foreground">
                    {t("sentBack")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={value.trim() === "" || save.isPending}
                      onClick={() =>
                        save.mutate({
                          assessmentId: person.assessmentId,
                          categoryId: person.categoryId,
                          requirementCode: person.code,
                          answers: { [person.field]: value.trim() },
                        })
                      }
                    >
                      {t("save")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!viewer.admin && (
        <p className="mt-2 text-xs text-muted-foreground">{t("adminOnly")}</p>
      )}
    </section>
  );
}
