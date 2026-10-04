import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The one way in, and the last thing on every public page that asks for something: the landing
 * page, /about and every wiki article. One ask everywhere, so a reader never weighs a scope check
 * against a request form against a sign-up.
 */
export async function GetStarted({ className }: { className?: string }) {
  const t = await getTranslations("landing");

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-6xl rounded-3xl bg-primary/[0.06] px-6 py-12 sm:px-12 sm:py-16",
        className,
      )}
    >
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {t("walk.closing")}
      </h2>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Button
          asChild
          size="lg"
          className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
        >
          <Link href="/auth/signin">{t("guided.cta")}</Link>
        </Button>
        <Link
          href="/pricing"
          className="inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t("walk.pricing")}
        </Link>
      </div>
    </section>
  );
}
