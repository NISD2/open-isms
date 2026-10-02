import { AdminTestPanel } from "@/components/portal/AdminTestPanel";
import { guardWalk } from "./gate";

/**
 * A walk item has no sidebar and no portal header on purpose: one item per
 * screen, the work on the left, the explanation on the right, one way forward.
 * That is why the items sit beside the (portal) group instead of inside it.
 * The walk's home is in the portal ((portal)/durchgang), so it opens where the
 * journey does; both pass the same gate.
 */
export default async function DurchgangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardWalk();

  return (
    <>
      {children}
      <AdminTestPanel />
    </>
  );
}
