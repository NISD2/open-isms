"use client";

/**
 * Supplier-side incident publish + history.
 *
 * v2 incidents are bilateral and asset-scoped:
 *   1. Pick ONE customer relationship
 *   2. Optionally check which of THAT customer's managed assets are affected
 *   3. Title + body + severity → publish
 *
 * The server validates the relationship is owned by the caller AND that every
 * asset id belongs to the named relationship (incident.ts).
 *
 * No "broadcast to all subscribers" mode — every event goes to exactly one
 * customer. If the same incident affects multiple customers, the supplier
 * publishes one event per customer (each with its own asset selection).
 */
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

interface IncidentEvent {
  id: string;
  title: string;
  description: string;
  severity: string;
  createdAt: Date;
  broadcastStatus: "queued" | "sending" | "sent" | "failed" | null;
  broadcastCount: number | null;
}

interface CustomerOption {
  id: string;
  customerEmail: string | null;
  customerOrgName: string | null;
}

export function SupplierIncidentsManager({
  initialIncidents,
  customers,
}: {
  initialIncidents: IncidentEvent[];
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const [relationshipId, setRelationshipId] = useState<string>("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">(
    "warning",
  );

  // Reset asset selection when the customer changes — assets from a previous
  // customer must not be carried over (the server would reject them anyway).
  useEffect(() => {
    setSelectedAssetIds([]);
  }, [relationshipId]);

  // Load the picked customer's managed assets, only when a customer is picked.
  const assetsQuery = trpc.supplierPortal.managedAsset.listByRelationship.useQuery(
    { relationshipId },
    { enabled: relationshipId !== "" },
  );

  const publish = trpc.supplierPortal.incident.publish.useMutation({
    onSuccess: () => {
      setTitle("");
      setBody("");
      setSeverity("warning");
      setSelectedAssetIds([]);
      // Keep the relationshipId so a follow-up incident is easy to publish
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
    if (!relationshipId || !title || !body) return;
    publish.mutate({
      relationshipId,
      title,
      body,
      severity,
      affectedAssetIds:
        selectedAssetIds.length > 0 ? selectedAssetIds : undefined,
    });
  }

  const noCustomers = customers.length === 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Incident notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notify a single customer about a security incident affecting the
          assets you manage for them. Each incident is bilateral — one customer,
          one notification email. Customers use these as evidence for their NIS2
          §30 supplier monitoring obligation.
        </p>
      </header>

      {/* Publish form */}
      <form
        onSubmit={handlePublish}
        className="rounded-lg border bg-card p-5 space-y-4"
      >
        <h2 className="font-semibold text-sm">Publish a new incident</h2>

        {noCustomers ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            You need at least one active customer before you can publish an
            incident.{" "}
            <a
              href="/portal/supplier/customers"
              className="text-primary underline"
            >
              Add a customer
            </a>{" "}
            first.
          </div>
        ) : (
          <>
            <div>
              <Label className="text-sm">Customer</Label>
              <Select value={relationshipId} onValueChange={setRelationshipId}>
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="Pick a customer to notify" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.customerOrgName
                        ? `${c.customerOrgName} (${c.customerEmail})`
                        : c.customerEmail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asset multi-select — only when a customer is picked */}
            {relationshipId !== "" && (
              <div>
                <Label className="text-sm">
                  Affected assets (optional — leave blank for a generic notice)
                </Label>
                {assetsQuery.isLoading ? (
                  <div className="mt-1.5 text-xs text-muted-foreground inline-flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading
                    assets…
                  </div>
                ) : assetsQuery.data && assetsQuery.data.length > 0 ? (
                  <div className="mt-1.5 space-y-2 rounded-md border bg-background p-3">
                    {assetsQuery.data.map((a) => (
                      <label
                        key={a.id}
                        className="flex items-start gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedAssetIds.includes(a.id)}
                          onCheckedChange={(checked) =>
                            toggleAsset(a.id, !!checked)
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-medium">{a.name}</div>
                          {a.description && (
                            <div className="text-xs text-muted-foreground">
                              {a.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    No assets declared for this customer yet. The notification
                    will go out without asset attribution. Add assets from the
                    Customers page.
                  </p>
                )}
              </div>
            )}

            <div>
              <Label className="text-sm">Title</Label>
              <Input
                type="text"
                maxLength={500}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Service degradation in eu-central-1"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm">
                Description (max 2000 chars — what the customer sees in the email)
              </Label>
              <Textarea
                rows={5}
                maxLength={2000}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Between 14:00 and 15:30 UTC, the asset experienced..."
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Hard rule: do not include internal investigation notes or PII.
                This text goes verbatim into the customer email.
              </p>
            </div>

            <div>
              <Label className="text-sm">Severity</Label>
              <div className="mt-1.5 flex gap-2">
                {(["info", "warning", "critical"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize ${
                      severity === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={publish.isPending || !relationshipId}
            >
              {publish.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" /> Notify customer
                </>
              )}
            </Button>
            {publish.isError && (
              <p className="text-xs text-destructive">{publish.error.message}</p>
            )}
          </>
        )}
      </form>

      {/* History */}
      <section>
        <h2 className="font-semibold mb-3">Published incidents</h2>
        {initialIncidents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No incidents published yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {initialIncidents.map((event) => (
              <li
                key={event.id}
                className="rounded-md border bg-card p-4 space-y-2"
              >
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
                    Published {new Date(event.createdAt).toLocaleString()}
                  </span>
                  <span className="capitalize">
                    Broadcast: {event.broadcastStatus ?? "n/a"} ({event.broadcastCount ?? 0}{" "}
                    sent)
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    info: "secondary",
    warning: "default",
    critical: "destructive",
  };
  return (
    <Badge variant={variants[severity] ?? "secondary"} className="text-xs capitalize">
      {severity}
    </Badge>
  );
}
