import { ArrowRight, Code2, Server } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Open source, and what we earn from instead of your data. On the landing page and /about. */
export async function OpenSourceNote({ className }: { className?: string }) {
  const t = await getTranslations("landing");

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("cardOpenSourceTitle")}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("cardOpenSource")}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="https://github.com/NISD2"
          target="_blank"
          rel="noopener noreferrer"
          // The chip stays small; its tap area reaches 44px tall (after:-inset-y-2.5).
          className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs after:absolute after:-inset-y-2.5 after:inset-x-0 hover:bg-muted"
        >
          <Code2 className="h-3.5 w-3.5" />
          {t("proofOpenSource")}
        </a>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
          <Server className="h-3.5 w-3.5" />
          {t("proofEuHosted")}
        </span>
      </div>
      <Link
        href="/vertrauen"
        className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {t("cardTrustLink")}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
