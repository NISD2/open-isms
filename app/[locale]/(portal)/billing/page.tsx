import { Receipt } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvoicePdfButton } from "@/components/billing/InvoicePdfButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/trpc/server";

const KNOWN_STATUSES = new Set(["paid", "unpaid", "canceled", "draft"]);

/**
 * What the open company's account pays and what it has been invoiced. Payment status is read live
 * from Qonto on every visit, never stored (packages/isms-schema/src/tables/billing.ts). Cancelling
 * is slice 9.
 */
export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!session.companyId) redirect("/onboarding");

  const t = await getTranslations("billing.page");
  const status = await api.billing.status();
  const invoices = status.isPayer ? await api.billing.invoices() : null;

  const days = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const noon = (iso: string) => new Date(`${iso}T12:00:00Z`);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-bold text-2xl tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("accessTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium">{t(`level.${status.accessLevel}`)}</p>
            {status.accessLevel !== "full" ? (
              <p className="text-muted-foreground text-sm">
                {t("price", { price: status.netPrice })}
              </p>
            ) : null}
          </div>
          {status.canOrder ? (
            <Button asChild>
              <Link href="/bestellen">{t("order")}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("invoicesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices === null ? (
            <p className="text-muted-foreground text-sm">{t("payerOnly")}</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("number")}</TableHead>
                  <TableHead>{t("period")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.number}</TableCell>
                    <TableCell className="text-sm">
                      {days.formatRange(noon(inv.periodStart), noon(inv.periodEnd))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{inv.gross}</TableCell>
                    <TableCell>
                      {inv.creditNoteNumber ? (
                        <Badge variant="secondary">
                          {t("credited", { number: inv.creditNoteNumber })}
                        </Badge>
                      ) : (
                        <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                          {t(
                            `statuses.${inv.status && KNOWN_STATUSES.has(inv.status) ? inv.status : "unknown"}`,
                          )}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.hasPdf ? (
                        <InvoicePdfButton invoiceId={inv.id} />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {t("pdfPending")}
                        </span>
                      )}
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
