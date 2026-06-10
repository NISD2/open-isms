"use client";

/**
 * Customer invite form — focused, single-purpose.
 *
 * The old SharingSection bundled invite + customer list + inline asset CRUD
 * into one component. After the IA refactor each concern lives on its own
 * page (Customers index = invite, /customers/[id]/access = revoke,
 * /customers/[id]/assets = per-customer asset CRUD), so this component is
 * just the email-invite form.
 */
import type { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { supplierInviteCustomerSchema } from "@/schema/validators";

type InviteFormValues = z.infer<typeof supplierInviteCustomerSchema>;

const fieldOverrides: Record<string, FieldOverride> = {
  customerEmail: {
    label: "Customer security contact email",
    placeholder: "ciso@customer.de",
  },
  customerOrgName: {
    label: "Customer org name (optional)",
    placeholder: "Acme GmbH",
  },
  // The `source` field always defaults to "manual" for the supplier-side
  // invite form. Hide it so the user doesn't see it.
  source: { component: "hidden" },
};

export function CustomerInviteSection() {
  const router = useRouter();

  const invite = trpc.supplierPortal.relationship.invite.useMutation({
    onSuccess: (created) => {
      // After invite, jump straight to the new customer's assets page so
      // the supplier can start declaring per-customer service offerings.
      router.push({
        pathname: "/portal/supplier/customers/[relationshipId]/assets",
        params: { relationshipId: created.id },
      });
      router.refresh();
    },
  });

  return (
    <div className="rounded-lg border bg-card p-5">
      <SchemaForm
        schema={supplierInviteCustomerSchema}
        defaultValues={{
          customerEmail: "",
          customerOrgName: "",
          source: "manual",
        }}
        fieldOverrides={fieldOverrides}
        columns={2}
        onSubmit={async (data) => {
          await invite.mutateAsync(data as InviteFormValues);
        }}
        submitLabel="Invite customer"
        isSubmitting={invite.isPending}
      />
      {invite.isError && (
        <p className="mt-3 text-xs text-destructive">{invite.error.message}</p>
      )}
    </div>
  );
}
