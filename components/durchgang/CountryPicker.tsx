"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import type { Portal } from "./portals";

/**
 * Where the company's country is set: on the screens that need it, the way the walk asks for
 * everything beyond the three essentials (CompanyEssentials). Setting up a company asks for no
 * country, and the organization page offers none, so a link out to either was a dead end.
 */
export function CountryPicker({
  countries,
  country,
  admin,
  nameOf,
}: {
  countries: readonly Portal[];
  country: string | null;
  admin: boolean;
  nameOf: (p: Portal) => string;
}) {
  const t = useTranslations("durchgang.ui.country");
  const id = useId();
  const router = useRouter();
  const [changing, setChanging] = useState(false);
  const save = trpc.assessment.updateCompany.useMutation({
    onSuccess: () => {
      setChanging(false);
      router.refresh();
    },
    onError: () => toast.error(t("failed")),
  });

  if (!admin) {
    return country === null ? (
      <p className="rounded-xl bg-muted p-4 text-sm">{t("askAdmin")}</p>
    ) : null;
  }
  if (country !== null && !changing) {
    return (
      <button
        type="button"
        onClick={() => setChanging(true)}
        className="cursor-pointer text-sm font-medium text-primary hover:underline"
      >
        {t("change")}
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-xl bg-muted p-4">
      <label htmlFor={id} className="block text-sm font-medium">
        {t("label")}
      </label>
      <Select
        value={country ?? ""}
        disabled={save.isPending}
        onValueChange={(picked) => save.mutate({ country: picked })}
      >
        <SelectTrigger id={id} className="w-full bg-background sm:w-80">
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {countries.map((p) => (
            <SelectItem key={p.countryCode} value={p.countryCode}>
              {nameOf(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
