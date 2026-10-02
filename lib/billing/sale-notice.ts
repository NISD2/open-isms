/**
 * Telling the operators about every invoice issued (internal.new_sale), the moment Qonto has issued
 * it. Good news, so it stays apart from ./alert, whose mail always asks someone to act. Never
 * throws: by the time it runs the order has happened.
 */
import "@/lib/server-guard";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { newSaleEmail, sendMail } from "@/lib/mail";
import { getAppUrl } from "@/lib/utils";
import { cancelWindow } from "./cancel-terms";
import { formatEuro, formatInvoiceDay } from "./order";

export interface Sale {
  /** Issued by Qonto's sandbox: no real invoice, and the subject says so. */
  readonly sandbox: boolean;
  readonly number: string;
  readonly companyName: string;
  readonly invoiceEmail: string;
  readonly source: "self_serve" | "admin";
  readonly firstOrder: boolean;
  readonly amounts: {
    readonly netCents: number;
    readonly vatCents: number;
    readonly grossCents: number;
  };
  readonly dates: {
    readonly issueDate: string;
    readonly dueDate: string;
    readonly performanceStartDate: string;
    readonly performanceEndDate: string;
  };
}

const day = (isoDay: string) => formatInvoiceDay(isoDay, "de");

/** What the operators read, in German like the rest of their mail. */
export const saleNoticeWording = (sale: Sale, now: Date) => {
  const { amounts, dates } = sale;
  const gross = formatEuro(amounts.grossCents);
  const window = cancelWindow(
    { issueDate: dates.issueDate, firstInvoice: sale.firstOrder },
    now,
  );
  const rows: readonly (readonly [string, string])[] = [
    ["Rechnung", `${sale.number} vom ${day(dates.issueDate)}`],
    ["Firma", sale.companyName],
    [
      "Betrag",
      `${gross} (${formatEuro(amounts.netCents)} netto, ${formatEuro(amounts.vatCents)} USt)`,
    ],
    [
      "Zeitraum",
      `${day(dates.performanceStartDate)} bis ${day(dates.performanceEndDate)}`,
    ],
    ["Zahlbar bis", day(dates.dueDate)],
    ["Rechnung an", sale.invoiceEmail],
    [
      "Bestellt",
      sale.source === "self_serve"
        ? "vom Kunden auf der Bestellseite"
        : "im Platform Admin abgeschlossen",
    ],
    [
      "Geld zurück",
      window.kind === "money_back"
        ? `möglich bis ${day(window.lastDay)}`
        : "nein, nicht die erste Rechnung des Kontos",
    ],
  ];
  return {
    subject: `${sale.sandbox ? "[Sandbox] " : ""}Neuer Verkauf: ${sale.number}, ${gross} von ${sale.companyName}`,
    title: sale.sandbox ? "Neuer Verkauf in der Sandbox" : "Neuer Verkauf",
    rows,
  };
};

export const notifySale = async (sale: Sale, now: Date): Promise<void> => {
  const admins = [...getPlatformAdminEmails()];
  if (admins.length === 0) return;
  await newSaleEmail({
    ...saleNoticeWording(sale, now),
    adminUrl: `${getAppUrl()}/platform-admin`,
  })
    .then((content) =>
      sendMail({ emailType: "internal.new_sale", to: admins, ...content }),
    )
    .catch((err) => console.error("[billing] sale notice not sent", err));
};
