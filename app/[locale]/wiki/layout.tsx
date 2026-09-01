import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { WikiLegalDisclaimer } from "@/components/wiki/WikiLegalDisclaimer";
import { WikiNextStep } from "@/components/wiki/WikiNextStep";

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
        {/*
          Both blocks render for every wiki page from here rather than
          per page: a next step and the disclaimer are things a new
          article must not be able to ship without. Per-page CTA cards
          still exist on ~36 pages and are complementary — see the
          variant table in WikiNextStep.
        */}
        <WikiNextStep />
        <WikiLegalDisclaimer />
      </main>
      <PublicFooter />
    </>
  );
}
