import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { auth } from "@/lib/auth/config";
import { getInitials } from "@/lib/utils";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

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
            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-muted-foreground hover:text-foreground"
              asChild
            >
              <a
                href="https://github.com/NISD2/open-isms"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open ISMS on GitHub"
                title="Open ISMS on GitHub"
              >
                <GithubIcon className="size-4" />
              </a>
            </Button>
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
