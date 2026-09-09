"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface InlineInviteProps {
  /** Called after a successful invite (e.g. to close a popover) */
  onInvited?: (email: string) => void;
  placeholder?: string;
  compact?: boolean;
  /** Where the invited user should land after accepting (e.g. /compliance/governance) */
  redirectPath?: string;
  /** When inviting from assignment popover, auto-assign on accept */
  assignmentContext?: {
    assessmentId: string;
    categoryId: string;
    requirementId?: string;
  };
}

/**
 * Reusable inline invite form — email input + send button.
 * Shows a copyable invite link on success.
 */
export function InlineInvite({
  onInvited,
  placeholder = "colleague@company.com",
  compact = false,
  redirectPath,
  assignmentContext,
}: InlineInviteProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const router = useRouter();
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
        toast.success(t("inline.sent", { email: invited }));
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
    invite.mutate({ email: email.trim(), redirectPath, assignmentContext });
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
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={compact ? "h-8 text-sm" : undefined}
        />
        <Button
          type="submit"
          size={compact ? "sm" : "default"}
          disabled={invite.isPending}
        >
          {invite.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>

      {inviteUrl && (
        <div className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1.5">
          <code className="flex-1 truncate text-xs">{inviteUrl}</code>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopy}>
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
