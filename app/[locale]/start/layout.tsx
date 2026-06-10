import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Shield } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("funnel");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
  };
}

export default function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="mx-auto flex h-14 max-w-6xl items-center px-6 lg:px-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            nisd2.eu
          </span>
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
