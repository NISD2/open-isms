import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Free NIS2 Supplier Portal — fill the BSI questionnaire once, share with all customers",
  description:
    "The free supplier security questionnaire derived from CIR 2024/2690, BSIG §30, and UP-KRITIS. The BSI publicly invited industry to build this — here it is, free.",
};

export default function SupplierPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <PublicNav />
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-12 sm:pt-28 sm:pb-20">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
