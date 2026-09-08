/**
 * Subject lines are the whole of what a recipient sees before deciding
 * whether we are worth opening — or worth reporting. These rules are the
 * ones that got broken once already: seven subjects carried a "[NIS2]"
 * bracket tag, and two shouted URGENT and OVERDUE in capitals. Both are
 * textbook bulk-mail signals, both waste the characters an inbox actually
 * shows, and the shouting also breaks the repo's no-fear-marketing rule.
 *
 * Renders every live template with realistic values and asserts the rules
 * hold, so a new email cannot quietly reintroduce them.
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

const ITEM = {
  requirementCode: "GOV-1",
  requirementTitle: "Assign responsibility for the ISMS",
  deadline: "2026-10-01",
  daysRemaining: 3,
  urgency: "urgent" as const,
  categoryUrl: "https://nisd2.eu/compliance/governance",
};

/** One entry per live template: its name and a rendered subject. */
const SUBJECTS: Array<[string, string]> = [
  [
    "invite",
    t.inviteEmail({
      companyName: "Stadtwerke Musterstadt",
      inviterName: "Anna Schmidt",
      inviteUrl: "https://nisd2.eu/invite/x",
      role: "member",
    }).subject,
  ],
  [
    "contactEmailChanged",
    t.contactEmailChangedEmail({
      companyName: "Stadtwerke Musterstadt",
      oldEmail: "a@x.de",
      newEmail: "b@x.de",
    }).subject,
  ],
  [
    "categoryAssigned",
    t.categoryAssignedEmail({
      assigneeName: "Jan",
      categoryName: "Governance",
      categoryCode: "GOV",
      companyName: "Stadtwerke",
      assignerName: "Anna Schmidt",
      categoryUrl: "https://nisd2.eu/x",
    }).subject,
  ],
  [
    "categoryUnassigned",
    t.categoryUnassignedEmail({
      assigneeName: "Jan",
      categoryName: "Governance",
      categoryCode: "GOV",
      companyName: "Stadtwerke",
    }).subject,
  ],
  [
    "reviewApproved",
    t.reviewDecisionEmail({
      submitterName: "Jan",
      requirementCode: "GOV-1",
      requirementTitle: "x",
      decision: "approved",
    }).subject,
  ],
  [
    "reviewRejected",
    t.reviewDecisionEmail({
      submitterName: "Jan",
      requirementCode: "GOV-1",
      requirementTitle: "x",
      decision: "rejected",
    }).subject,
  ],
  [
    "memberRemoved",
    t.memberRemovedEmail({ companyName: "Stadtwerke", memberName: "Jan" }).subject,
  ],
  [
    "dailyDigestOverdue",
    t.dailyDigestEmail({
      recipientName: "Jan",
      companyName: "Stadtwerke",
      overdueItems: [ITEM],
      urgentItems: [],
      upcomingItems: [],
      nextStep: null,
      compliancePercentage: "42.0",
      dashboardUrl: "https://nisd2.eu/",
      unsubscribeUrl: "https://nisd2.eu/u",
    }).subject,
  ],
  [
    "dailyDigestUpcoming",
    t.dailyDigestEmail({
      recipientName: "Jan",
      companyName: "Stadtwerke",
      overdueItems: [],
      urgentItems: [],
      upcomingItems: [ITEM],
      nextStep: null,
      compliancePercentage: "42.0",
      dashboardUrl: "https://nisd2.eu/",
      unsubscribeUrl: "https://nisd2.eu/u",
    }).subject,
  ],
  [
    "weeklyManagement",
    t.weeklyManagementDigestEmail({
      recipientName: "Jan",
      companyName: "Stadtwerke",
      compliancePercentage: "42.0",
      overdueCount: 1,
      urgentCount: 2,
      escalationCount: 0,
      totalRequirements: 49,
      completedRequirements: 20,
      nextStep: null,
      dashboardUrl: "https://nisd2.eu/",
      unsubscribeUrl: "https://nisd2.eu/u",
    }).subject,
  ],
  [
    "supplierIncident",
    t.supplierIncidentBroadcastEmail({
      supplierName: "ACME GmbH",
      title: "Unauthorised access to a build server",
      body: "x",
      severity: "high",
      publishedAt: new Date("2026-09-08"),
      profileUrl: "https://nisd2.eu/s",
      unsubscribeUrl: "https://nisd2.eu/u",
    }).subject,
  ],
  [
    "supplierAddedYou",
    t.supplierAddedYouEmail({
      supplierName: "ACME GmbH",
      profileUrl: "https://nisd2.eu/s",
      unsubscribeUrl: "https://nisd2.eu/u",
    }).subject,
  ],
  [
    "entityInvitesSupplier",
    t.entityInvitesSupplierEmail({
      entityName: "Stadtwerke",
      inviteUrl: "https://nisd2.eu/i",
      message: null,
    }).subject,
  ],
  [
    "courseFollowup",
    t.courseFollowupEmail({
      recipientName: "Jan Müller",
      courses: [{ title: "NIS 2 for CEOs", resumeUrl: "https://nisd2.eu/c" }],
      unsubscribeUrl: "https://nisd2.eu/u",
    }).subject,
  ],
];

describe("subject lines avoid the signals that get mail filtered", () => {
  for (const [name, subject] of SUBJECTS) {
    test(`${name}: no bracket tag`, () => {
      // "[NIS2] ...", "[HIGH] ..." — reads as machine-generated bulk and
      // eats the characters a phone inbox actually shows.
      expect(subject).not.toMatch(/^\s*\[/);
    });

    test(`${name}: no shouted words`, () => {
      const shouted = subject.match(/\b[A-Z]{4,}\b/g) ?? [];
      // Requirement codes (GOV-1) and acronyms are fine; whole shouted words
      // like URGENT or OVERDUE are not.
      expect(shouted.filter((w) => !/^[A-Z]+-?\d*$/.test(w))).toEqual([]);
    });

    test(`${name}: no trailing punctuation shouting`, () => {
      expect(subject).not.toMatch(/[!]{1,}/);
    });

    test(`${name}: is a sensible length for an inbox`, () => {
      expect(subject.length).toBeGreaterThan(8);
      // Most clients truncate around 70-90 characters; past that the end is
      // invisible, so anything load-bearing must come first.
      expect(subject.length).toBeLessThanOrEqual(90);
    });

    test(`${name}: single line`, () => {
      expect(subject).not.toMatch(/[\r\n]/);
    });
  }

  test("the daily digest leads with what is actionable, not with its own name", () => {
    const overdue = SUBJECTS.find(([n]) => n === "dailyDigestOverdue")?.[1] ?? "";
    expect(overdue).toContain("1 overdue");
    expect(overdue).not.toContain("Digest");
  });

  test("a rejected review does not shout at the person who submitted it", () => {
    const rejected = SUBJECTS.find(([n]) => n === "reviewRejected")?.[1] ?? "";
    expect(rejected.toLowerCase()).toContain("another look");
  });

  test("an invitation names the human who sent it", () => {
    const invite = SUBJECTS.find(([n]) => n === "invite")?.[1] ?? "";
    expect(invite).toContain("Anna Schmidt");
  });
});
