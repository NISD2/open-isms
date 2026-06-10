import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { WikiLegalDisclaimer } from "@/components/wiki/WikiLegalDisclaimer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return {};
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="wiki-content mx-auto max-w-6xl px-6 pt-16 pb-16 sm:pt-20 lg:px-0">
        {children}
        <WikiLegalDisclaimer />
      </main>
      <PublicFooter />
    </>
  );
}
