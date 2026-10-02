import { guardWalk } from "../../durchgang/gate";

/**
 * The walk's home, in the portal so it opens in the main area like the journey. Its items open
 * full screen from the layout beside the (portal) group, behind the same gate.
 */
export default async function PortalDurchgangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardWalk();
  return children;
}
