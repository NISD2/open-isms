import { EmailFrame } from "../components/frame";
import { CtaButton, FactRows, Title } from "../components/parts";
import { TO_OPERATORS } from "../layout";

export interface NewSaleProps {
  readonly title: string;
  readonly rows: readonly (readonly [string, string])[];
  readonly adminUrl: string;
}

/**
 * To the operators: an invoice was issued. A sale to notice, not a problem to fix, so it carries
 * the facts a follow-up needs and none of the alert's instructions (./operator-alert).
 */
export default function NewSaleEmail({ title, rows, adminUrl }: NewSaleProps) {
  return (
    <EmailFrame chrome={TO_OPERATORS}>
      <Title>{title}</Title>
      <FactRows rows={rows} />
      <CtaButton href={adminUrl}>Im Platform Admin ansehen</CtaButton>
    </EmailFrame>
  );
}

NewSaleEmail.PreviewProps = {
  title: "Neuer Verkauf",
  rows: [
    ["Rechnung", "RE-2026-0012 vom 2. Oktober 2026"],
    ["Firma", "Stadtwerke Beispiel GmbH"],
    ["Betrag", "5.712,00 € (4.800,00 € netto, 912,00 € USt)"],
    ["Zeitraum", "2. Oktober 2026 bis 1. Oktober 2027"],
    ["Zahlbar bis", "1. November 2026"],
    ["Rechnung an", "buchhaltung@stadtwerke.example"],
    ["Bestellt", "vom Kunden auf der Bestellseite"],
    ["Geld zurück", "möglich bis 1. November 2026"],
  ],
  adminUrl: "https://nisd2.eu/platform-admin",
} satisfies NewSaleProps;
