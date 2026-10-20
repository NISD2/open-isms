"use client";

import { Check, Copy, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import type { RoleKey } from "@/lib/compliance/role-keys";
import { trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";

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
 * The one invite form: email input + send button. Shows a copyable invite link on success, the
 * only way the person hears of it on an instance without mail.
 */
export function InlineInvite({
  onInvited,
  placeholder = "colleague@company.com",
  compact = false,
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
  const id = useId();
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const invite = trpc.team.invite.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      const invited = email.trim();
      setEmail("");
      router.refresh();
      // The invite is real either way; only the delivery differs. On an
      // instance with no mail transport the link below is the only way the
      // person hears about it, so say that instead of claiming a send.
      if (data.emailed) {
        toast.success(sentText?.(invited) ?? t("inline.sent", { email: invited }));
      } else {
        toast.warning(t("inline.notEmailed", { email: invited }));
      }
      onInvited?.(invited);
    },
    onError: (err) => toast.error(userFacingError(err, tc("actionFailed"))),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteUrl(null);
    invite.mutate({
      email: email.trim(),
      redirectPath,
      complianceRole,
      assignmentContext,
    });
  }

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success(t("inline.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <form onSubmit={handleSubmit} className="flex max-w-md gap-1.5">
        <Input
          id={id}
          type="email"
          placeholder={placeholder}
          aria-label={label ? undefined : placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          // The input's own size: 16 px on a phone, so iOS Safari does not zoom in, 14 px from md.
          className={compact ? "h-8" : undefined}
        />
        <Button
          type="submit"
          size={compact ? "sm" : "default"}
          disabled={invite.isPending}
          aria-label={sendLabel ? undefined : t("inline.send")}
        >
          {invite.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {sendLabel}
        </Button>
      </form>

      {inviteUrl && (
        <div className="flex max-w-md items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1.5">
          <code className="flex-1 truncate text-xs">{inviteUrl}</code>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={t("inline.copyLink")}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
