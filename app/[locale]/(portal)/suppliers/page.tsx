import { api } from "@/lib/trpc/server";
import { SuppliersPage } from "@/components/suppliers/SuppliersPage";
import { RequestSupplierProfileButton } from "@/components/suppliers/RequestSupplierProfileButton";

export default async function SuppliersRoute() {
  const suppliers = await api.supplier.list();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RequestSupplierProfileButton />
      </div>
      <SuppliersPage items={suppliers as Record<string, unknown>[]} />
    </div>
  );
}
