import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSession } from "@/lib/auth";

/**
 * The offer's own layout: the compliance portal's frame without the portal layout's access gate.
 * The offer is where that gate sends an account that must order first, so it cannot sit under the
 * gate's layout. While it did, a client-side navigation into the portal from outside it (measured
 * from the training portal's switcher on 02.10.2026) was redirected to the offer and then
 * re-requested it about ten times a second without rendering anything, until a reload.
 */
export default async function OfferLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  return <PortalShell session={session}>{children}</PortalShell>;
}
