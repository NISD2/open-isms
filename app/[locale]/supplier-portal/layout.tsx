import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

/**
 * Chrome only. The page owns its own <main> so it can run the same
 * full-bleed hero grid as the landing page, which a fixed max-width
 * wrapper here would have prevented.
 */
export default function SupplierPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNav />
      {children}
      <PublicFooter />
    </>
  );
}
