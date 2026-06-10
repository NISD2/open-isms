"use client";

/**
 * Direction-B accept form — shown on the magic-link landing page after the
 * supplier signs in. The token is fixed by the URL, so the visible form only
 * collects company name + country. We submit by merging the URL token with
 * the form values.
 *
 * Driven by SchemaForm + a .pick() of `supplierAcceptInviteSchema` (the same
 * schema the tRPC mutation uses on the server side — single source of truth).
 */
import type { z } from "zod";
import { AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { supplierAcceptInviteSchema } from "@/schema/validators";

// .omit({ token: true }) — token comes from the URL, not the form
const inviteAcceptFormSchema = supplierAcceptInviteSchema.omit({ token: true });
type InviteAcceptFormValues = z.infer<typeof inviteAcceptFormSchema>;

interface Props {
  token: string;
  fromCompanyName: string;
  toEmail: string;
  message: string | null;
  /** Whether the signed-in user's email matches the invited email. */
  emailMatch: boolean;
  /** Whether the signed-in user already belongs to a company. */
  alreadyHasCompany: boolean;
  signedInAs: string;
}

export function SupplierInviteAcceptForm({
  token,
  fromCompanyName,
  toEmail,
  message,
  emailMatch,
  alreadyHasCompany,
  signedInAs,
}: Props) {
  const accept = trpc.supplierPortal.onboarding.acceptInvite.useMutation({
    onSuccess: () => {
      window.location.href = "/portal/supplier";
    },
  });

  // Identity mismatch — the user is signed in as a different email.
  if (!emailMatch) {
    return (
      <Card>
        <CardContent className="py-8 space-y-4 text-center">
          <AlertCircle className="h-10 w-10 text-amber-600 mx-auto" />
          <h1 className="text-xl font-semibold">Wrong email signed in</h1>
          <p className="text-sm text-muted-foreground">
            This invite was sent to <strong>{toEmail}</strong>, but you are
            signed in as <strong>{signedInAs}</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            Sign out and sign back in with {toEmail} to accept this invite.
          </p>
          <Button asChild variant="outline">
            <a href="/auth/signout">Sign out</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // The user already has a company — they need a different account.
  if (alreadyHasCompany) {
    return (
      <Card>
        <CardContent className="py-8 space-y-4 text-center">
          <AlertCircle className="h-10 w-10 text-amber-600 mx-auto" />
          <h1 className="text-xl font-semibold">Account already in use</h1>
          <p className="text-sm text-muted-foreground">
            Your account is already a member of another company on the
            platform. To accept this invite, please sign in with a different
            email address.
          </p>
          <Button asChild variant="outline">
            <a href="/portal/supplier">Go to my supplier portal</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const fieldOverrides: Record<string, FieldOverride> = {
    name: { label: "Your company name", placeholder: "Your GmbH" },
    country: {
      label: "Country (ISO code)",
      placeholder: "DE",
      description: "Two-letter ISO 3166-1 code. Defaults to DE.",
    },
  };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-8 shadow-sm">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          Invitation
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {fromCompanyName} would like to see your security profile
        </h1>
        <p className="text-sm text-muted-foreground">
          They are a NIS2-regulated entity required by EU law to assess their
          suppliers' cybersecurity practices. Instead of a 200-question PDF,
          they are using nisd2.eu — fill the unified ENISA-anchored
          questionnaire once, and share it with every customer who asks.
        </p>
      </header>

      {message && (
        <blockquote className="border-l-4 border-muted pl-4 text-sm italic text-muted-foreground">
          {message}
        </blockquote>
      )}

      <div className="text-sm space-y-1">
        <div className="text-xs text-muted-foreground">Your email</div>
        <div className="rounded-md border bg-muted px-3 py-2 text-muted-foreground">
          {toEmail}
        </div>
      </div>

      <SchemaForm
        schema={inviteAcceptFormSchema}
        defaultValues={{ name: "", country: "DE" }}
        fieldOverrides={fieldOverrides}
        onSubmit={async (data) => {
          await accept.mutateAsync({
            token,
            ...(data as InviteAcceptFormValues),
          });
        }}
        submitLabel="Accept and create profile"
        isSubmitting={accept.isPending}
      />
      {accept.isError && (
        <p className="text-xs text-destructive text-center">
          {accept.error.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Free forever for the supplier portal. Most suppliers are not directly
        NIS2-regulated, and this form does not assume you are.
      </p>
    </div>
  );
}
