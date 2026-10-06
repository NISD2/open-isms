"use client";

/**
 * The Partner agreements tab: offer a one-page agreement to a firm that recommends us, copy its
 * link to send, and see who accepted. The partner accepts on /partner-agreement/[token] with name
 * and email; nothing here signs on their behalf.
 */
import { Copy, ExternalLink, Handshake } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";

type Row = RouterOutputs["partnerContract"]["list"]["rows"][number];

const PERIODS = [
  { value: "12", label: "First 12 months of each customer's contract" },
  { value: "24", label: "First 24 months of each customer's contract" },
  { value: "ongoing", label: "As long as the customer pays" },
] as const;
type Period = (typeof PERIODS)[number]["value"];

const day = (d: Date) => d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });

const blankToNull = (value: string): string | null => value.trim() || null;

async function copyLink(url: string) {
  await navigator.clipboard.writeText(url);
  toast.success("Link copied.");
}

function LinkActions({ url }: { readonly url: string }) {
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => copyLink(url)}>
        <Copy className="h-3.5 w-3.5" /> Copy link
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Open the agreement"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    </div>
  );
}

const ACCESS_LABEL: Record<NonNullable<Row["accessOutcome"]>, string> = {
  new_account: "new account, full access",
  existing_account: "existing account set to full",
  not_holder: "the email belongs to an account someone else holds",
  failed: "setting it up failed",
};

function Status({ row }: { readonly row: Row }) {
  if (row.signedAt) {
    return (
      <div className="space-y-1">
        <Badge>Accepted {day(row.signedAt)}</Badge>
        <p className="text-xs text-muted-foreground">{row.signerName}</p>
        <p className="max-w-48 break-all text-xs text-muted-foreground">
          {row.signerEmail}
        </p>
      </div>
    );
  }
  if (row.withdrawnAt) {
    return (
      <div className="space-y-1">
        <Badge variant="outline">Withdrawn</Badge>
        <p className="text-xs text-muted-foreground">{day(row.withdrawnAt)}</p>
      </div>
    );
  }
  return <Badge variant="secondary">Waiting for acceptance</Badge>;
}

function OfferForm({ onCreated }: { readonly onCreated: (url: string) => void }) {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [percent, setPercent] = useState("");
  const [period, setPeriod] = useState<Period>("12");
  const [locale, setLocale] = useState<"de" | "en">("de");

  const create = trpc.partnerContract.create.useMutation({
    onSuccess: (r) => {
      onCreated(r.url);
      if (r.accessOutcome === "not_holder" || r.accessOutcome === "failed") {
        toast.warning(`No login set up: ${ACCESS_LABEL[r.accessOutcome]}.`);
      }
      setCompany("");
      setContact("");
      setEmail("");
      setPercent("");
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate({
      locale,
      partnerCompany: company,
      partnerContactName: blankToNull(contact),
      partnerEmail: blankToNull(email),
      commissionPercent: Number(percent),
      commissionMonths: period === "ongoing" ? null : Number(period),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pc-company">Partner company</Label>
        <Input
          id="pc-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Muster Beratung GmbH"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pc-contact">Contact person (optional)</Label>
        <Input
          id="pc-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pc-email">Contact email: gets the login, full access</Label>
        <Input
          id="pc-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pc-percent">Commission, percent of net payments</Label>
        <Input
          id="pc-percent"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          step={1}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pc-period">Paid for</Label>
        <NativeSelect
          id="pc-period"
          value={period}
          onChange={(e) => {
            const picked = PERIODS.find((p) => p.value === e.target.value);
            if (picked) setPeriod(picked.value);
          }}
        >
          {PERIODS.map((p) => (
            <NativeSelectOption key={p.value} value={p.value}>
              {p.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pc-locale">Language of the agreement</Label>
        <NativeSelect
          id="pc-locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value === "en" ? "en" : "de")}
        >
          <NativeSelectOption value="de">Deutsch</NativeSelectOption>
          <NativeSelectOption value="en">English</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="flex items-end justify-end">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating" : "Create agreement"}
        </Button>
      </div>
    </form>
  );
}

export function PartnerContractsPanel() {
  const list = trpc.partnerContract.list.useQuery();
  const [created, setCreated] = useState<string | null>(null);

  const withdraw = trpc.partnerContract.withdraw.useMutation({
    onSuccess: async () => {
      await list.refetch();
      toast.success("Withdrawn. The link no longer opens the agreement.");
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = list.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" /> Offer a partner agreement
          </CardTitle>
          <CardDescription>
            One page: what the customer gets, support, and the commission you set here.
            The partner accepts with name and email on the link, and both sides get the
            full text by email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {list.data && !list.data.canOffer ? (
            <p className="text-sm text-muted-foreground">
              Partner agreements name the company behind nisd2.eu as the party that pays,
              so they can only be offered on nisd2.eu.
            </p>
          ) : (
            <OfferForm
              onCreated={async (url) => {
                setCreated(url);
                await list.refetch();
                await copyLink(url).catch(() => undefined);
              }}
            />
          )}
          {created ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Agreement created. Send this link:</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {created}
                </p>
              </div>
              <LinkActions url={created} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agreements offered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Offered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium">{row.partnerCompany}</p>
                      <p className="text-xs text-muted-foreground">
                        {[row.partnerContactName, row.partnerEmail]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {row.accessOutcome ? (
                        <p className="text-xs text-muted-foreground">
                          Login: {ACCESS_LABEL[row.accessOutcome]}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.commissionPercent} %
                      <p className="text-xs text-muted-foreground">
                        {row.commissionMonths === null
                          ? "while the customer pays"
                          : `first ${row.commissionMonths} months`}
                        , {row.locale.toUpperCase()}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {day(row.createdAt)}
                      <p className="text-xs text-muted-foreground">
                        {row.createdByEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Status row={row} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 whitespace-nowrap">
                        {row.withdrawnAt ? null : <LinkActions url={row.url} />}
                        {row.signedAt || row.withdrawnAt ? null : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={withdraw.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Withdraw the agreement for ${row.partnerCompany}? The link stops working${row.accessOutcome === "new_account" ? ", and the login it created loses full access" : ""}.`,
                                )
                              ) {
                                withdraw.mutate({ id: row.id });
                              }
                            }}
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
