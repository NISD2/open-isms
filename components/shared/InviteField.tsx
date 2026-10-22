"use client";

/**
 * The one form for sending someone a link by email: an email field and a send button, a toast for
 * what happened, and the link to copy where the sender gets it back. It sends nothing itself:
 * `send` does, so the same form serves a team invite, a course invite and a supplier's customer
 * contact (components/team/InlineInvite.tsx, components/supplier-portal/CustomerContactsCard.tsx).
 */
import { Check, Copy, Loader2, Send } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userFacingError } from "@/lib/trpc/error-message";

/** What the sender did: whether a mail went out, and the link to copy if they get one back. */
export type SendOutcome = {
  readonly emailed: boolean;
  readonly link?: string;
};

/** The words around the form, already in the reader's language. */
export type InviteFieldText = {
  /** Names the send button for screen readers when it has no visible label. */
  readonly send: string;
  readonly sent: (email: string) => string;
  /** The person was recorded but no mail went out, so the sender must pass the link on. */
  readonly notEmailed: (email: string) => string;
  readonly failed: string;
  /** Only for a send that hands the link back (a team invite); without them no link is shown. */
  readonly copyLink?: string;
  readonly linkCopied?: string;
};

export function InviteField({
  send,
  onSent,
  text,
  placeholder = "colleague@company.com",
  compact = false,
  label,
  sendLabel,
  sentText,
}: {
  /** Sends to one address and says what happened; throws when it could not. */
  readonly send: (email: string) => Promise<SendOutcome>;
  /** Called after a successful send, e.g. to close a popover. */
  readonly onSent?: (email: string) => void;
  readonly text: InviteFieldText;
  readonly placeholder?: string;
  readonly compact?: boolean;
  /** A visible label above the field; without one the field is named by its placeholder. */
  readonly label?: string;
  /** The send button's words; without them it is an icon, named by `text.send`. */
  readonly sendLabel?: string;
  /** What a sent invite says, where it can say more than `text.sent`. */
  readonly sentText?: (email: string) => string;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setLink(null);
    setPending(true);
    try {
      const outcome = await send(address);
      setLink(outcome.link ?? null);
      setEmail("");
      // The send is real either way; only the delivery differs. Where there is no mail transport
      // the link is the only way the person hears of it, so say that instead of claiming a send.
      if (outcome.emailed) {
        toast.success((sentText ?? text.sent)(address));
      } else {
        toast.warning(text.notEmailed(address));
      }
      onSent?.(address);
    } catch (err) {
      toast.error(userFacingError(err, text.failed));
    } finally {
      setPending(false);
    }
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    if (text.linkCopied) toast.success(text.linkCopied);
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
          disabled={pending}
          aria-label={sendLabel ? undefined : text.send}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {sendLabel}
        </Button>
      </form>

      {link && text.copyLink && (
        <div className="flex max-w-md items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1.5">
          <code className="flex-1 truncate text-xs">{link}</code>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={text.copyLink}
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
