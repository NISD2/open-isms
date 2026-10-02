import { redirect } from "next/navigation";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalShell } from "@/components/portal/PortalShell";
import { getSession } from "@/lib/auth";

/**
 * The courses sit inside the same frame as the portal, so the sidebar is always there to go back
 * to the compliance work. They skip the portal's gates: every account may take a course. The header
 * carries no guide, whose offer of help opens on its own and would cover the lesson.
 */
export default async function TrainingPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  return (
    <PortalShell session={session} header={<PortalHeader />}>
      {children}
    </PortalShell>
  );
}
