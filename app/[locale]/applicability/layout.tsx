import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "NIS2 Applicability Check | NIS2 Compliance Platform",
  description:
    "Free self-assessment: check if your company falls under the NIS2 directive (EU 2022/2555) and the German BSIG 2025.",
};

export default function ApplicabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-12 sm:pt-28 sm:pb-20">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
