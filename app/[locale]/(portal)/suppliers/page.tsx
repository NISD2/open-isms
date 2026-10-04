import { RegisterExamples } from "@/components/shared/RegisterExamples";
import { RequestSupplierProfileButton } from "@/components/suppliers/RequestSupplierProfileButton";
import { SuppliersPage } from "@/components/suppliers/SuppliersPage";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function SuppliersRoute() {
  if (await showsExamples()) return <RegisterExamples register="suppliers" />;
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
