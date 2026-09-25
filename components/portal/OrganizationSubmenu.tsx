"use client";

import { Building2, Check, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { getPathname } from "@/i18n/navigation";
import type { LocaleCode } from "@/lib/locale";
import { trpc } from "@/lib/trpc/client";

/**
 * A full page load after the open organization changes, because the portal layouts render the
 * sidebar and progress for the open one on the server and a client navigation keeps them.
 */
const loadFor = (href: "/dashboard" | "/journey", locale: string) =>
  window.location.assign(getPathname({ href, locale: locale as LocaleCode }));

/**
 * The user menu's list of the person's organizations, and the way to start another one. Hidden for
 * someone with a single organization who cannot add one, so their menu is unchanged.
 */
export function OrganizationSubmenu() {
  const t = useTranslations("portal");
  const locale = useLocale();
  const mine = trpc.company.listMine.useQuery();
  const open = trpc.company.open.useMutation({
    onSuccess: () => loadFor("/dashboard", locale),
    onError: (e) => toast.error(e.message),
  });
  const add = trpc.company.createAnother.useMutation({
    onSuccess: () => loadFor("/journey", locale),
    onError: (e) => toast.error(e.message),
  });

  const data = mine.data;
  if (!data || (data.companies.length < 2 && !data.canAddCompany)) return null;

  const busy = open.isPending || add.isPending;
  const label = (name: string) => name || t("untitledOrganization");
  const current = data.companies.find((c) => c.open);

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Building2 className="mr-2 h-4 w-4" />
          <span className="truncate">
            {current ? label(current.name) : t("organizations")}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="max-w-72">
          {data.companies.map((c) => (
            <DropdownMenuItem
              key={c.id}
              disabled={busy}
              onClick={() => {
                if (!c.open) open.mutate({ companyId: c.id });
              }}
            >
              <span className="truncate">{label(c.name)}</span>
              {c.open && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          {data.canAddCompany && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={busy} onClick={() => add.mutate()}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addOrganization")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
    </>
  );
}
