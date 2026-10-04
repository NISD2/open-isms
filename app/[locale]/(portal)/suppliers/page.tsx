import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { RequestSupplierProfileButton } from "@/components/suppliers/RequestSupplierProfileButton";
import { SuppliersPage } from "@/components/suppliers/SuppliersPage";
import { getSession } from "@/lib/auth";
import { showsExamples } from "@/lib/billing/shows-examples";
import { db } from "@/lib/db";
import { ensurePlatformSupplier } from "@/lib/supplier-portal/platform-supplier";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function SuppliersRoute() {
  if (await showsExamples()) return <RegisterExamples register="suppliers" />;
  const session = await getSession();
  // The instance's operator is offered once as a supplier before the register is read.
  if (session?.companyId) await ensurePlatformSupplier(db, session.companyId);
  const suppliers = await api.supplier.list();
  return (
    <div className="space-y-4">
      <WalkPlaces register="suppliers" />
      <div className="flex justify-end">
        <RequestSupplierProfileButton />
      </div>
      <SuppliersPage items={suppliers as Record<string, unknown>[]} />
    </div>
  );
}
