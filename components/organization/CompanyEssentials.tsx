"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { ENTITY_TYPES, type EntityType, SECTORS } from "@/lib/organization/constants";
import { trpc } from "@/lib/trpc/client";

type Href = Parameters<ReturnType<typeof useRouter>["push"]>[0];

export interface Essentials {
  readonly name: string;
  readonly sector: string;
  readonly entityType: EntityType;
}

/**
 * The only three things the platform needs to know about a company: its name (documents name
 * it), its sector (which catalogue entries the walk offers) and how § 28 BSIG classes it (which
 * steps it walks). Everything else the walk asks where it is needed (Simon, 04.10.2026: "only the
 * things we need from the organization, nothing more").
 *
 * `create` sets up the company: it activates the draft every account gets at sign-up, or creates
 * one. `edit` changes the three. Afterwards it goes to `next`, or reloads the page it is on.
 */
export function CompanyEssentials({
  mode,
  initial,
  next,
  submitLabel,
}: {
  mode: "create" | "edit";
  initial?: Essentials;
  next?: Href;
  submitLabel: string;
}) {
  const t = useTranslations("organization");
  const id = useId();
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [sector, setSector] = useState(initial?.sector ?? "");
  const [entityType, setEntityType] = useState<EntityType>(
    initial?.entityType ?? "important",
  );
  const create = trpc.assessment.createCompanyAndAssessment.useMutation();
  const update = trpc.assessment.updateCompany.useMutation();
  const saving = create.isPending || update.isPending;
  const ready = name.trim() !== "" && sector !== "";
  // The button is never disabled (ui-design principle 6): a click on it says what is missing.
  const [missing, setMissing] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMissing(!ready);
    if (!ready) return;
    const values = { name: name.trim(), sector, entityType };
    try {
      await (mode === "create" ? create.mutateAsync(values) : update.mutateAsync(values));
    } catch {
      toast.error(t("essentials.failed"));
      return;
    }
    if (mode === "edit") toast.success(t("saved"));
    if (next) router.push(next);
    else router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>{t("essentials.name")}</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          autoComplete="organization"
          className="h-11 text-base"
        />
        <p className="text-sm text-muted-foreground">{t("essentials.nameHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-sector`}>{t("sector")}</Label>
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger
            id={`${id}-sector`}
            className="w-full text-base data-[size=default]:h-11"
          >
            <SelectValue placeholder={t("sectorPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {SECTORS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`sectors.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("entityType")}</legend>
        <p className="text-sm text-muted-foreground">{t("essentials.entityTypeHint")}</p>
        <RadioGroup
          value={entityType}
          onValueChange={(v) => {
            const picked = ENTITY_TYPES.find((type) => type === v);
            if (picked) setEntityType(picked);
          }}
          className="grid gap-2 sm:grid-cols-3"
        >
          {ENTITY_TYPES.map((type) => (
            <Label
              key={type}
              htmlFor={`${id}-${type}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.05]"
            >
              <RadioGroupItem id={`${id}-${type}`} value={type} />
              {t(`entityTypes.${type}`)}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="space-y-2">
        <Button
          type="submit"
          size="lg"
          disabled={saving}
          className="h-12 rounded-xl px-7 text-base"
        >
          {submitLabel}
        </Button>
        {missing && !ready && (
          <p role="alert" className="text-sm text-muted-foreground">
            {t("essentials.missing")}
          </p>
        )}
      </div>
    </form>
  );
}
