import type { Metadata } from "next";
import { GetStarted } from "@/components/GetStarted";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicNav } from "@/components/PublicNav";
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
        {/*
          Both blocks render for every wiki page from here rather than
          per page: a next step and the disclaimer are things a new
          article must not be able to ship without.
        */}
        <GetStarted className="mt-16" />
        <WikiLegalDisclaimer />
      </main>
      <PublicFooter />
    </>
  );
}
