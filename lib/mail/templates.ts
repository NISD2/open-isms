/**
 * Email templates — plain functions returning { subject, html, text }
 *
 * Usage:
 *   const email = inviteEmail({ ... });
 *   await sendMail({ to: "user@co.com", ...email });
 */

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Minimal HTML escape for user content interpolated into email HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strip CR/LF/NUL from user content destined for email headers (subject line).
 * Defense-in-depth against header injection — Resend sanitizes headers
 * server-side, but supplier-controlled content is cross-tenant and worth
 * locking down at the source.
 */
function safeHeader(s: string): string {
  return s.replace(/[\r\n\0]+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Brand tokens (mirror app/globals.css — email clients can't read CSS vars)
// ---------------------------------------------------------------------------

const BRAND = {
  primary: "#284b63",
  primaryForeground: "#ffffff",
  foreground: "#353535",
  mutedForeground: "#6b6b6b",
  border: "#d9d9d9",
  muted: "#f2f2f2",
  background: "#ffffff",
  pageBackground: "#fafafa",
  primaryMuted: "#cbd5e1",
} as const;

const SEVERITY = {
  destructive: "#ef4444",
  destructiveBgBorder: "#fecaca",
  warning: "#ea580c",
  warningBgBorder: "#fed7aa",
  success: "#16a34a",
} as const;

const BRAND_LOGO_URL = "https://nisd2.eu/nisd2-logo.png";
const BRAND_TAGLINE = "Halve Europe's NIS2 bill.";

function brandHeader(): string {
  return `
    <div style="background: ${BRAND.primary}; padding: 20px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle; padding-right: 12px;">
            <img src="${BRAND_LOGO_URL}" alt="NISD2" width="40" height="40" style="display: block; border-radius: 8px;" />
          </td>
          <td style="vertical-align: middle;">
            <div style="color: ${BRAND.primaryForeground}; font-size: 16px; font-weight: 700; letter-spacing: 0.05em; line-height: 1.2;">NISD2</div>
            <div style="color: ${BRAND.primaryMuted}; font-size: 12px; line-height: 1.4; margin-top: 2px;">${BRAND_TAGLINE}</div>
          </td>
        </tr>
      </table>
    </div>`;
}

function brandFooter(): string {
  return `
    <div style="border-top: 1px solid ${BRAND.border}; padding: 16px 32px; color: ${BRAND.mutedForeground}; font-size: 11px; line-height: 1.6;">
      <a href="https://nisd2.eu" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">nisd2.eu</a>
      &nbsp;·&nbsp; Open NIS2 compliance platform
    </div>`;
}

/**
 * Wrap an inner HTML body in the shared brand layout (header + footer +
 * card container). Inner content is rendered inside a 24px-padded white
 * panel below the header.
 */
function emailLayout(innerHtml: string): string {
  return `
    <div style="background: ${BRAND.pageBackground}; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: ${BRAND.background}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        ${brandHeader()}
        <div style="padding: 24px 32px;">
${innerHtml}
        </div>
        ${brandFooter()}
      </div>
    </div>`.trim();
}

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
    subject: `Join ${safeHeader(companyName)} on NISD2`,
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
    subject: `Compliance contact email changed for ${safeHeader(companyName)}`,
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
}): EmailContent {
  const { assigneeName, categoryName, categoryCode, companyName, assignerName, categoryUrl } = opts;
  const safeAssignee = escapeHtml(assigneeName);
  const safeCatName = escapeHtml(categoryName);
  const safeCatCode = escapeHtml(categoryCode);
  const safeCo = escapeHtml(companyName);
  const safeAssigner = escapeHtml(assignerName);

  return {
    subject: `You've been assigned to ${safeHeader(categoryName)} (${safeHeader(categoryCode)})`,
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
    `),
    text: [
      `New Assignment`,
      ``,
      `Hi ${assigneeName}, ${assignerName} has assigned you to ${categoryName} (${categoryCode}) in ${companyName}.`,
      ``,
      `Go to category: ${categoryUrl}`,
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
}): EmailContent {
  const { assigneeName, categoryName, categoryCode, companyName } = opts;
  const safeAssignee = escapeHtml(assigneeName);
  const safeCatName = escapeHtml(categoryName);
  const safeCatCode = escapeHtml(categoryCode);
  const safeCo = escapeHtml(companyName);

  return {
    subject: `You've been unassigned from ${safeHeader(categoryName)} (${safeHeader(categoryCode)})`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Assignment Removed</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Hi ${safeAssignee}, you have been unassigned from <strong>${safeCatName}</strong> (${safeCatCode}) in ${safeCo}.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0;">
          If you believe this was a mistake, please contact your team administrator.
        </p>
    `),
    text: [
      `Assignment Removed`,
      ``,
      `Hi ${assigneeName}, you have been unassigned from ${categoryName} (${categoryCode}) in ${companyName}.`,
      ``,
      `If you believe this was a mistake, please contact your team administrator.`,
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
}): EmailContent {
  const { submitterName, requirementCode, requirementTitle, decision, feedback } = opts;
  const label = decision === "approved" ? "Approved" : "Rejected";
  const color = decision === "approved" ? SEVERITY.success : SEVERITY.destructive;
  const safeName = escapeHtml(submitterName);
  const safeCode = escapeHtml(requirementCode);
  const safeTitle = escapeHtml(requirementTitle);
  const safeFeedback = feedback ? escapeHtml(feedback) : null;

  return {
    subject: `[NIS2] Requirement ${safeHeader(requirementCode)} ${label}`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Submission ${label}</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Hi ${safeName}, your submission for <strong>${safeCode}</strong> (${safeTitle}) has been <span style="color: ${color}; font-weight: 600;">${decision}</span>.
        </p>
        ${safeFeedback ? `<p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 16px 0 0; padding: 12px; background: ${BRAND.muted}; border-radius: 6px;"><strong>Feedback:</strong> ${safeFeedback}</p>` : ""}
    `),
    text: [
      `Submission ${label}`,
      ``,
      `Hi ${submitterName}, your submission for ${requirementCode} (${requirementTitle}) has been ${decision}.`,
      feedback ? `\nFeedback: ${feedback}` : "",
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
    subject: `You've been removed from ${safeHeader(companyName)}`,
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

export function deadlineReminderEmail(opts: {
  recipientName: string;
  requirementCode: string;
  requirementTitle: string;
  daysRemaining: number;
  deadline: string;
  categoryUrl: string;
}): EmailContent {
  const { recipientName, requirementCode, requirementTitle, daysRemaining, deadline, categoryUrl } = opts;
  const safeRecipient = escapeHtml(recipientName);
  const safeCode = escapeHtml(requirementCode);
  const safeTitle = escapeHtml(requirementTitle);
  const safeDeadline = escapeHtml(deadline);

  return {
    subject: `[NIS2] ${safeHeader(requirementCode)} is due for review in ${daysRemaining} days`,
    html: emailLayout(`
        <h2 style="margin: 0 0 16px; color: ${BRAND.foreground};">Upcoming Deadline</h2>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Hi ${safeRecipient}, this is a friendly reminder that <strong>${safeCode}</strong> (${safeTitle}) is coming up for review.
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
          Deadline: <strong>${safeDeadline}</strong> (${daysRemaining} days remaining)
        </p>
        <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
          Please review and complete this requirement before the deadline.
        </p>
        <a href="${categoryUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Go to Requirement
        </a>
    `),
    text: [
      `Upcoming Deadline`,
      ``,
      `Hi ${recipientName}, this is a friendly reminder that ${requirementCode} (${requirementTitle}) is coming up for review.`,
      ``,
      `Deadline: ${deadline} (${daysRemaining} days remaining)`,
      ``,
      `Please review and complete this requirement before the deadline.`,
      ``,
      `Go to requirement: ${categoryUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Deadline Urgent
// ---------------------------------------------------------------------------

export function deadlineUrgentEmail(opts: {
  recipientName: string;
  requirementCode: string;
  requirementTitle: string;
  daysRemaining: number;
  deadline: string;
  categoryUrl: string;
}): EmailContent {
  const { recipientName, requirementCode, requirementTitle, daysRemaining, deadline, categoryUrl } = opts;
  const dueLabel = daysRemaining <= 0 ? "today" : `in ${daysRemaining} day(s)`;
  const safeRecipient = escapeHtml(recipientName);
  const safeCode = escapeHtml(requirementCode);
  const safeTitle = escapeHtml(requirementTitle);
  const safeDeadline = escapeHtml(deadline);

  return {
    subject: `[NIS2] URGENT: ${safeHeader(requirementCode)} is due ${dueLabel}`,
    html: emailLayout(`
        <div style="background: ${SEVERITY.warning}; color: #fff; padding: 12px 16px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 14px;">
          URGENT — Immediate Action Required
        </div>
        <div style="border: 1px solid ${SEVERITY.warningBgBorder}; border-top: none; border-radius: 0 0 6px 6px; padding: 20px 16px;">
          <h2 style="margin: 0 0 16px; color: ${SEVERITY.warning};">Deadline Approaching</h2>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
            Hi ${safeRecipient}, <strong>${safeCode}</strong> (${safeTitle}) is due <strong>${dueLabel}</strong> and requires your immediate attention.
          </p>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
            Deadline: <strong>${safeDeadline}</strong>
          </p>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
            Please complete this requirement as soon as possible to maintain compliance.
          </p>
          <a href="${categoryUrl}" style="display: inline-block; background: ${SEVERITY.warning}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Take Action Now
          </a>
        </div>
    `),
    text: [
      `URGENT — Immediate Action Required`,
      ``,
      `Hi ${recipientName}, ${requirementCode} (${requirementTitle}) is due ${dueLabel} and requires your immediate attention.`,
      ``,
      `Deadline: ${deadline}`,
      ``,
      `Please complete this requirement as soon as possible to maintain compliance.`,
      ``,
      `Take action now: ${categoryUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Deadline Overdue
// ---------------------------------------------------------------------------

export function deadlineOverdueEmail(opts: {
  recipientName: string;
  requirementCode: string;
  requirementTitle: string;
  daysOverdue: number;
  deadline: string;
  categoryUrl: string;
}): EmailContent {
  const { recipientName, requirementCode, requirementTitle, daysOverdue, deadline, categoryUrl } = opts;
  const safeRecipient = escapeHtml(recipientName);
  const safeCode = escapeHtml(requirementCode);
  const safeTitle = escapeHtml(requirementTitle);
  const safeDeadline = escapeHtml(deadline);

  return {
    subject: `[NIS2] OVERDUE: ${safeHeader(requirementCode)} is ${daysOverdue} day(s) past deadline`,
    html: emailLayout(`
        <div style="background: ${SEVERITY.destructive}; color: #fff; padding: 12px 16px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 14px;">
          OVERDUE — Compliance at Risk
        </div>
        <div style="border: 1px solid ${SEVERITY.destructiveBgBorder}; border-top: none; border-radius: 0 0 6px 6px; padding: 20px 16px;">
          <h2 style="margin: 0 0 16px; color: ${SEVERITY.destructive};">Requirement Overdue</h2>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
            Hi ${safeRecipient}, <strong>${safeCode}</strong> (${safeTitle}) is now <strong style="color: ${SEVERITY.destructive};">${daysOverdue} day(s) past its deadline</strong>.
          </p>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
            Original deadline: <strong>${safeDeadline}</strong>
          </p>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
            This overdue item may affect your organization's compliance standing. Please address it immediately.
          </p>
          <a href="${categoryUrl}" style="display: inline-block; background: ${SEVERITY.destructive}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Resolve Now
          </a>
        </div>
    `),
    text: [
      `OVERDUE — Compliance at Risk`,
      ``,
      `Hi ${recipientName}, ${requirementCode} (${requirementTitle}) is now ${daysOverdue} day(s) past its deadline.`,
      ``,
      `Original deadline: ${deadline}`,
      ``,
      `This overdue item may affect your organization's compliance standing. Please address it immediately.`,
      ``,
      `Resolve now: ${categoryUrl}`,
    ].join("\n"),
  };
}

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
  return `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid ${BRAND.border};">
        <a href="${item.categoryUrl}" style="color: ${BRAND.primary}; font-weight: 500; text-decoration: none;">${escapeHtml(item.requirementCode)}</a>
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

export function dailyDigestEmail(opts: {
  recipientName: string;
  companyName: string;
  overdueItems: DigestItem[];
  urgentItems: DigestItem[];
  upcomingItems: DigestItem[];
  compliancePercentage: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}): EmailContent {
  const { recipientName, companyName, overdueItems, urgentItems, upcomingItems, compliancePercentage, dashboardUrl, unsubscribeUrl } = opts;
  const safeRecipient = escapeHtml(recipientName);
  const safeCo = escapeHtml(companyName);
  const safePct = escapeHtml(compliancePercentage);

  return {
    subject: `[NIS2] Daily Compliance Digest — ${safeHeader(companyName)}`,
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
        <a href="${dashboardUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          View Dashboard
        </a>
        <p style="color: ${BRAND.mutedForeground}; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
          You are receiving this digest because you are a member of ${safeCo}.
        </p>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 16px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe from digest emails</a>
        </p>
    `),
    text: [
      `Daily Compliance Digest — ${companyName}`,
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
      `View dashboard: ${dashboardUrl}`,
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
    subject: `[NIS2] Weekly Management Report — ${safeHeader(companyName)}`,
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
        <a href="${dashboardUrl}" style="display: inline-block; background: ${BRAND.primary}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          View Dashboard
        </a>
        <div style="margin: 24px 0 0; padding: 16px; background: ${BRAND.muted}; border: 1px solid ${BRAND.border}; border-radius: 6px; font-size: 12px; color: ${BRAND.mutedForeground}; line-height: 1.5;">
          This email serves as documentation of management notification per NIS2 Art. 38 / BSIG &sect;38.<br/>
          Diese E-Mail dient als Nachweis der Leitungsunterrichtung gem&auml;&szlig; NIS2 Art. 38 / BSIG &sect;38.
        </div>
        <p style="color: ${BRAND.mutedForeground}; font-size: 12px; margin: 16px 0 0; line-height: 1.5; border-top: 1px solid ${BRAND.border}; padding-top: 16px;">
          <a href="${unsubscribeUrl}" style="color: ${BRAND.mutedForeground};">Unsubscribe from digest emails</a>
        </p>
    `),
    text: [
      `Weekly Management Report — ${companyName}`,
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
      `View dashboard: ${dashboardUrl}`,
      ``,
      `---`,
      `This email serves as documentation of management notification per NIS2 Art. 38 / BSIG §38.`,
      `Diese E-Mail dient als Nachweis der Leitungsunterrichtung gemäß NIS2 Art. 38 / BSIG §38.`,
      ``,
      `Unsubscribe from digest emails: ${unsubscribeUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Escalation
// ---------------------------------------------------------------------------

export function escalationEmail(opts: {
  recipientName: string;
  requirementCode: string;
  requirementTitle: string;
  daysOverdue: number;
  assigneeName: string;
  escalationLevel: number;
  categoryUrl: string;
}): EmailContent {
  const { recipientName, requirementCode, requirementTitle, daysOverdue, assigneeName, escalationLevel, categoryUrl } = opts;
  const safeRecipient = escapeHtml(recipientName);
  const safeCode = escapeHtml(requirementCode);
  const safeTitle = escapeHtml(requirementTitle);
  const safeAssignee = escapeHtml(assigneeName);

  return {
    subject: `[NIS2] Escalation Level ${escalationLevel}: ${safeHeader(requirementCode)} is ${daysOverdue}d overdue`,
    html: emailLayout(`
        <div style="background: ${SEVERITY.destructive}; color: #fff; padding: 12px 16px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 14px;">
          Escalation Level ${escalationLevel}
        </div>
        <div style="border: 1px solid ${SEVERITY.destructiveBgBorder}; border-top: none; border-radius: 0 0 6px 6px; padding: 20px 16px;">
          <h2 style="margin: 0 0 16px; color: ${SEVERITY.destructive};">Requirement Escalated</h2>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 8px;">
            Hi ${safeRecipient}, <strong>${safeCode}</strong> (${safeTitle}) has been escalated to <strong>Level ${escalationLevel}</strong>.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 16px;">
            <tr>
              <td style="padding: 8px 0; color: ${BRAND.foreground}; border-bottom: 1px solid ${BRAND.border};">Days Overdue</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; color: ${SEVERITY.destructive}; border-bottom: 1px solid ${BRAND.border};">${daysOverdue}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${BRAND.foreground}; border-bottom: 1px solid ${BRAND.border};">Originally Assigned To</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; color: ${BRAND.foreground}; border-bottom: 1px solid ${BRAND.border};">${safeAssignee}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${BRAND.foreground}; border-bottom: 1px solid ${BRAND.border};">Escalation Level</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right; color: ${SEVERITY.destructive}; border-bottom: 1px solid ${BRAND.border};">${escalationLevel}</td>
            </tr>
          </table>
          <p style="color: ${BRAND.foreground}; line-height: 1.6; margin: 0 0 24px;">
            This requirement requires your immediate attention. Please review and take appropriate action.
          </p>
          <a href="${categoryUrl}" style="display: inline-block; background: ${SEVERITY.destructive}; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            View Requirement
          </a>
        </div>
    `),
    text: [
      `Escalation Level ${escalationLevel}: ${requirementCode}`,
      ``,
      `Hi ${recipientName}, ${requirementCode} (${requirementTitle}) has been escalated to Level ${escalationLevel}.`,
      ``,
      `Days Overdue: ${daysOverdue}`,
      `Originally Assigned To: ${assigneeName}`,
      `Escalation Level: ${escalationLevel}`,
      ``,
      `This requirement requires your immediate attention. Please review and take appropriate action.`,
      ``,
      `View requirement: ${categoryUrl}`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Supplier Portal — incident broadcast
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
    subject: `[${safeHeader(severityLabel)}] ${safeHeader(supplierName)}: ${safeHeader(title)}`,
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
// Supplier Portal — added by supplier (you've been added as a customer)
// ---------------------------------------------------------------------------

/**
 * Direction-B invite email — sent when a NIS2 entity invites a supplier to
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
          practices of their suppliers — including yours.
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
      `Instead of a 200-question PDF, they are using nisd2.eu — a single unified supplier questionnaire`,
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
// Platform Admin — new user signup notification
// ---------------------------------------------------------------------------

export function newUserSignupEmail(opts: {
  userEmail: string;
  userName: string;
  provider: string;
}): EmailContent {
  const { userEmail, userName, provider } = opts;
  const safeEmail = escapeHtml(userEmail);
  const safeName = escapeHtml(userName);
  const mailtoSubject = encodeURIComponent(`Welcome to NIS2 — quick question`);
  const mailtoBody = encodeURIComponent(`Hi ${userName},\n\nI saw you just signed up on nisd2.eu. Welcome!\n\nI'd love to learn a bit about what you're looking for — are you exploring NIS2 compliance for your company, or just researching the topic?\n\nHappy to help either way.\n\nBest,\n`);
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
    subject: `${safeHeader(supplierName)} added you to their NIS2 supplier security updates`,
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
// Course follow-up — sent by the daily course-reminder cron to users who
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
  "de" | "en" | "nl",
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
};

export function emailVerificationCodeEmail(opts: {
  code: string;
  locale?: "de" | "en" | "nl";
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
  "de" | "en" | "nl",
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
};

export function passwordResetCodeEmail(opts: {
  code: string;
  locale?: "de" | "en" | "nl";
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
