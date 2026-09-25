import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OrderForm } from "@/components/billing/OrderForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPathname, Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { api } from "@/lib/trpc/server";

/**
 * Door one: the customer orders for their own account.
 *
 * The page exists only while ordering is open to the visitor (lib/billing/ordering.ts): never
 * while Qonto is unconfigured, and only for platform admins against the sandbox. Everyone else gets
 * a 404, so a closed door is indistinguishable from none. Not indexed: nobody should arrive here
 * from a search result without an account behind them.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing.order");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default async function BestellenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    const back = getPathname({ href: "/bestellen", locale });
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(back)}`);
  }
  if (!session.companyId) redirect("/onboarding");

  const status = await api.billing.status();
  if (!status.open) notFound();

  const t = await getTranslations("billing.order");
  const blocked = status.activeInvoice
    ? t("alreadyPaid", {
        date: new Intl.DateTimeFormat(locale, {
          dateStyle: "long",
          timeZone: "UTC",
        }).format(new Date(`${status.activeInvoice.periodEnd}T12:00:00Z`)),
        number: status.activeInvoice.number,
      })
    : status.isPayer
      ? null
      : t("payerOnly");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro", { price: status.netPrice })}</p>
      </header>
      {status.mode === "sandbox" ? (
        <Alert>
          <AlertDescription>{t("sandboxNotice")}</AlertDescription>
        </Alert>
      ) : null}
      {blocked ? (
        <Alert>
          <AlertDescription className="space-y-2">
            <p>{blocked}</p>
            <Link href="/billing" className="font-medium underline underline-offset-4">
              {t("toInvoices")}
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <OrderForm />
      )}
    </div>
  );
}
