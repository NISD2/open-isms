import { api } from "@/lib/trpc/server";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";

export default async function NotificationsRoute() {
  const items = await api.notification.list({});
  return <NotificationsPage items={items as Record<string, unknown>[]} />;
}
