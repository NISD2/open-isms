/**
 * Email templates: plain functions returning { subject, html, text }
 *
 * Usage:
 *   const email = inviteEmail({ ... });
 *   await sendMail({ to: "user@co.com", ...email });
 */

import type { Locale } from "@/lib/seo";
// Shared scaffolding (brand tokens, layout, escaping) lives in ./layout so
// email modules outside this file (lib/lifecycle) can reuse it.
import {
  BRAND,
  type EmailContent,
  emailLayout,
  escapeHtml,
  type PreferenceFooter,
  preferenceFooterText,
  SEVERITY,
  safeHeader,
} from "./layout";

// ---------------------------------------------------------------------------
// Invite
// ---------------------------------------------------------------------------

export function inviteEmail(opts: {
  companyName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
}): EmailContent {
  const { companyName, inviterName, inviteUrl, role } = opts;
  const safeCo = escapeHtml(companyName);
  const safeInviter = escapeHtml(inviterName);
  const safeRole = escapeHtml(role);

  return {
    subject: `${safeHeader(inviterName)} invited you to ${safeHeader(companyName)} on NISD2`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Join ${safeCo}</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          ${safeInviter} has invited you to join <strong>${safeCo}</strong> as <strong>${safeRole}</strong> on the NIS2 Compliance Platform.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
          Click the button below to accept and get started.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Accept Invite
        </a>
        <p style="color: ${BRAND.mutedForeground}; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
          This invite expires in 7 days. If you didn't expect this email, you can ignore it.
        </p>
    `),
    text: [
      `Join ${companyName}`,
      ``,
      `${inviterName} has invited you to join ${companyName} as ${role} on the NIS2 Compliance Platform.`,
      ``,
      `Accept the invite: ${inviteUrl}`,
      ``,
      `This invite expires in 7 days.`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Contact Email Changed
// ---------------------------------------------------------------------------

export function contactEmailChangedEmail(opts: {
  companyName: string;
  oldEmail: string;
  newEmail: string;
}): EmailContent {
  const { companyName, oldEmail, newEmail } = opts;
  const safeCo = escapeHtml(companyName);
  const safeOld = escapeHtml(oldEmail);
  const safeNew = escapeHtml(newEmail);

  return {
    subject: `The compliance contact for ${safeHeader(companyName)} was changed`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Contact Email Changed</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          The compliance contact email for <strong>${safeCo}</strong> has been changed.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Previous: <strong>${safeOld}</strong><br/>
          New: <strong>${safeNew}</strong>
        </p>
        <p style="color: ${BRAND.mutedForeground}; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
          If you did not make this change, please contact your team administrator.
        </p>
    `),
    text: [
      `Contact Email Changed`,
      ``,
      `The compliance contact email for ${companyName} has been changed.`,
      ``,
      `Previous: ${oldEmail}`,
      `New: ${newEmail}`,
      ``,
      `If you did not make this change, please contact your team administrator.`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Category Assigned
// ---------------------------------------------------------------------------

export function categoryAssignedEmail(opts: {
  assigneeName: string;
  categoryName: string;
  categoryCode: string;
  companyName: string;
  assignerName: string;
  categoryUrl: string;
  footer?: PreferenceFooter;
}): EmailContent {
  const { assigneeName, categoryName, categoryCode, companyName, assignerName, categoryUrl } = opts;
  const safeAssignee = escapeHtml(assigneeName);
  const safeCatName = escapeHtml(categoryName);
  const safeCatCode = escapeHtml(categoryCode);
  const safeCo = escapeHtml(companyName);
  const safeAssigner = escapeHtml(assignerName);

  return {
    subject: `${safeHeader(assignerName)} assigned you ${safeHeader(categoryName)}`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">New Assignment</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Hi ${safeAssignee}, ${safeAssigner} has assigned you to <strong>${safeCatName}</strong> (${safeCatCode}) in ${safeCo}.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
          You can now fill out the compliance requirements for this category.
        </p>
        <a href="${categoryUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Go to ${safeCatCode}
        </a>
    `, opts.footer),
    text: [
      `New Assignment`,
      ``,
      `Hi ${assigneeName}, ${assignerName} has assigned you to ${categoryName} (${categoryCode}) in ${companyName}.`,
      ``,
      `Go to category: ${categoryUrl}`,
      ...(opts.footer ? ["", preferenceFooterText(opts.footer)] : []),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Category Unassigned
// ---------------------------------------------------------------------------

export function categoryUnassignedEmail(opts: {
  assigneeName: string;
  categoryName: string;
  categoryCode: string;
  companyName: string;
  footer?: PreferenceFooter;
}): EmailContent {
  const { assigneeName, categoryName, categoryCode, companyName } = opts;
  const safeAssignee = escapeHtml(assigneeName);
  const safeCatName = escapeHtml(categoryName);
  const safeCatCode = escapeHtml(categoryCode);
  const safeCo = escapeHtml(companyName);

  return {
    subject: `You are no longer assigned to ${safeHeader(categoryName)}`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Assignment Removed</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Hi ${safeAssignee}, you have been unassigned from <strong>${safeCatName}</strong> (${safeCatCode}) in ${safeCo}.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0;">
          If you believe this was a mistake, please contact your team administrator.
        </p>
    `, opts.footer),
    text: [
      `Assignment Removed`,
      ``,
      `Hi ${assigneeName}, you have been unassigned from ${categoryName} (${categoryCode}) in ${companyName}.`,
      ``,
      `If you believe this was a mistake, please contact your team administrator.`,
      ...(opts.footer ? ["", preferenceFooterText(opts.footer)] : []),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Review Decision (Approved / Rejected)
// ---------------------------------------------------------------------------

export function reviewDecisionEmail(opts: {
  submitterName: string;
  requirementCode: string;
  requirementTitle: string;
  decision: "approved" | "rejected";
  feedback?: string | null;
  footer?: PreferenceFooter;
}): EmailContent {
  const { submitterName, requirementCode, requirementTitle, decision, feedback } = opts;
  const label = decision === "approved" ? "Approved" : "Rejected";
  const color = decision === "approved" ? SEVERITY.success : SEVERITY.destructive;
  const safeName = escapeHtml(submitterName);
  const safeCode = escapeHtml(requirementCode);
  const safeTitle = escapeHtml(requirementTitle);
  const safeFeedback = feedback ? escapeHtml(feedback) : null;

  return {
    subject: decision === "approved"
      ? `${safeHeader(requirementCode)} was approved`
      : `${safeHeader(requirementCode)} needs another look`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Submission ${label}</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Hi ${safeName}, your submission for <strong>${safeCode}</strong> (${safeTitle}) has been <span style="color: ${color}; font-weight: 600;">${decision}</span>.
        </p>
        ${safeFeedback ? `<p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 16px 0 0; padding: 12px; background: ${BRAND.muted}; border-radius: 6px;"><strong>Feedback:</strong> ${safeFeedback}</p>` : ""}
    `, opts.footer),
    text: [
      `Submission ${label}`,
      ``,
      `Hi ${submitterName}, your submission for ${requirementCode} (${requirementTitle}) has been ${decision}.`,
      feedback ? `\nFeedback: ${feedback}` : "",
      ...(opts.footer ? ["", preferenceFooterText(opts.footer)] : []),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Member Removed
// ---------------------------------------------------------------------------

export function memberRemovedEmail(opts: {
  companyName: string;
  memberName: string;
}): EmailContent {
  const { companyName, memberName } = opts;
  const safeCo = escapeHtml(companyName);
  const safeMember = escapeHtml(memberName);

  return {
    subject: `You no longer have access to ${safeHeader(companyName)}`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Removed from ${safeCo}</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Hi ${safeMember}, you have been removed from <strong>${safeCo}</strong> on the NIS2 Compliance Platform.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0;">
          If you believe this was a mistake, please contact your team administrator.
        </p>
    `),
    text: [
      `Removed from ${companyName}`,
      ``,
      `Hi ${memberName}, you have been removed from ${companyName} on the NIS2 Compliance Platform.`,
      ``,
      `If you believe this was a mistake, please contact your team administrator.`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Deadline Reminder
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Daily Digest
// ---------------------------------------------------------------------------

export interface DigestItem {
  requirementCode: string;
  requirementTitle: string;
  deadline: string;
  daysRemaining: number;
  urgency: "info" | "warning" | "urgent" | "critical";
  categoryUrl: string;
}

function digestItemRow(item: DigestItem): string {
  // Only the daily digest renders item tables, so the campaign is fixed here.
  return `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid ${BRAND.border};">
        <a href="${withUtm(item.categoryUrl, "daily_digest")}" style="color: ${BRAND.primary}; font-weight: 500; text-decoration: none;">${escapeHtml(item.requirementCode)}</a>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.foreground};">${escapeHtml(item.requirementTitle)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.foreground}; white-space: nowrap;">${escapeHtml(item.deadline)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.foreground}; text-align: right;">${item.daysRemaining}d</td>
    </tr>`;
}

function digestSection(title: string, accentColor: string, items: DigestItem[]): string {
  if (items.length === 0) return "";
  return `
    <div style="margin: 0 0 24px;">
      <h3 style="margin: 0 0 12px; color: ${accentColor}; font-size: 15px;">${escapeHtml(title)} (${items.length})</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: ${BRAND.muted};">
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid ${BRAND.border}; font-weight: 600; color: ${BRAND.foreground};">Code</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid ${BRAND.border}; font-weight: 600; color: ${BRAND.foreground};">Title</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid ${BRAND.border}; font-weight: 600; color: ${BRAND.foreground};">Deadline</th>
            <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid ${BRAND.border}; font-weight: 600; color: ${BRAND.foreground};">Days</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(digestItemRow).join("")}
        </tbody>
      </table>
    </div>`;
}

function digestItemText(item: DigestItem): string {
  return `  - ${item.requirementCode}: ${item.requirementTitle} (due ${item.deadline}, ${item.daysRemaining}d remaining)`;
}

/**
 * The reader's next open step on the journey, in the path view's order.
 * Every digest carries it so the mail always ends on a concrete action:
 * either "these reviews are overdue" or "this is next up" — never a bare
 * count with nothing to do about it. The progress numbers feed the payoff
 * line; assigneeName is for the management digest's "who owns it".
 */
export interface DigestNextStep {
  requirementCode: string;
  requirementTitle: string;
  url: string;
  /** Journey-wide progress: steps done of total. */
  done: number;
  total: number;
  categoryName: string;
  categoryDone: number;
  categoryTotal: number;
  /** First assigned owner of the step; null when nobody is assigned yet. */
  assigneeName: string | null;
}

type DigestCampaign = "daily_digest" | "weekly_management_digest";

/**
 * utm_* tags on digest links so Umami can attribute return visits to the
 * digest that caused them. The requirement deep links end in a #<code>
 * fragment, and the fragment must stay last, so the query is spliced in
 * before it.
 */
function withUtm(url: string, campaign: DigestCampaign): string {
  const [base, fragment] = url.split("#");
  const sep = base.includes("?") ? "&" : "?";
  const tagged = `${base}${sep}utm_source=email&utm_medium=digest&utm_campaign=${campaign}`;
  return fragment ? `${tagged}#${fragment}` : tagged;
}

/**
 * What completing the next step does to the numbers the reader already
 * owns. When it is the category's last open step, say so: "completes
 * Registration" pulls harder than another fraction.
 */
function payoffLine(nextStep: DigestNextStep): string {
  const categoryLeft = nextStep.categoryTotal - nextStep.categoryDone;
  const categoryPart =
    categoryLeft === 1
      ? `completes ${nextStep.categoryName}`
      : `moves ${nextStep.categoryName} to ${nextStep.categoryDone + 1} of ${nextStep.categoryTotal}`;
  return `You are at ${nextStep.done} of ${nextStep.total} steps. Finishing ${nextStep.requirementCode} makes it ${nextStep.done + 1} and ${categoryPart}.`;
}

function continueButtonHtml(nextStep: DigestNextStep, campaign: DigestCampaign): string {
  return `
    <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">${escapeHtml(payoffLine(nextStep))}</p>
    <a href="${withUtm(nextStep.url, campaign)}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
      Continue: ${escapeHtml(nextStep.requirementCode)} ${escapeHtml(nextStep.requirementTitle)}
    </a>`;
}

function dashboardButtonHtml(dashboardUrl: string, campaign: DigestCampaign, label: string): string {
  return `
    <a href="${withUtm(dashboardUrl, campaign)}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
      ${escapeHtml(label)}
    </a>`;
}

export function dailyDigestEmail(opts: {
  recipientName: string;
  companyName: string;
  overdueItems: DigestItem[];
  urgentItems: DigestItem[];
  upcomingItems: DigestItem[];
  nextStep: DigestNextStep | null;
  compliancePercentage: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}): EmailContent {
  const { recipientName, companyName, overdueItems, urgentItems, upcomingItems, nextStep, compliancePercentage, dashboardUrl, unsubscribeUrl } = opts;
  const safeRecipient = escapeHtml(recipientName);
  const safeCo = escapeHtml(companyName);
  const safePct = escapeHtml(compliancePercentage);

  return {
    // Lead with the thing worth opening the mail for. "Daily Compliance
    // Digest" told the reader only that a machine sent it on a schedule,
    // which is the definition of a mail you archive unread.
    subject: safeHeader(
      overdueItems.length > 0
        ? `${overdueItems.length} overdue at ${companyName}`
        : urgentItems.length > 0
          ? `${urgentItems.length} due this week at ${companyName}`
          : `${upcomingItems.length} deadlines coming up at ${companyName}`,
    ),
    html: emailLayout(`
        <h2 style="margin: 0 0 8px; color: ${BRAND.foreground};">Daily Compliance Digest</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 4px;">
          Hi ${safeRecipient}, here is your daily summary for <strong>${safeCo}</strong>.
        </p>
        <p style="margin: 0 0 24px;">
          <span style="font-size: 28px; font-weight: 700; color: ${BRAND.primary};">${safePct}%</span>
          <span style="color: ${BRAND.foreground}; font-size: 14px; margin-left: 8px;">overall compliance</span>
        </p>
        ${digestSection("Overdue", SEVERITY.destructive, overdueItems)}
        ${digestSection("Due This Week", SEVERITY.warning, urgentItems)}
        ${digestSection("Upcoming", BRAND.mutedForeground, upcomingItems)}
        ${
          nextStep
            ? `${continueButtonHtml(nextStep, "daily_digest")}
        <p style="font-size: 13px; margin: 12px 0 0;">
          <a href="${withUtm(dashboardUrl, "daily_digest")}" style="color: ${BRAND.mutedForeground};">or open the dashboard</a>
        </p>`
            : dashboardButtonHtml(dashboardUrl, "daily_digest", "View Dashboard")
        }
        <p style="color: ${BRAND.mutedForeground}; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
          You are receiving this digest because you are a member of ${safeCo}.
        </p>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 16px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe from digest emails</a>
        </p>
    `),
    text: [
      `Daily Compliance Digest: ${companyName}`,
      ``,
      `Hi ${recipientName}, here is your daily summary for ${companyName}.`,
      `Overall compliance: ${compliancePercentage}%`,
      ``,
      ...(overdueItems.length > 0
        ? [`Overdue (${overdueItems.length}):`, ...overdueItems.map(digestItemText), ``]
        : []),
      ...(urgentItems.length > 0
        ? [`Due This Week (${urgentItems.length}):`, ...urgentItems.map(digestItemText), ``]
        : []),
      ...(upcomingItems.length > 0
        ? [`Upcoming (${upcomingItems.length}):`, ...upcomingItems.map(digestItemText), ``]
        : []),
      ...(nextStep
        ? [
            payoffLine(nextStep),
            `Continue: ${nextStep.requirementCode} ${nextStep.requirementTitle}`,
            withUtm(nextStep.url, "daily_digest"),
            ``,
          ]
        : []),
      `View dashboard: ${withUtm(dashboardUrl, "daily_digest")}`,
      ``,
      `Unsubscribe from digest emails: ${unsubscribeUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Weekly Management Digest
// ---------------------------------------------------------------------------

export function weeklyManagementDigestEmail(opts: {
  recipientName: string;
  companyName: string;
  compliancePercentage: string;
  overdueCount: number;
  urgentCount: number;
  escalationCount: number;
  totalRequirements: number;
  completedRequirements: number;
  nextStep: DigestNextStep | null;
  dashboardUrl: string;
  unsubscribeUrl: string;
}): EmailContent {
  const {
    recipientName,
    companyName,
    compliancePercentage,
    overdueCount,
    urgentCount,
    escalationCount,
    totalRequirements,
    completedRequirements,
    nextStep,
    dashboardUrl,
    unsubscribeUrl,
  } = opts;

  const pct = Math.min(100, Math.max(0, parseFloat(compliancePercentage) || 0));
  const filledBlocks = Math.round(pct / 5);
  const emptyBlocks = 20 - filledBlocks;
  const progressBarText = `[${"#".repeat(filledBlocks)}${"-".repeat(emptyBlocks)}] ${compliancePercentage}%`;
  const safeRecipient = escapeHtml(recipientName);
  const safeCo = escapeHtml(companyName);
  const safePct = escapeHtml(compliancePercentage);

  return {
    subject: safeHeader(
      `${companyName} is at ${compliancePercentage}% on NIS 2 this week`,
    ),
    html: emailLayout(`
        <h2 style="margin: 0 0 8px; color: ${BRAND.foreground};">Weekly Management Report</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
          Hi ${safeRecipient}, here is the weekly compliance summary for <strong>${safeCo}</strong>.
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <span style="font-size: 36px; font-weight: 700; color: ${BRAND.primary};">${safePct}%</span>
          <div style="color: ${BRAND.foreground}; font-size: 14px; margin-top: 4px;">Compliance Score</div>
          <div style="background: ${BRAND.border}; border-radius: 4px; height: 8px; margin: 12px 0 0; overflow: hidden;">
            <div style="background: ${BRAND.primary}; height: 100%; width: ${pct}%; border-radius: 4px;"></div>
          </div>
          <div style="color: ${BRAND.foreground}; font-size: 13px; margin-top: 4px;">${completedRequirements} of ${totalRequirements} requirements completed</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 24px;">
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.foreground};">Overdue Items</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid ${BRAND.border}; font-weight: 600; text-align: right; color: ${overdueCount > 0 ? SEVERITY.destructive : SEVERITY.success};">${overdueCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.foreground};">Urgent Items</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid ${BRAND.border}; font-weight: 600; text-align: right; color: ${urgentCount > 0 ? SEVERITY.warning : SEVERITY.success};">${urgentCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid ${BRAND.border}; color: ${BRAND.foreground};">Escalations</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid ${BRAND.border}; font-weight: 600; text-align: right; color: ${escalationCount > 0 ? SEVERITY.destructive : SEVERITY.success};">${escalationCount}</td>
          </tr>
        </table>
        ${
          nextStep
            ? `<p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Next up: <a href="${withUtm(nextStep.url, "weekly_management_digest")}" style="color: ${BRAND.primary}; font-weight: 600; text-decoration: none;">${escapeHtml(nextStep.requirementCode)} ${escapeHtml(nextStep.requirementTitle)}</a> (${escapeHtml(nextStep.categoryName)}), ${nextStep.assigneeName ? `assigned to ${escapeHtml(nextStep.assigneeName)}` : "not yet assigned"}.
        </p>`
            : ""
        }
        ${
          completedRequirements < totalRequirements
            ? `<p style="color: ${BRAND.mutedForeground}; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
          Open items return in every weekly report until they are done. Completed items land in the audit trail as evidence.
        </p>`
            : ""
        }
        ${dashboardButtonHtml(
          dashboardUrl,
          "weekly_management_digest",
          completedRequirements < totalRequirements ? "Review the open items" : "View Dashboard",
        )}
        <div style="margin: 24px 0 0; padding: 16px; background: ${BRAND.muted}; border: 1px solid ${BRAND.border}; border-radius: 6px; font-size: 12px; color: ${BRAND.mutedForeground}; line-height: 1.5;">
          This email serves as documentation of management notification per Art. 20 NIS 2 / &sect;38 BSIG.<br/>
          Diese E-Mail dient als Nachweis der Leitungsunterrichtung gem&auml;&szlig; Art. 20 NIS 2 / &sect;38 BSIG.
        </div>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 16px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe from digest emails</a>
        </p>
    `),
    text: [
      `Weekly Management Report: ${companyName}`,
      ``,
      `Hi ${recipientName}, here is the weekly compliance summary for ${companyName}.`,
      ``,
      `Compliance Score: ${compliancePercentage}%`,
      progressBarText,
      `${completedRequirements} of ${totalRequirements} requirements completed`,
      ``,
      `Overdue Items: ${overdueCount}`,
      `Urgent Items: ${urgentCount}`,
      `Escalations: ${escalationCount}`,
      ``,
      ...(nextStep
        ? [
            `Next up: ${nextStep.requirementCode} ${nextStep.requirementTitle} (${nextStep.categoryName}), ${nextStep.assigneeName ? `assigned to ${nextStep.assigneeName}` : "not yet assigned"}.`,
            withUtm(nextStep.url, "weekly_management_digest"),
            ``,
          ]
        : []),
      ...(completedRequirements < totalRequirements
        ? [
            `Open items return in every weekly report until they are done. Completed items land in the audit trail as evidence.`,
            ``,
          ]
        : []),
      `View dashboard: ${withUtm(dashboardUrl, "weekly_management_digest")}`,
      ``,
      `---`,
      `This email serves as documentation of management notification per Art. 20 NIS 2 / §38 BSIG.`,
      `Diese E-Mail dient als Nachweis der Leitungsunterrichtung gemäß Art. 20 NIS 2 / §38 BSIG.`,
      ``,
      `Unsubscribe from digest emails: ${unsubscribeUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Supplier Portal: incident broadcast
// ---------------------------------------------------------------------------

export function supplierIncidentBroadcastEmail(opts: {
  supplierName: string;
  title: string;
  body: string;
  severity: string;
  publishedAt: Date;
  profileUrl: string;
  unsubscribeUrl: string;
}): EmailContent {
  const { supplierName, title, body, severity, publishedAt, profileUrl, unsubscribeUrl } = opts;
  const severityColor =
    severity === "critical" ? SEVERITY.destructive : severity === "warning" ? SEVERITY.warning : "#2563eb";
  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
  const safeSeverityLabel = escapeHtml(severityLabel);
  const safeName = escapeHtml(supplierName);
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);

  return {
    subject: `${safeHeader(supplierName)} reported a security incident: ${safeHeader(title)}`,
    html: emailLayout(`
        <div style="display: inline-block; background: ${severityColor}; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${safeSeverityLabel}</div>
        <h2 style="margin: 16px 0 8px; color: ${BRAND.foreground};">${safeTitle}</h2>
        <p style="color: ${BRAND.mutedForeground}; font-size: 13px; margin: 0 0 16px;">
          Security notification from <strong>${safeName}</strong> · ${publishedAt.toLocaleString()}
        </p>
        <div style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px; padding: 16px; background: ${BRAND.muted}; border-left: 3px solid ${severityColor}; border-radius: 4px; white-space: pre-wrap;">${safeBody}</div>
        <a href="${profileUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">View supplier profile</a>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 32px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          You received this because you subscribed to security updates from ${safeName} on nisd2.eu.
          Use this notification as evidence for your own NIS2 §30 supplier monitoring.
          <br/><br/>
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe</a>
        </p>
    `),
    text: [
      `[${severityLabel}] ${supplierName}: ${title}`,
      ``,
      `Security notification from ${supplierName} (${publishedAt.toISOString()})`,
      ``,
      body,
      ``,
      `View supplier profile: ${profileUrl}`,
      ``,
      `--`,
      `You received this because you subscribed to security updates from ${supplierName} on nisd2.eu.`,
      `Use as evidence for your NIS2 §30 supplier monitoring.`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Supplier Portal: added by supplier (you've been added as a customer)
// ---------------------------------------------------------------------------

/**
 * Direction-B invite email: sent when a NIS2 entity invites a supplier to
 * fill out their security profile via magic-link.
 */
export function entityInvitesSupplierEmail(opts: {
  entityName: string;
  inviteUrl: string;
  message: string | null;
}): EmailContent {
  const { entityName, inviteUrl, message } = opts;
  const safeName = escapeHtml(entityName);
  const safeMessage = message ? escapeHtml(message) : null;

  return {
    subject: `${safeHeader(entityName)} requests your NIS2 supplier profile on NISD2`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">You're invited to share your security profile</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">
          <strong>${safeName}</strong> is a NIS2-regulated entity. Under the EU NIS2 Directive
          (and its German transposition BSIG §30) they are required to assess the cybersecurity
          practices of their suppliers, including yours.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">
          Instead of sending you a 200-question PDF questionnaire, they are using nisd2.eu, where
          you can fill out a single unified questionnaire (anchored to ENISA's NIS2 Technical
          Implementation Guidance v1.0 and CIR 2024/2690) and share it with every customer who
          asks. Fill it once. Use it forever. Free.
        </p>
        ${safeMessage ? `<blockquote style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px; padding: 12px 16px; border-left: 3px solid ${BRAND.primary}; background: ${BRAND.muted}; font-style: italic;">${safeMessage}</blockquote>` : ""}
        <a href="${inviteUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Accept and create your free profile</a>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 32px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          This link is unique to you and expires in 30 days. You do not need to be a NIS2-regulated
          entity yourself to use the supplier portal. Most suppliers aren't.
        </p>
    `),
    text: [
      `${entityName} would like to see your security profile`,
      ``,
      `${entityName} is a NIS2-regulated entity required to assess their suppliers' cybersecurity practices.`,
      ``,
      `Instead of a 200-question PDF, they are using nisd2.eu: a single unified supplier questionnaire`,
      `anchored to ENISA's NIS2 Technical Implementation Guidance and CIR 2024/2690. Fill it once,`,
      `share it with every customer who asks. Free.`,
      ``,
      message ? `Their message:\n  ${message}\n` : "",
      `Accept and create your profile: ${inviteUrl}`,
      ``,
      `This link expires in 30 days. You do not need to be NIS2-regulated yourself to use the supplier portal.`,
    ].filter(Boolean).join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Platform Admin: new user signup notification
// ---------------------------------------------------------------------------

export function newUserSignupEmail(opts: {
  userEmail: string;
  userName: string;
  provider: string;
}): EmailContent {
  const { userEmail, userName, provider } = opts;
  const safeEmail = escapeHtml(userEmail);
  const safeName = escapeHtml(userName);
  const mailtoSubject = encodeURIComponent(`Welcome to NIS2: quick question`);
  const mailtoBody = encodeURIComponent(`Hi ${userName},\n\nI saw you just signed up on nisd2.eu. Welcome!\n\nI'd love to learn a bit about what you're looking for. Are you exploring NIS2 compliance for your company, or just researching the topic?\n\nHappy to help either way.\n\nBest,\n`);
  const mailtoUrl = escapeHtml(
    `mailto:${encodeURIComponent(userEmail)}?subject=${mailtoSubject}&body=${mailtoBody}`,
  );

  return {
    subject: `New signup: ${safeHeader(userEmail)}`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">New user signed up</h2>
        <table style="color: ${BRAND.foreground}; line-height: 1.8; font-size: 14px; margin: 0 0 24px;">
          <tr><td style="padding-right: 16px; font-weight: 600;">Email</td><td>${safeEmail}</td></tr>
          <tr><td style="padding-right: 16px; font-weight: 600;">Name</td><td>${safeName}</td></tr>
          <tr><td style="padding-right: 16px; font-weight: 600;">Provider</td><td>${escapeHtml(provider)}</td></tr>
          <tr><td style="padding-right: 16px; font-weight: 600;">Time</td><td>${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</td></tr>
        </table>
        <a href="${mailtoUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Reach out to ${safeEmail}
        </a>
    `),
    text: `New signup: ${userEmail} (${userName}) via ${provider}\n\nReply to them: ${userEmail}`,
  };
}

export function supplierAddedYouEmail(opts: {
  supplierName: string;
  profileUrl: string | null;
  unsubscribeUrl: string;
}): EmailContent {
  const { supplierName, profileUrl, unsubscribeUrl } = opts;
  const safeName = escapeHtml(supplierName);

  return {
    subject: `${safeHeader(supplierName)} will send you their security updates`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">You've been added as a security update recipient</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          <strong>${safeName}</strong> added your email address to their NIS2 supplier portal on nisd2.eu.
          You will receive security incident notifications and certification updates from them.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
          These notifications are useful evidence for your own NIS2 §30 supplier monitoring obligation.
          You can unsubscribe at any time.
        </p>
        ${profileUrl ? `<a href="${profileUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">View supplier profile</a>` : ""}
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 32px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe</a>
        </p>
    `),
    text: [
      `${supplierName} added you to their NIS2 supplier security updates`,
      ``,
      `${supplierName} added your email address to their NIS2 supplier portal on nisd2.eu.`,
      `You will receive security incident notifications and certification updates from them.`,
      ``,
      `Use as evidence for your NIS2 §30 supplier monitoring obligation.`,
      ``,
      profileUrl ? `View profile: ${profileUrl}` : "",
      ``,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].filter(Boolean).join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Course follow-up: sent by the daily course-reminder cron to users who
// started a course, haven't been back in 7+ days, and haven't been pinged
// in the last 30 days. Bundles all stalled courses for the user into one
// email. Personal voice from Simon, Mom-Test question on what got in the way.
// ---------------------------------------------------------------------------

export function courseFollowupEmail(opts: {
  recipientName: string | null;
  courses: Array<{ title: string; resumeUrl: string }>;
  unsubscribeUrl: string;
}): EmailContent {
  const { recipientName, courses, unsubscribeUrl } = opts;
  const single = courses.length === 1;
  const firstName = recipientName?.trim().split(" ")[0];
  const greeting = firstName ? `Hi ${escapeHtml(firstName)}` : "Hi";
  const subject = single
    ? `Following up on the ${courses[0].title} course`
    : "Following up on your NISD2 courses";

  const coursesHtml = courses
    .map(
      (c) =>
        `<li style="margin: 0 0 6px;"><a href="${c.resumeUrl}" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 500;">${escapeHtml(c.title)}</a></li>`,
    )
    .join("");

  const html = emailLayout(`
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">${greeting},</p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">
          Simon here, from NISD2. I noticed you started ${single ? "a course with us" : "some courses with us"} and haven't been back in a while:
        </p>
        <ul style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 20px; padding-left: 20px;">${coursesHtml}</ul>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 16px;">
          Quick question: what got in the way of finishing? Was something unclear, did the format not fit, or did NIS 2 turn out to be less relevant than you expected? Even a one-line reply helps me make the next version better.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          If you want to pick up where you left off, the link${single ? "" : "s"} above ${single ? "takes" : "take"} you straight back.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 24px 0 0;">
          Thanks,<br>Simon
        </p>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 32px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe from follow-up emails</a>
        </p>
  `);

  const text = [
    `${greeting},`,
    ``,
    `Simon here, from NISD2. I noticed you started ${single ? "a course with us" : "some courses with us"} and haven't been back in a while:`,
    ``,
    ...courses.map((c) => `- ${c.title}: ${c.resumeUrl}`),
    ``,
    `Quick question: what got in the way of finishing? Was something unclear, did the format not fit, or did NIS 2 turn out to be less relevant than you expected? Even a one-line reply helps me make the next version better.`,
    ``,
    `If you want to pick up where you left off, the link${single ? "" : "s"} above ${single ? "takes" : "take"} you straight back.`,
    ``,
    `Thanks,`,
    `Simon`,
    ``,
    `Unsubscribe from follow-up emails: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject: safeHeader(subject), html, text };
}

// ---------------------------------------------------------------------------
// Email Verification Code (signup OTP)
// ---------------------------------------------------------------------------

const VERIFICATION_COPY: Record<
  Locale,
  {
    subjectPrefix: string;
    heading: string;
    intro: string;
    expiryNote: string;
    ignoreNote: string;
  }
> = {
  de: {
    subjectPrefix: "NISD2 Bestätigungscode",
    heading: "E-Mail bestätigen",
    intro: "Bitte gib diesen Code in der Anmeldung ein, um deine E-Mail-Adresse zu bestätigen.",
    expiryNote: "Der Code ist 10 Minuten gültig.",
    ignoreNote: "Falls du dich nicht registriert hast, ignoriere diese E-Mail.",
  },
  en: {
    subjectPrefix: "NISD2 verification code",
    heading: "Verify your email",
    intro: "Enter this code in the sign-in screen to verify your email address.",
    expiryNote: "The code is valid for 10 minutes.",
    ignoreNote: "If you did not request this, just ignore this email.",
  },
  nl: {
    subjectPrefix: "NISD2 verificatiecode",
    heading: "E-mail verifiëren",
    intro: "Voer deze code in op het aanmeldscherm om je e-mailadres te verifiëren.",
    expiryNote: "De code is 10 minuten geldig.",
    ignoreNote: "Heb je dit niet aangevraagd? Negeer deze e-mail.",
  },
  fr: {
    subjectPrefix: "Code de vérification NISD2",
    heading: "Vérifiez votre e-mail",
    intro: "Saisissez ce code sur l'écran de connexion pour vérifier votre adresse e-mail.",
    expiryNote: "Le code est valable 10 minutes.",
    ignoreNote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
  },
  it: {
    subjectPrefix: "Codice di verifica NISD2",
    heading: "Verifica la tua e-mail",
    intro: "Inserisci questo codice nella schermata di accesso per verificare il tuo indirizzo e-mail.",
    expiryNote: "Il codice è valido per 10 minuti.",
    ignoreNote: "Se non hai richiesto questa operazione, ignora questa e-mail.",
  },
  es: {
    subjectPrefix: "Código de verificación de NISD2",
    heading: "Verifica tu correo electrónico",
    intro: "Introduce este código en la pantalla de inicio de sesión para verificar tu dirección de correo electrónico.",
    expiryNote: "El código es válido durante 10 minutos.",
    ignoreNote: "Si no has solicitado esto, ignora este correo electrónico.",
  },
  pl: {
    subjectPrefix: "Kod weryfikacyjny NISD2",
    heading: "Zweryfikuj swój adres e-mail",
    intro: "Wprowadź ten kod na ekranie logowania, aby zweryfikować swój adres e-mail.",
    expiryNote: "Kod jest ważny przez 10 minut.",
    ignoreNote: "Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość.",
  },
  cs: {
    subjectPrefix: "Ověřovací kód NISD2",
    heading: "Ověřte svůj e-mail",
    intro: "Zadejte tento kód na přihlašovací obrazovce a ověřte svou e-mailovou adresu.",
    expiryNote: "Kód je platný 10 minut.",
    ignoreNote: "Pokud jste o to nežádali, tento e-mail ignorujte.",
  },
  pt: {
    subjectPrefix: "Código de verificação NISD2",
    heading: "Verifique o seu e-mail",
    intro: "Introduza este código no ecrã de início de sessão para verificar o seu endereço de e-mail.",
    expiryNote: "O código é válido durante 10 minutos.",
    ignoreNote: "Se não solicitou isto, ignore este e-mail.",
  },
  ro: {
    subjectPrefix: "Cod de verificare NISD2",
    heading: "Verificați-vă adresa de e-mail",
    intro: "Introduceți acest cod în ecranul de autentificare pentru a vă verifica adresa de e-mail.",
    expiryNote: "Codul este valabil timp de 10 minute.",
    ignoreNote: "Dacă nu ați solicitat acest lucru, ignorați acest e-mail.",
  },
};

export function emailVerificationCodeEmail(opts: {
  code: string;
  locale?: Locale;
}): EmailContent {
  // 6-digit code from OTP service. Defense-in-depth: still escape it.
  const safeCode = escapeHtml(opts.code);
  const copy = VERIFICATION_COPY[opts.locale ?? "de"];

  const codeBlock = `
    <div style="margin: 24px 0; padding: 20px; background: ${BRAND.muted}; border: 1px solid ${BRAND.border}; border-radius: 8px; text-align: center;">
      <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: ${BRAND.foreground};">
        ${safeCode}
      </div>
    </div>`;

  return {
    subject: safeHeader(`${copy.subjectPrefix}: ${opts.code}`),
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">${copy.heading}</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">${copy.intro}</p>
        ${codeBlock}
        <p style="color: ${BRAND.mutedForeground}; font-size: 13px; margin: 16px 0 0; line-height: 1.5;">
          ${copy.expiryNote} ${copy.ignoreNote}
        </p>
    `),
    text: [
      copy.heading,
      ``,
      copy.intro,
      ``,
      opts.code,
      ``,
      `${copy.expiryNote} ${copy.ignoreNote}`,
    ].join("\n"),
  };
}

const PASSWORD_RESET_COPY: Record<
  Locale,
  {
    subjectPrefix: string;
    heading: string;
    intro: string;
    expiryNote: string;
    ignoreNote: string;
  }
> = {
  de: {
    subjectPrefix: "NISD2 Passwort zurücksetzen",
    heading: "Passwort zurücksetzen",
    intro: "Gib diesen Code zusammen mit deinem neuen Passwort ein, um dein Passwort zurückzusetzen.",
    expiryNote: "Der Code ist 10 Minuten gültig.",
    ignoreNote: "Falls du das nicht angefordert hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert.",
  },
  en: {
    subjectPrefix: "NISD2 password reset code",
    heading: "Reset your password",
    intro: "Enter this code together with your new password to complete the reset.",
    expiryNote: "The code is valid for 10 minutes.",
    ignoreNote: "If you did not request this, ignore this email. Your password is unchanged.",
  },
  nl: {
    subjectPrefix: "NISD2 wachtwoord resetcode",
    heading: "Wachtwoord opnieuw instellen",
    intro: "Voer deze code samen met je nieuwe wachtwoord in om het opnieuw instellen te voltooien.",
    expiryNote: "De code is 10 minuten geldig.",
    ignoreNote: "Heb je dit niet aangevraagd? Negeer deze e-mail. Je wachtwoord blijft ongewijzigd.",
  },
  fr: {
    subjectPrefix: "Code de réinitialisation du mot de passe NISD2",
    heading: "Réinitialisez votre mot de passe",
    intro: "Saisissez ce code avec votre nouveau mot de passe pour terminer la réinitialisation.",
    expiryNote: "Le code est valable 10 minutes.",
    ignoreNote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre mot de passe reste inchangé.",
  },
  it: {
    subjectPrefix: "Codice di reimpostazione della password NISD2",
    heading: "Reimposta la tua password",
    intro: "Inserisci questo codice insieme alla tua nuova password per completare la reimpostazione.",
    expiryNote: "Il codice è valido per 10 minuti.",
    ignoreNote: "Se non hai richiesto questa operazione, ignora questa e-mail. La tua password rimane invariata.",
  },
  es: {
    subjectPrefix: "Código de restablecimiento de contraseña de NISD2",
    heading: "Restablece tu contraseña",
    intro: "Introduce este código junto con tu nueva contraseña para completar el restablecimiento.",
    expiryNote: "El código es válido durante 10 minutos.",
    ignoreNote: "Si no has solicitado esto, ignora este correo electrónico. Tu contraseña no se ha modificado.",
  },
  pl: {
    subjectPrefix: "Kod resetowania hasła NISD2",
    heading: "Zresetuj swoje hasło",
    intro: "Wprowadź ten kod razem z nowym hasłem, aby zakończyć resetowanie.",
    expiryNote: "Kod jest ważny przez 10 minut.",
    ignoreNote: "Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość. Twoje hasło pozostaje bez zmian.",
  },
  cs: {
    subjectPrefix: "Kód pro obnovení hesla NISD2",
    heading: "Obnovte své heslo",
    intro: "Zadejte tento kód spolu s novým heslem a dokončete obnovení.",
    expiryNote: "Kód je platný 10 minut.",
    ignoreNote: "Pokud jste o to nežádali, tento e-mail ignorujte. Vaše heslo zůstává beze změny.",
  },
  pt: {
    subjectPrefix: "Código de redefinição de palavra-passe NISD2",
    heading: "Redefina a sua palavra-passe",
    intro: "Introduza este código juntamente com a sua nova palavra-passe para concluir a redefinição.",
    expiryNote: "O código é válido durante 10 minutos.",
    ignoreNote: "Se não solicitou isto, ignore este e-mail. A sua palavra-passe permanece inalterada.",
  },
  ro: {
    subjectPrefix: "Cod de resetare a parolei NISD2",
    heading: "Resetați-vă parola",
    intro: "Introduceți acest cod împreună cu noua parolă pentru a finaliza resetarea.",
    expiryNote: "Codul este valabil timp de 10 minute.",
    ignoreNote: "Dacă nu ați solicitat acest lucru, ignorați acest e-mail. Parola dumneavoastră rămâne neschimbată.",
  },
};

// ---------------------------------------------------------------------------
// Newsletter / lifecycle email
//
// Opportunistic bottom-of-funnel email sent to verified, opted-in users.
// Body is authored inline as markdown in the platform-admin composer and
// pre-rendered to HTML (renderNewsletterMarkdown) before being passed here.
// Footer carries the per-user one-click unsubscribe (HMAC-signed via
// lib/email/unsubscribe.ts) and a forward-to-a-friend mailto link.
// ---------------------------------------------------------------------------

export function newsletterEmail(opts: {
  subject: string;
  preheader?: string | null;
  /** Body markdown already rendered to HTML by renderNewsletterMarkdown(). */
  bodyHtml: string;
  /** Raw markdown body, used to build the plain-text alternative. */
  bodyText: string;
  unsubscribeUrl: string;
  forwardUrl: string;
  /** Optional soft CTA button (one per issue). Absolute URL + label. */
  cta?: { url: string; label: string } | null;
  /** Public permalink for the "view in browser" link. */
  viewInBrowserUrl?: string | null;
}): EmailContent {
  const { subject, preheader, bodyHtml, bodyText, unsubscribeUrl, forwardUrl, cta, viewInBrowserUrl } =
    opts;

  // Hidden preview text: shown by most clients next to the subject line,
  // not rendered in the body. Kept short so following content does not leak in.
  const preheaderBlock = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>`
    : "";

  const ctaBlock = cta
    ? `<div style="margin: 28px 0 0; text-align: center;">
          <a href="${cta.url}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">${escapeHtml(cta.label)}</a>
        </div>`
    : "";

  const viewInBrowserBlock = viewInBrowserUrl
    ? `<br/><br/><a href="${viewInBrowserUrl}" style="color: ${BRAND.mutedForeground};">View this issue in your browser.</a>`
    : "";

  // "Just reply" beats a mailto link here: the message is sent with
  // Reply-To set to a real mailbox, so hitting reply pre-fills the address
  // and keeps the thread, whereas a mailto opens an empty new message.
  return {
    subject: safeHeader(subject),
    html: emailLayout(`
        ${preheaderBlock}
        <div style="color: ${BRAND.foreground}; font-size: 15px; line-height: 1.65;">
${bodyHtml}
        </div>
        ${ctaBlock}
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 32px 0 0; line-height: 1.6; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          Questions or feedback? Just reply to this email, it comes straight to me.
          <br/><br/>
          Found this useful? <a href="${forwardUrl}" style="color: ${BRAND.primary};">Forward it to a colleague.</a>
          <br/><br/>
          You are receiving this because you have an account at nisd2.eu.
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe</a>.${viewInBrowserBlock}
        </p>
    `),
    text: [
      bodyText,
      ``,
      ...(cta ? [`${cta.label}: ${cta.url}`, ``] : []),
      `--`,
      `Questions or feedback? Just reply to this email, it comes straight to me.`,
      ``,
      `Found this useful? Forward it to a colleague.`,
      ``,
      `You are receiving this because you have an account at nisd2.eu.`,
      `Unsubscribe: ${unsubscribeUrl}`,
      ...(viewInBrowserUrl ? [`View in browser: ${viewInBrowserUrl}`] : []),
    ].join("\n"),
  };
}

export function passwordResetCodeEmail(opts: {
  code: string;
  locale?: Locale;
}): EmailContent {
  const safeCode = escapeHtml(opts.code);
  const copy = PASSWORD_RESET_COPY[opts.locale ?? "de"];

  const codeBlock = `
    <div style="margin: 24px 0; padding: 20px; background: ${BRAND.muted}; border: 1px solid ${BRAND.border}; border-radius: 8px; text-align: center;">
      <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: ${BRAND.foreground};">
        ${safeCode}
      </div>
    </div>`;

  return {
    subject: safeHeader(`${copy.subjectPrefix}: ${opts.code}`),
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">${copy.heading}</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">${copy.intro}</p>
        ${codeBlock}
        <p style="color: ${BRAND.mutedForeground}; font-size: 13px; margin: 16px 0 0; line-height: 1.5;">
          ${copy.expiryNote} ${copy.ignoreNote}
        </p>
    `),
    text: [
      copy.heading,
      ``,
      copy.intro,
      ``,
      opts.code,
      ``,
      `${copy.expiryNote} ${copy.ignoreNote}`,
    ].join("\n"),
  };
}
