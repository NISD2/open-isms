/**
 * A Czech partner reads a translation of the English offer. Pinned here: the language the page was
 * read in only ever picks a language (the mail around the copy, the language of an account the
 * offer opened while nobody has signed into it, and which translation is recorded); what is
 * accepted and hashed stays the stored English text, the translation read is recorded beside it,
 * and a language the offer cannot be read in falls back to the offer's own.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";

const ADMIN = "admin@nisd2.example";

mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("@/lib/rate-limit", () => ({ rateLimit: async () => true }));
// Other test files mock this module as "nobody is an admin"; mocks are shared by the whole run.
mock.module("@/lib/auth/platform-admin", () => ({
  getPlatformAdminEmails: () => [ADMIN],
  isPlatformAdmin: (email: string | null | undefined) => email === ADMIN,
  requirePlatformAdmin: async () => {},
}));

const mailed: { row: unknown; locale: string }[] = [];
const mail = await import("@/lib/partner-contract/mail");
mock.module("@/lib/partner-contract/mail", () => ({
  ...mail,
  sendPartnerContractAcceptedMails: async (row: unknown, locale: string) => {
    mailed.push({ row, locale });
    return { partnerCopySent: true };
  },
}));
const provisioned: string[] = [];
const access = await import("@/lib/partner-contract/access");
mock.module("@/lib/partner-contract/access", () => ({
  ...access,
  provisionPartnerAccess: async (_db: unknown, _contact: unknown, locale: string) => {
    provisioned.push(locale);
    return { outcome: "new_account", userId: ACCOUNT };
  },
}));
const offer = await import("@/lib/partner-contract/offer");
mock.module("@/lib/partner-contract/offer", () => ({
  ...offer,
  canOfferPartnerContracts: () => true,
}));

const { createCallerFactory } = await import("../init");
const { partnerContractRouter } = await import("./partner-contract");
const { partnerContract, user } = await import("@/schema");
const { buildPartnerContract, partnerContractSha256, partnerContractTranslation } =
  await import("@/lib/partner-contract/document");
type TRPCContext = import("../init").TRPCContext;
type PartnerAccessOutcome = import("@/lib/partner-contract/access").PartnerAccessOutcome;

const ACCOUNT = "11111111-1111-4111-8111-111111111111";
const TOKEN = "a".repeat(64);

const englishOffer = (accessOutcome: PartnerAccessOutcome = "new_account") => {
  const terms = {
    locale: "en" as const,
    partnerCompany: "Příklad s.r.o.",
    commissionPercent: 12,
    commissionMonths: 12,
  };
  return {
    ...terms,
    id: "22222222-2222-4222-8222-222222222222",
    token: TOKEN,
    partnerContactName: "Jana Nováková",
    partnerEmail: "jana@priklad.example",
    accessOutcome,
    accessUserId: ACCOUNT,
    templateVersion: "test",
    body: buildPartnerContract(terms),
    createdAt: new Date("2026-10-15T08:00:00Z"),
    createdByEmail: ADMIN,
    withdrawnAt: null,
    signedAt: null,
    signerName: null,
    signerEmail: null,
    signerIp: null,
    signerUserAgent: null,
    signedTextSha256: null,
    signedReadingLocale: null,
    signedTranslationSha256: null,
  };
};

type Offer = ReturnType<typeof englishOffer>;
type Write = { table: unknown; values: Record<string, unknown> };

/** The account the offer opened, as the user table holds it: nobody has signed in unless asked. */
const openedAccount = (gotIn = false) => ({
  id: ACCOUNT,
  email: "jana@priklad.example",
  emailVerifiedAt: gotIn ? new Date("2026-10-15T09:00:00Z") : null,
  loginCount: gotIn ? 1 : 0,
  lastLoginAt: gotIn ? new Date("2026-10-15T09:00:00Z") : null,
});

/** A database holding one offer, recording every write; `update ... returning` echoes the row. */
function setup(
  stored: Offer,
  session: TRPCContext["session"] = null,
  account = openedAccount(),
) {
  const updates: Write[] = [];
  const inserts: Write[] = [];
  const db = {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => [account] }) }),
    }),
    query: {
      partnerContract: {
        findFirst: async () => stored,
        findMany: async () => [stored],
      },
    },
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        returning: async () => {
          inserts.push({ table, values });
          return [{ id: stored.id, token: TOKEN }];
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          updates.push({ table, values });
          return Object.assign(Promise.resolve(), {
            returning: async () => [{ ...stored, ...values }],
          });
        },
      }),
    }),
  };
  const caller = createCallerFactory(partnerContractRouter)({
    db: db as unknown as TRPCContext["db"],
    session,
    userId: session ? "admin-user" : null,
    companyId: null,
    ip: "test",
    userAgent: "test-agent",
  } as TRPCContext);
  return { caller, updates, inserts };
}

const signing = {
  token: TOKEN,
  name: "Jana Nováková",
  email: "jana@priklad.example",
  authority: true as const,
};

beforeEach(() => {
  mailed.length = 0;
  provisioned.length = 0;
});

describe("partnerContract.accept, read in Czech", () => {
  test("mails in Czech and sets the opened account to Czech; the English text is what is hashed", async () => {
    const stored = englishOffer();
    const { caller, updates } = setup(stored);
    await caller.accept({ ...signing, locale: "cs" });

    const acceptance = updates.find((u) => u.table === partnerContract);
    expect(acceptance?.values.signedTextSha256).toBe(partnerContractSha256(stored.body));
    expect(updates.find((u) => u.table === user)?.values).toEqual({ locale: "cs" });
    expect(mailed.map((m) => m.locale)).toEqual(["cs"]);
  });

  test("records that Czech was read, with the hash of the Czech text its page shows", async () => {
    const stored = englishOffer();
    const { caller, updates } = setup(stored);
    await caller.accept({ ...signing, locale: "cs" });

    const shown = partnerContractTranslation(stored, "cs");
    if (!shown) throw new Error("no Czech text under today's wording");
    const acceptance = updates.find((u) => u.table === partnerContract)?.values;
    expect(acceptance?.signedReadingLocale).toBe("cs");
    expect(acceptance?.signedTranslationSha256).toBe(partnerContractSha256(shown.body));
    expect(acceptance?.signedTranslationSha256).not.toBe(acceptance?.signedTextSha256);
  });

  test("an English accept of an English offer records English and no translation", async () => {
    const { caller, updates } = setup(englishOffer());
    await caller.accept({ ...signing, locale: "en" });

    const acceptance = updates.find((u) => u.table === partnerContract)?.values;
    expect(acceptance?.signedReadingLocale).toBe("en");
    expect(acceptance?.signedTranslationSha256).toBeNull();
  });

  test("a language the offer is not read in falls back to the offer's own", async () => {
    const { caller, updates } = setup(englishOffer());
    await caller.accept({ ...signing, locale: "de" });

    expect(updates.find((u) => u.table === partnerContract)?.values).toMatchObject({
      signedReadingLocale: "en",
      signedTranslationSha256: null,
    });
    expect(updates.find((u) => u.table === user)?.values).toEqual({ locale: "en" });
    expect(mailed.map((m) => m.locale)).toEqual(["en"]);
  });

  test("an opened account someone has signed into keeps the language its holder chose", async () => {
    const { caller, updates } = setup(englishOffer(), null, openedAccount(true));
    await caller.accept({ ...signing, locale: "en" });

    expect(updates.some((u) => u.table === user)).toBe(false);
    expect(mailed.map((m) => m.locale)).toEqual(["en"]);
  });

  test("a page loaded before the locale was sent still accepts, in the offer's language", async () => {
    const { caller } = setup(englishOffer());
    await caller.accept(signing);
    expect(mailed.map((m) => m.locale)).toEqual(["en"]);
  });

  test("an account that existed before the offer keeps its language", async () => {
    const { caller, updates } = setup(englishOffer("existing_account"));
    await caller.accept({ ...signing, locale: "cs" });
    expect(updates.some((u) => u.table === user)).toBe(false);
    expect(mailed.map((m) => m.locale)).toEqual(["cs"]);
  });

  test("anything but an app locale is refused before anything is written", async () => {
    const { caller, updates } = setup(englishOffer());
    await expect(caller.accept({ ...signing, locale: "xx-evil" })).rejects.toThrow();
    expect(updates).toHaveLength(0);
    expect(mailed).toHaveLength(0);
  });
});

describe("partnerContract for the admin", () => {
  const admin = { user: { id: "admin-user", email: ADMIN } } as TRPCContext["session"];

  test("an offer for a Czech reader stores the English text and opens a Czech account", async () => {
    const { caller, inserts, updates } = setup(englishOffer(), admin);
    const created = await caller.create({
      readerLocale: "cs",
      partnerCompany: "Příklad s.r.o.",
      partnerContactName: "Jana Nováková",
      partnerEmail: "jana@priklad.example",
      commissionPercent: 12,
      commissionMonths: 12,
    });

    const stored = inserts.find((i) => i.table === partnerContract)?.values;
    expect(stored?.locale).toBe("en");
    expect(JSON.stringify(stored?.body)).toContain("Partner agreement");
    expect(stored).not.toHaveProperty("readerLocale");
    // Created in Czech in one write, so no second write can fail and leave it English.
    expect(provisioned).toEqual(["cs"]);
    expect(updates.some((u) => u.table === user)).toBe(false);
    expect(created.url).toEndWith(`/cs/partner-agreement/${TOKEN}`);
  });

  test("lists an English and a Czech link for an English offer, and no text", async () => {
    const { caller } = setup(englishOffer(), admin);
    const { rows } = await caller.list();
    expect(rows[0]?.links.map((l) => l.locale)).toEqual(["en", "cs"]);
    expect(rows[0]?.links[1]?.url).toEndWith(`/cs/partner-agreement/${TOKEN}`);
    expect(rows[0]).not.toHaveProperty("body");
    expect(rows[0]).not.toHaveProperty("token");
  });
});
