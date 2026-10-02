/**
 * Every invoice tells the operators: what was sold, to whom, for how much, and whether money back
 * still applies, the last decided by the same rule the cancel uses.
 */
import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.test",
}));
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [],
  isPlatformAdmin: () => false,
  requirePlatformAdmin: async () => {},
}));

const { saleNoticeWording } = await import("./sale-notice");
type Sale = Parameters<typeof saleNoticeWording>[0];

const sale: Sale = {
  sandbox: false,
  number: "RE-2026-0002",
  companyName: "Kunde GmbH",
  invoiceEmail: "buchhaltung@kunde.example",
  source: "self_serve",
  firstOrder: true,
  amounts: { netCents: 480_000, vatCents: 91_200, grossCents: 571_200 },
  dates: {
    issueDate: "2026-10-02",
    dueDate: "2026-11-01",
    performanceStartDate: "2026-10-02",
    performanceEndDate: "2027-10-01",
  },
};
const orderDay = new Date("2026-10-02T09:00:00Z");
const row = (s: Sale, label: string) =>
  saleNoticeWording(s, orderDay).rows.find(([l]) => l === label)?.[1];

describe("saleNoticeWording", () => {
  test("the subject names the invoice, the gross and the company", () => {
    // Intl sets a non-breaking space before the euro sign.
    expect(saleNoticeWording(sale, orderDay).subject).toBe(
      "Neuer Verkauf: RE-2026-0002, 5.712,00 € von Kunde GmbH",
    );
    expect(row(sale, "Betrag")).toBe("5.712,00 € (4.800,00 € netto, 912,00 € USt)");
    expect(row(sale, "Zeitraum")).toBe("2. Oktober 2026 bis 1. Oktober 2027");
  });

  test("a sandbox order is marked as one, so nobody books it", () => {
    const mail = saleNoticeWording({ ...sale, sandbox: true }, orderDay);
    expect(mail.subject).toStartWith("[Sandbox] ");
    expect(mail.title).toContain("Sandbox");
  });

  test("money back runs thirty days from the order on an account's first invoice only", () => {
    expect(row(sale, "Geld zurück")).toBe("möglich bis 1. November 2026");
    expect(row({ ...sale, firstOrder: false }, "Geld zurück")).toStartWith("nein");
  });

  test("says who placed it", () => {
    expect(row(sale, "Bestellt")).toBe("vom Kunden auf der Bestellseite");
    expect(row({ ...sale, source: "admin" }, "Bestellt")).toBe(
      "im Platform Admin abgeschlossen",
    );
  });
});
