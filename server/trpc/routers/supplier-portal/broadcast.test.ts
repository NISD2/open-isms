/**
 * An incident notice goes where the customer is reached when it is sent. A
 * customer company linked through an accepted invite is read then, so a
 * contact address changed after the link reaches the next notice; a row with
 * no linked company is mailed at the address the supplier entered.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";

type Relationship = {
  readonly customerCompanyId: string | null;
  readonly customerEmail: string | null;
  readonly unsubscribeToken: string | null;
};

type Company = {
  readonly id: string;
  readonly contactEmail: string | null;
  readonly ownerEmail: string | null;
};

/** What the current test put in the database; tests replace its fields. */
const fixture: {
  rel: Relationship | undefined;
  companies: readonly Company[];
  supplierName: string;
} = {
  rel: undefined,
  companies: [],
  supplierName: "Lieferant GmbH",
};

/** The supplier's own words on the incident row, which no mail may carry. */
const INCIDENT_TEXT = {
  title: "Ausfall Rechenzentrum, Details unter status-lieferant.test",
  description:
    "Storage nicht erreichbar. Neues Passwort hier setzen: https://x.test/reset",
};

type Mail = { to: string; subject: string; html: string; text: string };
const sentTo: string[] = [];
const mails: Mail[] = [];
const closed: Record<string, unknown>[] = [];

/**
 * The drizzle calls one broadcast makes: claim the broadcast row, read the
 * incident, the relationship, the customer's contact and the supplier's name,
 * then record the outcome.
 */
const db = {
  update: () => ({
    set: (values: Record<string, unknown>) => ({
      where: () => {
        if (values.status !== "sending") closed.push(values);
        return Object.assign(Promise.resolve(), {
          returning: async () => [
            {
              id: "broadcast-1",
              incidentId: "incident-1",
              customerRelationshipId: "rel-1",
            },
          ],
        });
      },
    }),
  }),
  query: {
    incident: {
      // Title and description come back even though broadcast.ts no longer
      // selects them, so the mail test below holds whatever the query reads.
      findFirst: async () => ({
        id: "incident-1",
        ...INCIDENT_TEXT,
        severity: "incident",
        companyId: "supplier-co",
        createdAt: new Date("2026-09-30T08:00:00Z"),
      }),
    },
    supplier: { findFirst: async () => fixture.rel },
    company: { findFirst: async () => ({ name: fixture.supplierName }) },
  },
  select: () => ({
    from: () => ({
      leftJoin: () => ({ where: async () => fixture.companies }),
    }),
  }),
};

// lib/mail validates the environment at load, and CI runs this suite without
// one. Same shape as lib/mail/footer.test.ts.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
mock.module("@/lib/db", () => ({ db }));
// Full export shape, as lib/lifecycle/dispatch.test.ts mocks the same module.
mock.module("@/lib/mail/send", () => ({
  sendMail: async (opts: Mail) => {
    sentTo.push(opts.to);
    mails.push(opts);
    return { success: true, id: "sent-1" };
  },
  sendWelcomeEmail: async () => ({ success: true, id: "unused" }),
  mailSuppressionReason: () => null,
}));

const { broadcastIncidentBroadcast } = await import("./broadcast");

const TOKEN = "c".repeat(64);

beforeEach(() => {
  sentTo.splice(0);
  mails.splice(0);
  closed.splice(0);
  fixture.supplierName = "Lieferant GmbH";
});

describe("broadcastIncidentBroadcast", () => {
  test("a linked customer is mailed at its contact address as it is now", async () => {
    // Stored at acceptance: the address before the customer changed it.
    fixture.rel = {
      customerCompanyId: "kunde-a",
      customerEmail: "alt@kunde-a.test",
      unsubscribeToken: TOKEN,
    };
    fixture.companies = [
      { id: "kunde-a", contactEmail: "neu@kunde-a.test", ownerEmail: "gf@kunde-a.test" },
    ];

    expect(await broadcastIncidentBroadcast("broadcast-1")).toBe(true);
    expect(sentTo).toEqual(["neu@kunde-a.test"]);
  });

  test("an unlinked customer is mailed at the address the supplier entered", async () => {
    fixture.rel = {
      customerCompanyId: null,
      customerEmail: "isb@kunde-b.test",
      unsubscribeToken: TOKEN,
    };
    fixture.companies = [];

    expect(await broadcastIncidentBroadcast("broadcast-1")).toBe(true);
    expect(sentTo).toEqual(["isb@kunde-b.test"]);
  });

  // Rows accepted before the invite fix stored the supplier's own address.
  test("a linked customer with no address on file is not mailed at the stored one", async () => {
    fixture.rel = {
      customerCompanyId: "kunde-a",
      customerEmail: "security@lieferant.test",
      unsubscribeToken: TOKEN,
    };
    fixture.companies = [{ id: "kunde-a", contactEmail: null, ownerEmail: null }];

    expect(await broadcastIncidentBroadcast("broadcast-1")).toBe(false);
    expect(sentTo).toEqual([]);
    expect(closed).toEqual([
      expect.objectContaining({ status: "sent", deliveryCount: 0 }),
    ]);
  });
});

describe("the notice mail", () => {
  test("carries none of the supplier's text and no link from its name", async () => {
    fixture.rel = {
      customerCompanyId: null,
      customerEmail: "isb@kunde-b.test",
      unsubscribeToken: TOKEN,
    };
    fixture.companies = [];
    fixture.supplierName = "Lieferant GmbH lieferant-support.test";

    expect(await broadcastIncidentBroadcast("broadcast-1")).toBe(true);
    expect(mails).toHaveLength(1);
    const [mail] = mails;
    const whole = `${mail?.subject}\n${mail?.html}\n${mail?.text}`;
    expect(whole).not.toContain("Ausfall");
    expect(whole).not.toContain("status-lieferant.test");
    expect(whole).not.toContain("Storage");
    expect(whole).not.toContain("x.test");
    expect(whole).not.toContain("lieferant-support.test");
    expect(mail?.subject).toBe(
      "Lieferant GmbH lieferant-support. test reported a security incident",
    );
  });

  test("links to the notice on the customer's access page", async () => {
    fixture.rel = {
      customerCompanyId: null,
      customerEmail: "isb@kunde-b.test",
      unsubscribeToken: TOKEN,
    };
    fixture.companies = [];

    await broadcastIncidentBroadcast("broadcast-1");
    expect(mails[0]?.text).toContain(`/supplier-access/${TOKEN}#incident-incident-1`);
    expect(mails[0]?.html).toContain(`/supplier-access/${TOKEN}#incident-incident-1`);
  });
});
