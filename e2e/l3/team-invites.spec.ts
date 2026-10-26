/**
 * L3: the team page and the invite flow, as the people using them meet it.
 *
 * Before 26.10.2026 a colleague clicking the mail met a bare login form (the invite page sat
 * behind sign-in), an expired invite was listed as pending with no way to send it again, and
 * inviting the same address again killed the link in the first mail. On the team page the members
 * table scrolled sideways inside the portal, so the remove button was off screen, and removing
 * took one click with no confirmation.
 *
 * The e2e stack has no mail transport, so every invite here is created but not mailed, and the
 * page has to say so.
 */
import { expect, type Page, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { e2eQuery } from "../lib/db";
import { assertE2eTargets, E2E_USER_EMAIL } from "../lib/env";

const RUN = Date.now().toString(36);

async function companyId(): Promise<string> {
  const [row] = await e2eQuery<{ company_id: string }>(
    `SELECT company_id FROM "user" WHERE email = $1`,
    [E2E_USER_EMAIL],
  );
  expect(row?.company_id, "the e2e admin has an open company").toBeTruthy();
  return row.company_id;
}

async function inviteRow(email: string) {
  const [row] = await e2eQuery<{ token: string; status: string; expires_at: Date }>(
    `SELECT token, status, expires_at FROM company_invite WHERE email = $1`,
    [email],
  );
  return row;
}

async function openTeam(page: Page) {
  await page.goto("/en/team");
  await expect(page.getByTestId("team-members")).toBeVisible({ timeout: 30_000 });
}

async function inviteViaForm(page: Page, email: string) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByTestId("invite-result")).toBeVisible();
}

test.describe("team page", () => {
  test("the member list fits beside the sidebar, and removing asks first", async ({
    page,
  }) => {
    const company = await companyId();
    const email = `e2e-removable-${RUN}@nis2.local`;
    const [member] = await e2eQuery<{ id: string }>(
      `INSERT INTO "user" (company_id, email, name, email_verified_at)
       VALUES ($1, $2, 'Removable Colleague', NOW()) RETURNING id`,
      [company, email],
    );
    await e2eQuery(
      `INSERT INTO company_membership (user_id, company_id, role, job_title)
       VALUES ($1, $2, 'member', 'cto')`,
      [member.id, company],
    );

    // A 13-inch laptop with the sidebar open, and a phone.
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await openTeam(page);
      const row = page.locator(`[data-testid="team-member"][data-email="${email}"]`);
      const remove = row.getByRole("button", { name: "Remove" });
      await remove.scrollIntoViewIfNeeded();
      await expect(remove).toBeInViewport();
      // The page, and everything from the member list up to it, fits its own width.
      const sideways = await page.getByTestId("team-members").evaluate((list) => {
        const chain: Element[] = [];
        for (let el: Element | null = list; el; el = el.parentElement) chain.push(el);
        return chain.some((el) => el.scrollWidth > el.clientWidth + 1);
      });
      expect(sideways, `nothing scrolls sideways at ${viewport.width}px`).toBe(false);
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await openTeam(page);
    const row = page.locator(`[data-testid="team-member"][data-email="${email}"]`);

    await row.getByRole("button", { name: "Remove" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Remove Removable Colleague from the team?");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    const stillThere = await e2eQuery(
      `SELECT 1 FROM company_membership WHERE user_id = $1 AND company_id = $2`,
      [member.id, company],
    );
    expect(stillThere, "cancel removes nobody").toHaveLength(1);

    await row.getByRole("button", { name: "Remove" }).click();
    await dialog.getByRole("button", { name: "Remove" }).click();
    await expect(row).toBeHidden();
    await expect
      .poll(
        async () =>
          (
            await e2eQuery(
              `SELECT 1 FROM company_membership WHERE user_id = $1 AND company_id = $2`,
              [member.id, company],
            )
          ).length,
      )
      .toBe(0);
  });
});

test.describe("invites", () => {
  test("says when the mail did not go out, and inviting again keeps the first link", async ({
    page,
  }) => {
    const email = `e2e-invitee-${RUN}@nis2.local`;
    await openTeam(page);

    await inviteViaForm(page, email);
    await expect(page.getByTestId("invite-result")).toContainText(
      `The email to ${email} did not go out`,
    );
    const first = await inviteRow(email);
    expect(first?.status).toBe("pending");

    await inviteViaForm(page, email);
    const second = await inviteRow(email);
    expect(second?.token, "the link in the first mail still works").toBe(first?.token);
  });

  test("an expired invite says so and is sent again with a new link", async ({
    page,
  }) => {
    const email = `e2e-expired-${RUN}@nis2.local`;
    await openTeam(page);
    await inviteViaForm(page, email);
    const issued = await inviteRow(email);
    await e2eQuery(
      `UPDATE company_invite SET expires_at = NOW() - INTERVAL '3 days' WHERE email = $1`,
      [email],
    );

    await openTeam(page);
    const row = page.locator(`[data-testid="team-invite"][data-email="${email}"]`);
    await expect(row).toContainText("The link expired on");
    await expect(row.getByRole("button", { name: "Copy link" })).toHaveCount(0);

    await row.getByRole("button", { name: "Send again" }).click();
    await expect(row).toContainText("The link works until");
    const renewed = await inviteRow(email);
    expect(renewed?.token, "an expired link is never revived").not.toBe(issued?.token);
    expect(new Date(renewed?.expires_at ?? 0).getTime()).toBeGreaterThan(Date.now());

    await row.getByRole("button", { name: "Withdraw" }).click();
    await expect(row).toBeHidden();
    expect((await inviteRow(email))?.status).toBe("revoked");
  });

  test("the invite link tells a visitor without an account whose invite it is", async ({
    page,
    browser,
  }) => {
    const email = `e2e-visitor-${RUN}@nis2.local`;
    await openTeam(page);
    await inviteViaForm(page, email);
    const invite = await inviteRow(email);

    const visitor = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const anon = await visitor.newPage();
    try {
      await anon.goto(`/en/invite/${invite?.token}`);
      await expect(anon.getByText(`This invite is for ${email}.`)).toBeVisible();
      const create = anon.getByRole("link", { name: "Create account" });
      await expect(create).toHaveAttribute("href", /mode=register/);
      await create.click();
      await expect(anon.locator("#email")).toHaveValue(email);

      await e2eQuery(`UPDATE company_invite SET status = 'revoked' WHERE email = $1`, [
        email,
      ]);
      await anon.goto(`/en/invite/${invite?.token}`);
      await expect(anon.getByRole("heading", { name: "Invite withdrawn" })).toBeVisible();

      await anon.goto(`/en/invite/${"0".repeat(64)}`);
      await expect(
        anon.getByRole("heading", { name: "Invite link no longer works" }),
      ).toBeVisible();
    } finally {
      await visitor.close();
    }
  });

  /**
   * The step that makes someone a member, end to end: a colleague with no account opens the
   * mail's link, creates an account with the invited address, confirms the code, comes back to
   * the invite and accepts. The harness has no mail, so the code is planted the way signup.spec.ts
   * does it.
   */
  test("a colleague without an account joins from the invite link", async ({
    page,
    browser,
  }) => {
    const email = `e2e-joiner-${RUN}@e2e.local`;
    await openTeam(page);
    await inviteViaForm(page, email);
    const invite = await inviteRow(email);
    const company = await companyId();

    const visitor = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const joiner = await visitor.newPage();
    try {
      await joiner.goto(`/en/invite/${invite?.token}`);
      await joiner.getByRole("link", { name: "Create account" }).click();
      await expect(joiner.locator("#email")).toHaveValue(email);
      await joiner.locator("#password").fill("JoinerPassword1!");

      const codesBefore = await codesFor(email);
      await joiner.getByRole("button", { name: "Create account" }).click();
      await expect(joiner.locator("#code")).toBeVisible({ timeout: 30_000 });
      // The code is issued after the response, so wait for it before planting a known one.
      await expect
        .poll(() => codesFor(email), { timeout: 30_000 })
        .toBeGreaterThan(codesBefore);
      await plantCode(email, "246810");
      await joiner.locator("#code").fill("246810");
      await joiner.getByRole("button", { name: "Verify and sign in" }).click();

      // Signed in, the person is back on the invite and accepts it.
      await joiner.waitForURL(/\/invite\//, { timeout: 30_000 });
      await joiner.getByRole("button", { name: "Accept Invite" }).click();
      await joiner.waitForURL((url) => !url.pathname.includes("/invite/"), {
        timeout: 30_000,
      });

      const joined = await e2eQuery(
        `SELECT 1 FROM company_membership m JOIN "user" u ON u.id = m.user_id
          WHERE u.email = $1 AND m.company_id = $2`,
        [email, company],
      );
      expect(joined, "the colleague is a member of the inviting company").toHaveLength(1);
      expect((await inviteRow(email))?.status).toBe("accepted");

      // The inviting company's activity log says who joined (fire-and-forget, so poll).
      await expect
        .poll(
          async () =>
            (
              await e2eQuery(
                `SELECT 1 FROM audit_log
                WHERE company_id = $1 AND action = 'team.invite_accepted' AND description = $2`,
                [company, `Invite accepted by ${email}`],
              )
            ).length,
        )
        .toBe(1);
    } finally {
      await visitor.close();
    }
  });
});

async function codesFor(email: string): Promise<number> {
  const [row] = await e2eQuery<{ n: number }>(
    `SELECT count(*)::int AS n FROM email_otp WHERE email = $1 AND purpose = 'email_verify'`,
    [email],
  );
  return row?.n ?? 0;
}

/** One known live code for `email`, consuming the ones issued before, as a resend does. */
async function plantCode(email: string, code: string): Promise<void> {
  assertE2eTargets();
  await e2eQuery(
    `UPDATE email_otp SET consumed_at = now()
      WHERE email = $1 AND purpose = 'email_verify' AND consumed_at IS NULL`,
    [email],
  );
  await e2eQuery(
    `INSERT INTO email_otp (email, code_hash, purpose, expires_at)
     VALUES ($1, $2, 'email_verify', now() + interval '10 minutes')`,
    [email, await bcrypt.hash(code, 10)],
  );
}
