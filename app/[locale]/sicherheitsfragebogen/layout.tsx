import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

// On-demand render. The wedge pages are translation-driven, hit no
// database, and have a long tail of programmatic sub-routes coming.
// Static-gen at build would OOM the Coolify build host, matching the
// pattern used by the (info) route group.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return {};
}

export default async function SicherheitsfragebogenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always-on brand attribution. Visible on both nisd2.eu/sicherheitsfragebogen
  // and the EMD sicherheitsfragebogen.de so visitors always see the link to
  // the parent platform. Links absolute to https://www.nisd2.eu so it crosses
  // domains cleanly from the EMD.
  const t = await getTranslations("sicherheitsfragebogen");
  return (
    <>
      <div className="border-b bg-muted/40">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-1.5 lg:px-0">
          <a
            href="https://www.nisd2.eu"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            {t("branding.label")}
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
      <PublicNav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-28 lg:px-0">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
