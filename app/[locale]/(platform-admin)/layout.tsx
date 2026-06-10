import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
