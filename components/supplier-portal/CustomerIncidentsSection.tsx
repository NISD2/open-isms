"use client";

/**
 * Per-customer incident publish + history.
 *
 * Locks the relationship to ONE customer (no picker), loads its assets to
 * offer asset attribution, and lists only the incidents already published
 * to this customer.
 */
import { AlertCircle, Loader2, Send } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";

const DESCRIPTION_MAX = 2000;

interface IncidentEvent {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  createdAt: Date;
  broadcastStatus: "queued" | "sending" | "sent" | "failed" | null;
  broadcastCount: number | null;
}

export function CustomerIncidentsSection({
  relationshipId,
  customerEmail,
  customerOrgName,
  initialIncidents,
}: {
  relationshipId: string;
  customerEmail: string | null;
  customerOrgName: string | null;
  initialIncidents: IncidentEvent[];
}) {
  const t = useTranslations("supplierPortal.incidents");
  const tNav = useTranslations("supplierPortal.nav");
  const format = useFormatter();
  const router = useRouter();
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("warning");

  const assetsQuery = trpc.supplierPortal.managedAsset.listByRelationship.useQuery({
    relationshipId,
  });

  const publish = trpc.supplierPortal.incident.publish.useMutation({
    onSuccess: () => {
      setTitle("");
      setBody("");
      setSeverity("warning");
      setSelectedAssetIds([]);
      router.refresh();
    },
  });

  function toggleAsset(id: string, checked: boolean) {
    setSelectedAssetIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }

  function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !body) return;
    publish.mutate({
      relationshipId,
      title,
      body,
      severity,
      affectedAssetIds: selectedAssetIds.length > 0 ? selectedAssetIds : undefined,
    });
  }

  const recipientLabel = customerOrgName?.trim()
    ? `${customerOrgName.trim()}${customerEmail ? ` (${customerEmail})` : ""}`
    : (customerEmail ?? t("thisCustomer"));

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">{tNav("incidents")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("intro", { recipient: recipientLabel })}
        </p>
      </header>

      {/* Publish form */}
      <form onSubmit={handlePublish} className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-medium text-sm">{t("newTitle")}</h3>

        <div>
          <Label className="text-sm">{t("affectedAssets")}</Label>
          {assetsQuery.isLoading ? (
            <div className="mt-1.5 text-xs text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("loadingAssets")}
            </div>
          ) : assetsQuery.data && assetsQuery.data.length > 0 ? (
            <div className="mt-1.5 space-y-2 rounded-md border bg-background p-3">
              {assetsQuery.data.map((a) => (
                <label
                  key={a.id}
                  htmlFor={`affected-asset-${a.id}`}
                  className="flex items-start gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    id={`affected-asset-${a.id}`}
                    checked={selectedAssetIds.includes(a.id)}
                    onCheckedChange={(checked) => toggleAsset(a.id, !!checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium">{a.name}</div>
                    {a.serviceDescription && (
                      <div className="text-xs text-muted-foreground">
                        {a.serviceDescription}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">{t("noAssets")}</p>
          )}
        </div>

        <div>
          <Label className="text-sm">{t("titleLabel")}</Label>
          <Input
            type="text"
            maxLength={500}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm">
            {t("descriptionLabel", { max: DESCRIPTION_MAX })}
          </Label>
          <Textarea
            rows={5}
            maxLength={DESCRIPTION_MAX}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("descriptionHint")}</p>
        </div>

        <div>
          <Label className="text-sm">{t("severity")}</Label>
          <div className="mt-1.5 flex gap-2">
            {(["info", "warning", "critical"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  severity === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input hover:bg-muted"
                }`}
              >
                {t(`severityOptions.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={publish.isPending}>
          {publish.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" /> {t("notify")}
            </>
          )}
        </Button>
        {publish.isError && (
          <p className="text-xs text-destructive">{publish.error.message}</p>
        )}
      </form>

      {/* History */}
      <section>
        <h3 className="font-medium mb-3">{t("historyTitle")}</h3>
        {initialIncidents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("historyEmpty")}
          </div>
        ) : (
          <ul className="space-y-2">
            {initialIncidents.map((event) => (
              <li key={event.id} className="rounded-md border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{event.title}</div>
                      {event.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <SeverityBadge severity={event.severity} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t("reportedAt", {
                      date: format.dateTime(new Date(event.createdAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    })}
                  </span>
                  <span>
                    {t("delivery", {
                      status: t(`deliveryStatus.${event.broadcastStatus ?? "none"}`),
                      count: event.broadcastCount ?? 0,
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

/** `severity` is the stored value (near_miss, incident, significant), named as the customer sees it. */
function SeverityBadge({ severity }: { severity: string }) {
  const t = useTranslations("supplierPortal.customerView.severity");
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    info: "secondary",
    warning: "default",
    critical: "destructive",
  };
  return (
    <Badge variant={variants[severity] ?? "secondary"} className="text-xs">
      {t(severity)}
    </Badge>
  );
}
