"use client";

/**
 * Supplier-only onboarding form.
 *
 * One-step minimal signup: company name + (optional) ISO country code. No
 * NIS2 sectors, no CISO question, no BSI registration. Most suppliers are
 * not directly regulated under NIS2 — the form reflects that.
 *
 * Driven by SchemaForm + the shared `supplierOnboardingBootstrapSchema`
 * exported from `@/schema/validators`. Same schema that the tRPC mutation
 * uses on the server side — single source of truth.
 */
import type { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { supplierOnboardingBootstrapSchema } from "@/schema/validators";

type FormValues = z.infer<typeof supplierOnboardingBootstrapSchema>;

export function SupplierOnboardingForm({ userName }: { userName: string }) {
  const bootstrap = trpc.supplierPortal.onboarding.bootstrap.useMutation({
    onSuccess: () => {
      // Hard redirect — the layout queries the session for companyId, so we
      // need a fresh request to pick up the new binding.
      window.location.href = "/portal/supplier";
    },
  });

  const fieldOverrides: Record<string, FieldOverride> = {
    name: { label: "Company name", placeholder: "Your GmbH" },
    country: {
      label: "Country (ISO code)",
      placeholder: "DE",
      description: "Two-letter ISO 3166-1 code. Defaults to DE.",
    },
  };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-8 shadow-sm">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us your company name to start. You can fill in the details
          afterwards on a single page — no NIS2 sectors, no required CISO,
          nothing for an hour. Most suppliers are not directly NIS2-regulated;
          this form does not assume you are.
        </p>
      </header>

      <SchemaForm
        schema={supplierOnboardingBootstrapSchema}
        defaultValues={{ name: "", country: "DE" }}
        fieldOverrides={fieldOverrides}
        onSubmit={async (data) => {
          await bootstrap.mutateAsync(data as FormValues);
        }}
        submitLabel="Continue to security profile"
        isSubmitting={bootstrap.isPending}
      />
      {bootstrap.isError && (
        <p className="text-xs text-destructive text-center">
          {bootstrap.error.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Are you a NIS2-regulated entity?{" "}
        <a
          href="/onboarding"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Use the entity portal instead
        </a>
        .
      </p>
    </div>
  );
}
