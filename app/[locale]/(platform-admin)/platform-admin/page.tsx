import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";
import { PlatformAdminPage } from "@/components/platform-admin/PlatformAdminPage";

export const dynamic = "force-dynamic";

export default async function PlatformAdminRoute() {
  await requirePlatformAdmin();

  const [overview, users, companies, complianceActivity, trainingActivity, supplierActivity, emailActivity] =
    await Promise.all([
      api.platformAdmin.overview(),
      api.platformAdmin.users(),
      api.platformAdmin.companies(),
      api.platformAdmin.complianceActivity(),
      api.platformAdmin.trainingActivity(),
      api.platformAdmin.supplierActivity(),
      api.platformAdmin.emailActivity(),
    ]);

  return (
    <PlatformAdminPage
      overview={overview}
      users={users}
      companies={companies}
      complianceActivity={complianceActivity}
      trainingActivity={trainingActivity}
      supplierActivity={supplierActivity}
      emailActivity={emailActivity}
    />
  );
}
