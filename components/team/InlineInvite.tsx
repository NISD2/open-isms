"use client";

import { useTranslations } from "next-intl";
import { InviteField } from "@/components/shared/InviteField";
import { useRouter } from "@/i18n/navigation";
import type { RoleKey } from "@/lib/compliance/role-keys";
import { trpc } from "@/lib/trpc/client";

interface InlineInviteProps {
  /** Called after a successful invite (e.g. to close a popover) */
  onInvited?: (email: string) => void;
  placeholder?: string;
  compact?: boolean;
  /** A visible label above the field; without one the field is named by its placeholder. */
  label?: string;
  /** The send button's words; without them it is an icon, named for screen readers. */
  sendLabel?: string;
  /** What a sent invite says, where it can say more, such as where the person lands. */
  sentText?: (email: string) => string;
  /** Where the invited user should land after accepting (e.g. /compliance/governance) */
  redirectPath?: string;
  /** The role the invited person holds from the start, such as management for an approval. */
  complianceRole?: RoleKey;
  /** When inviting from assignment popover, auto-assign on accept */
  assignmentContext?: {
    assessmentId: string;
    categoryId: string;
    requirementId?: string;
  };
}

/**
 * The team invite form: the shared email form (components/shared/InviteField.tsx) sending an
 * invite to join the company. Shows a copyable invite link on success, the only way the person
 * hears of it on an instance without mail.
 */
export function InlineInvite({
  onInvited,
  placeholder,
  compact,
  label,
  sendLabel,
  sentText,
  redirectPath,
  complianceRole,
  assignmentContext,
}: InlineInviteProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const router = useRouter();
  const invite = trpc.team.invite.useMutation();

  return (
    <InviteField
      send={async (email) => {
        const data = await invite.mutateAsync({
          email,
          redirectPath,
          complianceRole,
          assignmentContext,
        });
        router.refresh();
        return { emailed: data.emailed, link: data.inviteUrl };
      }}
      onSent={onInvited}
      text={{
        send: t("inline.send"),
        sent: (email) => t("inline.sent", { email }),
        notEmailed: (email) => t("inline.notEmailed", { email }),
        failed: tc("actionFailed"),
        copyLink: t("inline.copyLink"),
        linkCopied: t("inline.linkCopied"),
      }}
      placeholder={placeholder}
      compact={compact}
      label={label}
      sendLabel={sendLabel}
      sentText={sentText}
    />
  );
}
