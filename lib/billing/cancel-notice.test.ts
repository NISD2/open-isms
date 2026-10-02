/**
 * A cancel made by deleting the account is confirmed inside the erasure letter: the holder gets no
 * email of its own, the accounting address still gets the credit note, and the PDF Qonto renders
 * travels with the letter. Qonto is answered by a stubbed fetch.
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.test",
}));

interface Sent {
  readonly emailType: string;
  readonly to: string | readonly string[];
  readonly failureLabel?: string;
  readonly attachments?: readonly { readonly filename: string }[];
}
const sent: Sent[] = [];
mock.module("@/lib/mail/send", () => ({
  sendMail: async (opts: Sent) => {
    sent.push(opts);
    return { success: true, id: "sent" };
  },
  sendWelcomeEmail: async () => ({ success: true, id: "unused" }),
  mailSuppressionReason: () => null,
}));

// Mocked modules are shared with the other test files, so only putObject is replaced.
const storage = await import("@/lib/storage");
const archived: string[] = [];
mock.module("@/lib/storage", () => ({
  ...storage,
  putObject: async (key: string) => {
    archived.push(key);
  },
}));

mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [],
  isPlatformAdmin: () => false,
  requirePlatformAdmin: async () => {},
}));

const { encloseCancelNotice } = await import("./cancel-notice");
type Notice = Parameters<typeof encloseCancelNotice>[0];

const QONTO = { baseUrl: "https://qonto.test/v2", login: "l", secretKey: "s" };
const PDF = new TextEncoder().encode("%PDF-1.4 credit note");

const moneyBack = (accounting: readonly string[]): Notice => ({
  kind: "money_back",
  holder: { email: "anna@kunde.example", locale: "de" },
  accounting,
  creditNote: {
    qonto: QONTO,
    qontoCreditNoteId: "cn-1",
    creditNoteNumber: "GS-2026-0002",
    creditNoteDate: "2026-10-02",
    invoiceNumber: "RE-2026-0002",
    invoiceIssueDate: "2026-10-02",
    amounts: { netCents: 480_000, vatCents: 91_200 },
    billingAccountId: "ba-1",
    refundOwed: false,
  },
});

const realFetch = globalThis.fetch;

/** Qonto with the credit note's PDF rendered, or still without one. */
const qontoAnswers = (rendered: boolean) => {
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
  globalThis.fetch = Object.assign(
    async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/credit_notes/cn-1")) {
        return json({ credit_note: rendered ? { attachment_id: "att-1" } : {} });
      }
      if (url.endsWith("/attachments/att-1")) {
        return json({ attachment: { url: "https://files.qonto.test/gs.pdf" } });
      }
      if (url === "https://files.qonto.test/gs.pdf")
        return new Response(PDF, { status: 200 });
      return new Response("not found", { status: 404 });
    },
    { preconnect: realFetch.preconnect },
  );
};

const noWait = async () => {};
const customerMail = () => sent.filter((m) => m.emailType === "billing.canceled");

beforeEach(() => {
  sent.splice(0);
  archived.splice(0);
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("encloseCancelNotice", () => {
  test("a credit note goes into the letter with its PDF, and the holder gets no email of its own", async () => {
    qontoAnswers(true);
    const { section, attachment } = await encloseCancelNotice(moneyBack([]), noWait);

    expect(customerMail()).toEqual([]);
    expect(attachment?.filename).toBe("GS-2026-0002.pdf");
    expect(archived).toEqual(["billing/ba-1/GS-2026-0002.pdf"]);
    expect(section.document.kind).toBe("Gutschrift");
    expect(section.intro.join(" ")).toContain("die Sie im Anhang finden");
    // The letter it travels in is the erasure confirmation, so it announces no other email.
    expect(section.outro.join(" ")).not.toMatch(/eigenen E-Mail|bleiben in Ihrem Konto/);
  });

  test("the accounting address still gets the credit note on its own, and only it", async () => {
    qontoAnswers(true);
    await encloseCancelNotice(moneyBack(["buchhaltung@kunde.example"]), noWait);

    const [copy, ...more] = customerMail();
    expect(more).toEqual([]);
    expect(copy?.to).toEqual(["buchhaltung@kunde.example"]);
    expect(copy?.attachments?.map((a) => a.filename)).toEqual(["GS-2026-0002.pdf"]);
    // The holder's address must not outlive the erasure in a failure record.
    expect(copy?.failureLabel).toBe("self-erasure, billing account ba-1");
  });

  test("without a PDF from Qonto the credit note still goes in, and says nothing is attached", async () => {
    qontoAnswers(false);
    const { section, attachment } = await encloseCancelNotice(moneyBack([]), noWait);

    expect(attachment).toBeNull();
    expect(section.document.reference).toStartWith("GS-2026-0002");
    expect(section.intro.join(" ")).not.toContain("Anhang");
  });

  test("a stopped renewal goes in as the cancellation, with access ending at the deletion", async () => {
    const { section, attachment } = await encloseCancelNotice({
      kind: "renewal",
      billingAccountId: "ba-1",
      holder: { email: "anna@kunde.example", locale: "en" },
      invoiceNumber: "RE-2026-0002",
      periodEnd: "2027-10-01",
      reason: "window_passed",
    });

    expect(attachment).toBeNull();
    expect(sent).toEqual([]);
    expect(section.document.kind).toBe("Cancellation");
    expect(section.document.facts.map((f) => f.value)).toContain(
      "Ends with the deletion of your account",
    );
  });
});
