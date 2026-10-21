import { SupplierInviteEmail } from "./emails/supplier-mails";
import type { EmailContent } from "./layout";
import { renderEmail } from "./render";
import { companyNameForMail } from "./sender-name";

/**
 * Direction-B invite email: sent when a NIS2 entity invites a supplier to
 * fill out their security profile via magic-link.
 */
export async function entityInvitesSupplierEmail(opts: {
  entityName: string | null;
  inviteUrl: string;
  /** The inviting person's own address, shown so the reader knows who sent this and can ask them. */
  senderEmail: string;
  /** Whether the invite carries a personal message; its text is read on the invite page. */
  hasMessage: boolean;
}): Promise<EmailContent> {
  const { inviteUrl, senderEmail, hasMessage } = opts;
  const name = companyNameForMail(opts.entityName, "A NIS2 entity");

  return {
    subject: `${name} requests your NIS2 supplier profile on NISD2`,
    html: await renderEmail(SupplierInviteEmail, {
      name,
      inviteUrl,
      senderEmail,
      hasMessage,
    }),
    text: [
      `${name} would like to see your security profile`,
      ``,
      `${senderEmail} at ${name} invited you to this and entered your address.`,
      ``,
      `${name} is a NIS2-regulated entity required to assess their suppliers' cybersecurity practices.`,
      ``,
      `Instead of a 200-question PDF, they are using nisd2.eu: a single unified supplier questionnaire`,
      `anchored to ENISA's NIS2 Technical Implementation Guidance and CIR 2024/2690. Fill it once,`,
      `share it with every customer who asks. Free.`,
      ``,
      hasMessage
        ? `${name} added a personal message, which you can read on the invitation page after signing in.\n`
        : "",
      `Accept and create your profile: ${inviteUrl}`,
      ``,
      `This link expires in 30 days. You do not need to be NIS2-regulated yourself to use the supplier portal.`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
