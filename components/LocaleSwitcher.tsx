"use client";

import { Globe } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, type LocaleCode } from "@/lib/locale";
import { trpc } from "@/lib/trpc/client";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const setLocale = trpc.user.setLocale.useMutation();

  function switchTo(next: LocaleCode) {
    if (next === locale) return;

    // Switching the language is also a statement about which language this
    // person wants to be written to in, and mail sent from a cron has no
    // browser to ask. The URL and the cookie below reach the next render; this
    // reaches the daily digest. A no-op when signed out, and deliberately not
    // awaited: a language switch should not wait on a write, and a TanStack
    // mutation runs to completion regardless of what unmounts behind it.
    setLocale.mutate({ locale: next });

    // `usePathname()` returns the route template (e.g.
    // `/compliance/[categorySlug]/[requirementCode]`); the dynamic segments
    // are filled from `params` so they survive the locale switch. Passing the
    // bare template without params leaves the `[..]` placeholders literal and
    // breaks every dynamic route.
    router.replace({ pathname, params } as Parameters<typeof router.replace>[0], {
      locale: next,
    });
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
