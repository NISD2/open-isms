"use client";

import { ArrowRightLeft } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { trpcErrorCode, userFacingError } from "@/lib/trpc/error-message";

export interface OwnershipState {
  ownerId: string | null;
  pending: {
    id: string;
    fromUserId: string | null;
    toUserId: string | null;
    fromName: string | null;
    toName: string | null;
    expiresAt: Date;
  } | null;
}

interface Person {
  id: string;
  name: string;
  email: string;
}

/**
 * Who owns the organization, and handing it over. The owner asks for a member with a code from
 * their mailbox, the member accepts here, and either can call it off until then. Shown to admins,
 * and to the member a handover is waiting for.
 */
export function OwnershipCard({
  state,
  members,
  currentUserId,
}: {
  state: OwnershipState;
  members: Person[];
  currentUserId: string;
}) {
  const t = useTranslations("team.ownership");
  const tc = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { ownerId, pending } = state;
  const isOwner = ownerId === currentUserId;
  const owner = members.find((m) => m.id === ownerId);
  const others = members.filter((m) => m.id !== currentUserId);
  const until = pending ? format.dateTime(pending.expiresAt, { dateStyle: "long" }) : "";

  const done = (message: string) => () => {
    toast.success(message);
    router.refresh();
  };
  // Every refusal here means the handover moved on meanwhile (lapsed, withdrawn, already taken).
  const failed = (err: Parameters<typeof userFacingError>[0]) =>
    toast.error(trpcErrorCode(err) ? t("noLongerOpen") : tc("actionFailed"));
  const accept = trpc.ownership.accept.useMutation({
    onSuccess: done(t("accepted")),
    onError: failed,
  });
  const cancel = trpc.ownership.cancel.useMutation({ onError: failed });

  if (pending && pending.toUserId === currentUserId) {
    const from = pending.fromName ?? t("formerOwner");
    return (
      <Card className="border-primary/30" data-testid="ownership-offer">
        <CardHeader>
          <CardTitle className="text-balance">{t("offerTitle", { from })}</CardTitle>
          <CardDescription>{t("offerBody", { from, date: until })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-prose text-sm text-muted-foreground">{t("meaning")}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="h-11 sm:h-9"
              disabled={cancel.isPending || accept.isPending}
              onClick={() =>
                cancel.mutate(
                  { transferId: pending.id },
                  { onSuccess: done(t("declined")) },
                )
              }
            >
              {t("decline")}
            </Button>
            <Button
              className="h-11 sm:h-9"
              disabled={accept.isPending}
              onClick={() => accept.mutate({ transferId: pending.id })}
            >
              {t("accept")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ownership">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {isOwner
            ? t("youOwn")
            : owner
              ? t("ownedBy", { name: owner.name })
              : t("noOwner")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-prose text-sm text-muted-foreground">{t("meaning")}</p>
        {pending ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
            <p className="text-sm">
              {isOwner
                ? t("pendingOwner", { name: pending.toName ?? "", date: until })
                : t("pendingOther", {
                    from: pending.fromName ?? t("formerOwner"),
                    to: pending.toName ?? "",
                    date: until,
                  })}
            </p>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                disabled={cancel.isPending}
                onClick={() =>
                  cancel.mutate(
                    { transferId: pending.id },
                    { onSuccess: done(t("withdrawn")) },
                  )
                }
              >
                {t("withdraw")}
              </Button>
            )}
          </div>
        ) : isOwner ? (
          others.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("inviteFirst")}</p>
          ) : (
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <ArrowRightLeft />
              {t("handOver")}
            </Button>
          )
        ) : null}
      </CardContent>
      {isOwner && owner && (
        <HandOverDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          ownerEmail={owner.email}
          candidates={others}
          onRequested={(name) => {
            setDialogOpen(false);
            done(t("dialog.requested", { name }))();
          }}
        />
      )}
    </Card>
  );
}

/** Pick the member, get a code by email, type it: one request, confirmed by the owner's mailbox. */
function HandOverDialog({
  open,
  onOpenChange,
  ownerEmail,
  candidates,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerEmail: string;
  candidates: Person[];
  onRequested: (name: string) => void;
}) {
  const t = useTranslations("team.ownership.dialog");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [toUserId, setToUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const requestCode = trpc.ownership.requestCode.useMutation({
    onSuccess: () => {
      setCodeSent(true);
      setProblem(null);
    },
    onError: (err) =>
      setProblem(
        trpcErrorCode(err) === "TOO_MANY_REQUESTS"
          ? t("tooMany")
          : userFacingError(err, tc("actionFailed")),
      ),
  });
  const start = trpc.ownership.start.useMutation({
    onSuccess: () => onRequested(candidates.find((c) => c.id === toUserId)?.name ?? ""),
    onError: (err) => {
      const code = trpcErrorCode(err);
      setProblem(
        code === "BAD_REQUEST"
          ? t("codeWrong")
          : code === "CONFLICT"
            ? t("alreadyOpen")
            : userFacingError(err, tc("actionFailed")),
      );
    },
  });

  // The forward button stays enabled; an incomplete try says what is missing.
  const submit = () => {
    if (!toUserId) return setProblem(t("pickFirst"));
    if (!codeSent) return requestCode.mutate({ locale });
    if (!/^\d{6}$/.test(otp)) return setProblem(t("codeMissing"));
    start.mutate({ toUserId, otp });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setOtp("");
          setCodeSent(false);
          setProblem(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="ownership-to">{t("member")}</Label>
            <Select
              value={toUserId}
              onValueChange={(id) => {
                setToUserId(id);
                setProblem(null);
              }}
            >
              <SelectTrigger id="ownership-to" className="w-full">
                <SelectValue placeholder={t("memberPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} <span className="text-muted-foreground">{c.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {codeSent ? (
            <div className="space-y-1.5">
              <Label htmlFor="ownership-code">{t("code")}</Label>
              <Input
                id="ownership-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setProblem(null);
                }}
                className="text-center font-mono text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                {t("codeSentTo", { email: ownerEmail })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("whyCode", { email: ownerEmail })}
            </p>
          )}

          {problem && (
            <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
              {problem}
            </p>
          )}

          <DialogFooter className="items-center gap-2 sm:justify-between">
            {codeSent ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={requestCode.isPending}
                onClick={() => requestCode.mutate({ locale })}
              >
                {t("resend")}
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="submit"
              className="h-11 sm:h-9"
              disabled={requestCode.isPending || start.isPending}
            >
              {codeSent ? t("submit") : t("sendCode")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
