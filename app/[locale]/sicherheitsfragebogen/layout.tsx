import type { Metadata } from "next";
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

export default function SicherheitsfragebogenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-28 lg:px-0">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
