import { guardWalk } from "./gate";

/**
 * The whole walk sits in the portal: its home, every item and the approval page open in the main
 * area beside the sidebar, like the journey (Simon, 03.10.2026: "I want it to all be inside of
 * the portal").
 */
export default async function PortalDurchgangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardWalk();
  return children;
}
