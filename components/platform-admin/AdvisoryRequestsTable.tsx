"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

type Referral = {
  id: string;
  partner: string;
  sentAt: Date;
  feeCents: number | null;
  paidAt: Date | null;
};

type Request = {
  id: string;
  createdAt: Date;
  topic: string;
  trigger: string | null;
  timeframe: string | null;
  sector: string | null;
  companySize: string | null;
  contactName: string | null;
  companyName: string | null;
  email: string;
  note: string | null;
  sourcePath: string | null;
  requirementCode: string | null;
  referrer: string | null;
  locale: string | null;
  referrals: Referral[];
};

/** The host, which is the part that says search, LinkedIn or direct. */
const referrerHost = (referrer: string | null) => {
  if (!referrer) return null;
  try {
    return new URL(referrer).host;
  } catch {
    return referrer.slice(0, 60);
  }
};

const stamp = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
const euro = (cents: number | null) =>
  cents === null ? "fee open" : `${(cents / 100).toFixed(0)} EUR`;

/**
 * One row per request, with everywhere it has already been sent.
 *
 * No filters and no pagination. The question this has to answer for now is
 * "does anybody ask, and did we act on it", and a control built before that is
 * answered is a control built against a guess.
 */
export function AdvisoryRequestsTable({ requests }: { requests: Request[] }) {
  const utils = trpc.useUtils();
  const [partnerFor, setPartnerFor] = useState<Record<string, string>>({});

  const partners = trpc.platformAdmin.advisoryPartners.useQuery();
  const active = (partners.data ?? []).filter((p) => p.active);

  const record = trpc.platformAdmin.recordAdvisoryReferral.useMutation({
    onSuccess: () => utils.platformAdmin.advisoryRequests.invalidate(),
  });

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const chosen = partnerFor[r.id];
        return (
          <div key={r.id} className="rounded-lg border p-4 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {r.companyName ?? r.email}
                <span className="ml-2 font-normal text-muted-foreground">{r.topic}</span>
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {stamp(r.createdAt)}
              </p>
            </div>

            <p className="mt-1 text-muted-foreground">
              {[
                r.contactName,
                r.email,
                r.sector,
                r.companySize,
                r.trigger,
                r.timeframe,
                r.requirementCode ?? r.sourcePath,
                referrerHost(r.referrer),
                r.locale,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {r.note && <p className="mt-2 whitespace-pre-wrap">{r.note}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {r.referrals.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Not sent to anyone yet.
                </span>
              ) : (
                r.referrals.map((ref) => (
                  <span
                    key={ref.id}
                    className="rounded-full border px-2.5 py-1 text-xs"
                    title={ref.paidAt ? `paid ${stamp(ref.paidAt)}` : "unpaid"}
                  >
                    {ref.partner} · {stamp(ref.sentAt).slice(0, 10)} ·{" "}
                    {euro(ref.feeCents)}
                    {ref.paidAt ? " · paid" : ""}
                  </span>
                ))
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                value={chosen ?? ""}
                onValueChange={(v) => setPartnerFor((prev) => ({ ...prev, [r.id]: v }))}
                disabled={active.length === 0}
              >
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue
                    placeholder={active.length === 0 ? "No partners yet" : "Send to…"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {active.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                disabled={!chosen || record.isPending}
                onClick={() =>
                  chosen && record.mutate({ requestId: r.id, partner: chosen })
                }
              >
                Record referral
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
