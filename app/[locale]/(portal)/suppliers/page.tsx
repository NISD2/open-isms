import { RequestSupplierProfileButton } from "@/components/suppliers/RequestSupplierProfileButton";
import { SuppliersPage } from "@/components/suppliers/SuppliersPage";
import { api } from "@/lib/trpc/server";
import { WalkPlaces } from "../durchgang/nis2/places";

export default async function SuppliersRoute() {
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
