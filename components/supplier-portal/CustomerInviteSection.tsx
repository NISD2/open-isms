"use client";

/**
 * Customer invite form — focused, single-purpose.
 *
 * The old SharingSection bundled invite + customer list + inline asset CRUD
 * into one component. After the IA refactor each concern lives on its own
 * page (Customers index = invite, /customers/[id]/access = revoke,
 * /customers/[id]/assets = per-customer asset CRUD), so this component is
 * just the add-customer form. The email may be left out and added later on the Access page.
 */
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { SchemaForm } from "@/lib/forms/schema-form";
import { trpc } from "@/lib/trpc/client";
import { supplierInviteCustomerSchema } from "@/schema/supplier-contact-validators";

type InviteFormValues = z.infer<typeof supplierInviteCustomerSchema>;

export function CustomerInviteSection() {
  const t = useTranslations("supplierPortal.customers");
  const tContact = useTranslations("supplierPortalContact");
  const router = useRouter();
  const [missing, setMissing] = useState(false);

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

  // The form marks optional fields itself, so no label says "optional".
  const fieldOverrides: Record<string, FieldOverride> = {
    customerEmail: {
      label: t("emailLabel"),
      placeholder: t("emailPlaceholder"),
    },
    customerOrgName: {
      label: t("orgNameLabel"),
      placeholder: t("orgNamePlaceholder"),
    },
  };

  return (
    <div className="rounded-lg border bg-card p-5">
      <SchemaForm
        schema={supplierInviteCustomerSchema}
        defaultValues={{
          customerEmail: "",
          customerOrgName: "",
        }}
        fieldOverrides={fieldOverrides}
        columns={2}
        onSubmit={async (data) => {
          const values = data as InviteFormValues;
          // SchemaForm renders a plain object, so "one of the two" is checked here and again on
          // the server.
          if (!values.customerEmail && !values.customerOrgName?.trim()) {
            setMissing(true);
            return;
          }
          setMissing(false);
          await invite.mutateAsync(values);
        }}
        submitLabel={t("submit")}
        isSubmitting={invite.isPending}
      />
      <p className="mt-3 text-xs text-muted-foreground">{tContact("emailLaterHint")}</p>
      {missing && (
        <p className="mt-3 text-xs text-destructive">{tContact("needNameOrEmail")}</p>
      )}
      {invite.isError && (
        <p className="mt-3 text-xs text-destructive">{invite.error.message}</p>
      )}
    </div>
  );
}
