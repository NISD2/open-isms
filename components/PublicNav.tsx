import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { auth } from "@/lib/auth/config";
import { getInitials } from "@/lib/utils";

export async function PublicNav() {
  const t = await getTranslations("landing");
  const session = await auth();
  const user = session?.user;

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
            {user ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={"/dashboard" as never}>
                  <Avatar className="size-5">
                    {user.image ? (
                      <AvatarImage
                        src={user.image}
                        alt={user.name ?? user.email ?? "User"}
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {t("nav.dashboard")}
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/auth/signin">{t("nav.cta")}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
