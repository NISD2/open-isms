import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { RelatedArticles } from "@/components/info/RelatedArticles";

// Skip build-time static generation for all (info) routes. With the
// messages/info namespace at ~1.7 MB per locale and ~22 routes under
// this group, the Next.js static-gen worker boots a bundle that
// exceeds the Coolify build host's free RAM and OOM-kills before
// rendering page 0. Rendering on demand is cheap (no DB, just
// translations) and Next runtime caches the output.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await params;
  return {};
}

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-28 lg:px-0">
        {children}
        <RelatedArticles />
      </main>
      <PublicFooter />
    </>
  );
}
