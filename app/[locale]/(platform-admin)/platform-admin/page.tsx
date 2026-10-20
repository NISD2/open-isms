import { DEFAULT_TAB } from "@/components/platform-admin/admin-tabs";
import { AdminHome } from "./admin-home";

export const dynamic = "force-dynamic";

/** /platform-admin opens on the default tab; every tab has its own address (`[tab]`). */
export default function PlatformAdminRoute() {
  return <AdminHome tab={DEFAULT_TAB} />;
}
