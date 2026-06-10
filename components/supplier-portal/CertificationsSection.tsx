"use client";

/**
 * Certifications section — embedded in the supplier portal as a section page.
 *
 * Two modes:
 *   - editable: list + add/delete + PDF upload (logged-in supplier on /portal/supplier/certifications)
 *   - readOnly: list only, no add, no delete (token-gated customer view)
 *
 * The "add" form is driven by SchemaForm + the shared
 * `companyCertificationCreateSchema` from validators.ts. The PDF storageKey
 * field is rendered via a custom `render` override that mounts the existing
 * SimpleFileUpload component (S3 presigned PUT, force application/pdf).
 */
import { useState } from "react";
import type { z } from "zod";
import { useRouter } from "@/i18n/navigation";
import { Plus, Trash2, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import { trpc } from "@/lib/trpc/client";
import { SchemaForm } from "@/lib/forms/schema-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { companyCertificationCreateSchema } from "@/schema/validators";

type CertCreateValues = z.infer<typeof companyCertificationCreateSchema>;

export interface CertRow {
  id: string;
  type: string;
  typeOther: string | null;
  scope: string | null;
  auditor: string | null;
  validFrom: string | null;
  validUntil: string;
  status: string;
}

const CERT_TYPES = [
  { value: "iso27001", label: "ISO/IEC 27001" },
  { value: "iso27017", label: "ISO/IEC 27017" },
  { value: "iso27018", label: "ISO/IEC 27018" },
  { value: "bsi_c5", label: "BSI C5" },
  { value: "bsi_grundschutz", label: "BSI IT-Grundschutz" },
  { value: "tisax_al2", label: "TISAX AL2" },
  { value: "tisax_al3", label: "TISAX AL3" },
  { value: "soc2_type2", label: "SOC 2 Type 2" },
  { value: "isae3402", label: "ISAE 3402" },
  { value: "eucc", label: "EUCC" },
  { value: "pen_test", label: "Penetration Test" },
  { value: "other", label: "Other" },
];

interface CertificationsSectionProps {
  certifications: CertRow[];
  readOnly?: boolean;
}

export function CertificationsSection({
  certifications,
  readOnly = false,
}: CertificationsSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  // formKey is bumped after a successful create — forces SchemaForm to remount
  // and reset its internal react-hook-form state. The file upload state is
  // managed via the field-render closure on `storageKey` and is reset by the
  // remount.
  const [formKey, setFormKey] = useState(0);

  const uploadUrl = trpc.supplierPortal.certification.uploadUrl.useMutation();
  const create = trpc.supplierPortal.certification.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormKey((k) => k + 1);
      router.refresh();
    },
  });

  const remove = trpc.supplierPortal.certification.delete.useMutation({
    onSuccess: () => router.refresh(),
  });

  const fieldOverrides: Record<string, FieldOverride> = {
    type: {
      label: "Type",
      component: "enum",
      options: CERT_TYPES,
    },
    typeOther: { component: "hidden" },
    scope: { component: "hidden" },
    auditor: { label: "Auditor (optional)", placeholder: "TÜV Süd" },
    validFrom: { component: "hidden" },
    validUntil: { label: "Valid until" },
    fileName: { component: "hidden" },
    fileSize: { component: "hidden" },
    contentHash: { component: "hidden" },
    storageKey: {
      label: "Certificate PDF",
      // Custom render: mount SimpleFileUpload and bind its onUploaded /
      // onRemoved handlers to the react-hook-form field.
      render: (field) => (
        <SimpleFileUpload
          label=""
          hint="Drop your certificate PDF here, or click to browse"
          uploadingText="Uploading…"
          errorText="Upload failed. Try again or contact support."
          removeText="Remove"
          accept=".pdf"
          currentFileKey={(field.value as string) || null}
          currentFileName={null}
          getUploadUrl={async (file) => {
            // Force application/pdf — some browsers/OSes report a generic
            // octet-stream for PDFs dragged from certain locations.
            const result = await uploadUrl.mutateAsync({
              ...file,
              contentType: "application/pdf",
            });
            return { uploadUrl: result.url, fileKey: result.key };
          }}
          onUploaded={(key) => field.onChange(key)}
          onRemoved={() => field.onChange("")}
        />
      ),
    },
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Certifications</h2>
          <p className="text-sm text-muted-foreground">
            ISO 27001, BSI Grundschutz, SOC 2, TISAX — upload PDFs and metadata.
          </p>
        </div>
        {!readOnly && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </header>

      {!readOnly && showForm && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <SchemaForm
            key={formKey}
            schema={companyCertificationCreateSchema}
            defaultValues={{
              type: "iso27001",
              auditor: "",
              validUntil: "",
              storageKey: "",
            }}
            fieldOverrides={fieldOverrides}
            onSubmit={async (data) => {
              await create.mutateAsync(data as CertCreateValues);
            }}
            submitLabel="Save certificate"
            isSubmitting={create.isPending}
          />
          {create.isError && (
            <p className="text-xs text-destructive">{create.error.message}</p>
          )}
        </div>
      )}

      {certifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {readOnly
            ? "No active certifications."
            : "No certifications yet. Click Add above to upload your first attestation."}
        </div>
      ) : (
        <ul className="space-y-2">
          {certifications.map((cert) => (
            <li
              key={cert.id}
              className="rounded-md border bg-card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {CERT_TYPES.find((t) => t.value === cert.type)?.label ??
                      cert.type}
                  </div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    valid until {cert.validUntil}
                    {cert.auditor && <span>· {cert.auditor}</span>}
                  </div>
                </div>
              </div>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate({ id: cert.id })}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
