"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { LOCALES, type LocaleCode } from "@/lib/locale";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(next: string) {
    if (next === locale) return;
    // `usePathname()` returns the route template (e.g.
    // `/compliance/[categorySlug]/[requirementCode]`); the dynamic segments
    // are filled from `params` so they survive the locale switch. Passing the
    // bare template without params leaves the `[..]` placeholders literal and
    // breaks every dynamic route.
    router.replace(
      { pathname, params } as Parameters<typeof router.replace>[0],
      { locale: next as LocaleCode },
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-xs font-mono">
          <Globe className="size-3.5" />
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => switchTo(l.code)}
            className={locale === l.code ? "font-semibold" : ""}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
