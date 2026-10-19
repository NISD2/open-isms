/**
 * A Czech reader's mail is Czech end to end, and the law it names is Czech law: the Act
 * 264/2025 Sb., its decrees and NÚKIB, never the BSIG. German and Dutch readers keep the English
 * workflow mail they had before Czech was added, so those paths are pinned too.
 */
import { describe, expect, mock, test } from "bun:test";

mock.module("../env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.com",
}));

const t = await import("./templates");
const { preferenceFooterText } = await import("./layout");
const { parsePreferenceLocale } = await import("./email-type-labels");

const footer = (locale: "de" | "en" | "nl" | "cs") =>
  ({
    unsubscribeUrl: "https://nisd2.eu/u",
    preferencesUrl: "https://nisd2.eu/p",
    locale,
  }) as const;

const NEXT_STEP = {
  requirementCode: "GOV-1",
  requirementTitle: "Odpovědnost za kybernetickou bezpečnost",
  url: "https://nisd2.eu/cs/journey#GOV-1",
  done: 3,
  total: 49,
  categoryName: "Řízení",
  categoryDone: 1,
  categoryTotal: 4,
  assigneeName: null,
};

const czechMails = async () => [
  await t.welcomeEmail({ name: "Jana Nováková", locale: "cs" }),
  await t.inviteEmail({
    companyName: "Příklad s.r.o.",
    inviterName: "Jana Nováková",
    inviteUrl: "https://nisd2.eu/invite/x",
    role: "ceo",
    locale: "cs",
  }),
  await t.memberRemovedEmail({
    companyName: "Příklad s.r.o.",
    memberName: "Petr",
    locale: "cs",
  }),
  await t.contactEmailChangedEmail({
    companyName: "Příklad s.r.o.",
    oldEmail: "it@priklad.example",
    newEmail: "bezpecnost@priklad.example",
    locale: "cs",
  }),
  await t.categoryAssignedEmail({
    assigneeName: "Petr",
    categoryName: "Řízení",
    categoryCode: "GOV",
    companyName: "Příklad s.r.o.",
    assignerName: "Jana Nováková",
    categoryUrl: "https://nisd2.eu/cs/journey",
    footer: footer("cs"),
  }),
  await t.categoryUnassignedEmail({
    assigneeName: "Petr",
    categoryName: "Řízení",
    categoryCode: "GOV",
    companyName: "Příklad s.r.o.",
    footer: footer("cs"),
  }),
  await t.reviewDecisionEmail({
    submitterName: "Petr",
    requirementCode: "GOV-1",
    requirementTitle: "Odpovědnost",
    decision: "approved",
    feedback: "Dobře.",
    footer: footer("cs"),
  }),
  await t.dailyDigestEmail({
    recipientName: "Petr",
    companyName: "Příklad s.r.o.",
    overdueItems: [],
    urgentItems: [],
    upcomingItems: [],
    nextStep: NEXT_STEP,
    compliancePercentage: "42.0",
    dashboardUrl: "https://nisd2.eu/cs/dashboard",
    footer: footer("cs"),
  }),
  await t.weeklyManagementDigestEmail({
    recipientName: "Petr",
    companyName: "Příklad s.r.o.",
    compliancePercentage: "42.0",
    overdueCount: 0,
    urgentCount: 1,
    escalationCount: 0,
    totalRequirements: 49,
    completedRequirements: 20,
    nextStep: NEXT_STEP,
    dashboardUrl: "https://nisd2.eu/cs/dashboard",
    footer: footer("cs"),
  }),
  await t.courseFollowupEmail({
    recipientName: "Jana Nováková",
    courses: [{ title: "Školení NIS2 pro vedení", resumeUrl: "https://nisd2.eu/cs/c" }],
    unsubscribeUrl: "https://nisd2.eu/u",
    locale: "cs",
  }),
  await t.managementHandoffEmail({
    locale: "cs",
    name: "Jana Nováková",
    inviterName: "Petr Svoboda",
    companyName: "Příklad s.r.o.",
    inviteUrl: "https://nisd2.eu/invite/x",
    days: 7,
  }),
  await t.accountSetupEmail({ setupUrl: "https://nisd2.eu/setup", locale: "cs" }),
];

describe("Czech mail", () => {
  test("every workflow mail renders in Czech, with no German law and no English greeting", async () => {
    for (const mail of await czechMails()) {
      for (const part of [mail.subject, mail.text, mail.html]) {
        expect(part).not.toContain("BSIG");
        expect(part).not.toContain("Hi ");
        expect(part).not.toContain("Hello");
        expect(part).not.toContain("—");
        // A Czech company name ends in "s.r.o.": no sentence may end on it.
        expect(part).not.toContain("s.r.o..");
      }
      expect(mail.html).toContain('lang="cs"');
    }
  });

  test("the welcome names the Czech duty and NÚKIB's own proof, never ours as the proof", async () => {
    const { text } = await t.welcomeEmail({ name: "Jana", locale: "cs" });
    expect(text).toContain("vyhláška č. 410/2025 Sb., § 4 písm. b)");
    expect(text).toContain("vyhláška č. 409/2025 Sb., § 4 odst. 1 písm. a)");
    expect(text).toContain("uznává NÚKIB certifikát svého kurzu");
    expect(text).toContain("https://nisd2.eu/cs/training/courses/nis2-ceo");
    expect(text.startsWith("Dobrý den,")).toBe(true);
  });

  test("the weekly report records management's acquaintance under the Czech decrees", async () => {
    const mails = await czechMails();
    const weekly = mails[8];
    expect(weekly.text).toContain("vyhláška č. 410/2025 Sb., § 4 písm. d)");
    expect(weekly.text).toContain("vyhláška č. 409/2025 Sb., § 4 odst. 2");
    expect(weekly.text).not.toContain("Leitungsunterrichtung");
    expect(weekly.subject).toContain("42,0 %");
  });

  test("the payoff line and the invitation role are Czech", async () => {
    const mails = await czechMails();
    expect(mails[7].text).toContain("Máte hotovo 3 z celkem 49 kroků");
    expect(mails[1].text).toContain("v roli Generální ředitel / Jednatel");
  });

  test("the handoff declines a Czech plural and says the login is the reader's own", async () => {
    const mails = await czechMails();
    expect(mails[10].text).toContain("Pozvánka platí 7 dní.");
    expect(mails[10].text).toContain("pod vlastním přihlášením");
  });

  test("the preference footer and centre speak Czech", () => {
    expect(preferenceFooterText(footer("cs"))).toContain("Odhlásit odběr e-mailů");
    expect(parsePreferenceLocale("cs")).toBe("cs");
    expect(parsePreferenceLocale("fr")).toBe("de");
  });
});

describe("other readers keep the mail they had", () => {
  test("a German or Dutch footer still frames the English workflow body", async () => {
    for (const locale of ["de", "nl", "en"] as const) {
      const mail = await t.categoryAssignedEmail({
        assigneeName: "Jan",
        categoryName: "Governance",
        categoryCode: "GOV",
        companyName: "Stadtwerke",
        assignerName: "Anna Schmidt",
        categoryUrl: "https://nisd2.eu/x",
        footer: footer(locale),
      });
      expect(mail.subject).toBe("Anna Schmidt assigned you Governance");
      expect(mail.text.startsWith("New Assignment")).toBe(true);
    }
  });

  test("the English welcome and weekly report are unchanged", async () => {
    const welcome = await t.welcomeEmail({ name: "Anna", locale: "de" });
    expect(welcome.subject).toBe("Welcome to NISD2");
    expect(welcome.text).toContain(
      "A good first step is the free CEO and management course (https://nisd2.eu/training/courses/nis2-ceo).",
    );
    const weekly = await t.weeklyManagementDigestEmail({
      recipientName: "Jan",
      companyName: "Stadtwerke",
      compliancePercentage: "42.0",
      overdueCount: 0,
      urgentCount: 0,
      escalationCount: 0,
      totalRequirements: 49,
      completedRequirements: 20,
      nextStep: null,
      dashboardUrl: "https://nisd2.eu/",
      footer: footer("de"),
    });
    expect(weekly.subject).toBe("Stadtwerke is at 42.0% on NIS 2 this week");
    expect(weekly.text).toContain("Art. 20 NIS 2 / §38 BSIG.");
  });

  test("callers that name no language keep the English invitation", async () => {
    const mail = await t.inviteEmail({
      companyName: "Stadtwerke",
      inviterName: "Anna Schmidt",
      inviteUrl: "https://nisd2.eu/invite/x",
      role: "member",
    });
    expect(mail.text).toContain(
      "Anna Schmidt has invited you to join Stadtwerke as member on the NIS2 Compliance Platform.",
    );
  });
});
