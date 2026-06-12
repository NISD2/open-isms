"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function PublicNav() {
  const t = useTranslations("landing");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 lg:px-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">nisd2.eu</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href={"/wiki" as never} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.wiki")}
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.pricing")}
          </Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            {t("nav.about")}
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Button size="sm" asChild>
              <Link href="/auth/signin">{t("nav.cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
