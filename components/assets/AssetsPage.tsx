"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { assetInsertSchema } from "@/schema/validators";
import { NIS2_ASSET_TYPES } from "@/lib/compliance/asset-types";
import type { CryptoPolicyConfig } from "@/lib/compliance/policy-config-defaults";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { CrudPage } from "@/components/shared/CrudPage";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Server, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const OTHER_VALUE = "__other__";

const DEFAULT_OMIT = [
  "id", "companyId", "createdAt", "updatedAt",
  "ipAddress", "hostname", "operatingSystem", "softwareVersion",
  "hasMfa",
  "encryptionAtRest", "encryptionInTransit", "cryptoImplementation",
  "hasBackup", "backupFrequency", "backupLocation", "lastBackupTestDate", "rto", "rpo",
  "lastVulnScanDate",
];

interface SelectOption {
  value: string;
  label: React.ReactNode;
}

function SelectWithOther({ value, onChange, options, otherLabel, otherPlaceholder }: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  otherLabel: string;
  otherPlaceholder?: string;
}) {
  const presetValues = options.map((o) => o.value);
  const isPreset = presetValues.includes(value);
  const [isOther, setIsOther] = useState(!isPreset && value !== "");

  return (
    <div className="space-y-2">
      <Select
        value={isOther ? OTHER_VALUE : value}
        onValueChange={(v) => {
          if (v === OTHER_VALUE) {
            setIsOther(true);
            onChange("");
          } else {
            setIsOther(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
          <SelectItem value={OTHER_VALUE}>{otherLabel}</SelectItem>
        </SelectContent>
      </Select>
      {isOther && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={otherPlaceholder}
          maxLength={100}
        />
      )}
    </div>
  );
}

function buildCryptoOverrides(
  policyData: Record<string, unknown>,
  otherLabel: string,
): Record<string, FieldOverride> {
  const raw = (policyData.config ?? policyData) as unknown as CryptoPolicyConfig;
  const approved = raw.algorithms?.filter((a) => a.status === "approved") ?? [];

  const symmetricOptions: SelectOption[] = approved
    .filter((a) => a.category === "symmetric")
    .map((a) => {
      const val = a.keyLength ? `${a.algorithm}-${a.keyLength}` : a.algorithm;
      return { value: val, label: val };
    });

  const tlsOptions: SelectOption[] = approved
    .filter((a) => a.category === "tls")
    .map((a) => ({ value: a.algorithm, label: a.algorithm }));

  const overrides: Record<string, FieldOverride> = {};

  if (symmetricOptions.length > 0) {
    overrides.encryptionAtRest = {
      render: (field) => (
        <SelectWithOther
          value={field.value ?? ""}
          onChange={field.onChange}
          options={symmetricOptions}
          otherLabel={otherLabel}
        />
      ),
    };
  }

  if (tlsOptions.length > 0) {
    overrides.encryptionInTransit = {
      render: (field) => (
        <SelectWithOther
          value={field.value ?? ""}
          onChange={field.onChange}
          options={tlsOptions}
          otherLabel={otherLabel}
        />
      ),
    };
  }

  return overrides;
}

interface AssetsPageProps {
  items: Record<string, unknown>[];
  inline?: boolean;
  focus?: string[];
  policyData?: Record<string, unknown> | null;
}

export function AssetsPage({ items, inline, focus, policyData }: AssetsPageProps) {
  const t = useTranslations("assets");
  const router = useRouter();
  const refresh = () => router.refresh();
  const onError = (err: { message: string }) => toast.error(err.message);
  const createMut = trpc.asset.create.useMutation({ onSuccess: refresh, onError });
  const updateMut = trpc.asset.update.useMutation({ onSuccess: refresh, onError });
  const deleteMut = trpc.asset.delete.useMutation({ onSuccess: refresh, onError });

  const omit = useMemo(() => {
    if (!focus) return DEFAULT_OMIT;
    const focusSet = new Set(focus);
    return Object.keys(assetInsertSchema.shape).filter((k) => !focusSet.has(k));
  }, [focus]);

  const typeOptions = useMemo((): SelectOption[] =>
    NIS2_ASSET_TYPES.map((type) => ({
      value: type,
      label: (
        <>
          <span className="font-medium">{t(`types.${type}`)}</span>
          <span className="ml-1.5 text-xs text-muted-foreground">{t(`typeDescriptions.${type}`)}</span>
        </>
      ),
    })),
  [t]);

  const fieldOverrides = useMemo((): Record<string, FieldOverride> => {
    const base: Record<string, FieldOverride> = {
      type: {
        render: (field) => (
          <SelectWithOther
            value={field.value ?? ""}
            onChange={field.onChange}
            options={typeOptions}
            otherLabel={t("otherType")}
            otherPlaceholder={t("otherTypePlaceholder")}
          />
        ),
      },
    };
    if (policyData) {
      Object.assign(base, buildCryptoOverrides(policyData, t("otherType")));
    }
    return base;
  }, [t, policyData, typeOptions]);

  return (
    <CrudPage
      items={items}
      icon={<Server className="h-8 w-8 text-primary" />}
      inline={inline}
      namespace="assets"
      schema={assetInsertSchema}
      omit={omit}
      fieldOverrides={fieldOverrides}
      onCreate={focus ? undefined : (data) => createMut.mutate(data)}
      onUpdate={(id, data) => updateMut.mutate({ id, ...data })}
      onDelete={focus ? undefined : (id) => deleteMut.mutate({ id })}
      isSubmitting={createMut.isPending || updateMut.isPending}
      llmPrefill={!focus}
    >
      {({ items, onEdit, onDelete }) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.type")}</TableHead>
              <TableHead className="text-right">{t("fields.quantity")}</TableHead>
              <TableHead>{t("fields.owner")}</TableHead>
              <TableHead>{t("fields.location")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id as string}>
                <TableCell className="font-medium">{a.name as string}</TableCell>
                <TableCell>{a.type as string}</TableCell>
                <TableCell className="text-right tabular-nums">{(a.quantity as number) ?? 1}</TableCell>
                <TableCell>{(a.owner as string) ?? "\u2014"}</TableCell>
                <TableCell>{(a.location as string) ?? "\u2014"}</TableCell>
                <TableCell className="space-x-1">
                  {Boolean(a.isCritical) && <Badge variant="destructive">{t("critical")}</Badge>}
                  {Boolean(a.isOT) && <Badge variant="secondary">{t("ot")}</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  {!focus && <Button variant="ghost" size="icon" onClick={() => onDelete(a.id as string)}><Trash2 className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CrudPage>
  );
}
