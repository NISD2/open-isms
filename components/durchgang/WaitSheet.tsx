"use client";

import {
  CircleHelp,
  Clock,
  type LucideIcon,
  Mail,
  MessagesSquare,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { WAIT_REASONS, type WaitReason } from "@/lib/durchgang";

const isWaitReason = (value: string): value is WaitReason =>
  (WAIT_REASONS as readonly string[]).includes(value);

/** Each reason's sign, so the four read apart before their words do. */
const REASON_ICON: Readonly<Record<WaitReason, LucideIcon>> = {
  letter: Mail,
  ask: MessagesSquare,
  decide: Users,
  unclear: CircleHelp,
};

/** The shortest reason that can stand as a record of a decision. The router checks it too. */
const MIN_DECLINE_REASON = 20;

type Mode = "wait" | "decline";

/**
 * What to do with an item that cannot be filled in now. Either it waits, with a reason and an
 * optional note, or the company decided not to do it, with the reason written down for the
 * Geschäftsführung to sign. Where the law leaves no choice (`mayDecline` false), only waiting.
 */
export function WaitSheet({
  open,
  onOpenChange,
  mayDecline,
  onWait,
  onDecline,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mayDecline: boolean;
  onWait: (reason: WaitReason, note: string) => void;
  onDecline: (reason: string) => void;
}) {
  const t = useTranslations("durchgang");
  const [mode, setMode] = useState<Mode>("wait");
  const [reason, setReason] = useState<WaitReason>("letter");
  const [note, setNote] = useState("");
  const [why, setWhy] = useState("");
  const whyReady = why.trim().length >= MIN_DECLINE_REASON;
  const shown: Mode = mayDecline ? mode : "wait";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* A light shade behind it (transitions.css), so the screen set aside stays readable. */}
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" data-shade="light">
        <SheetHeader className="gap-2 px-5 pt-8">
          {/* The waiting list's own mark on the walk home: where the item goes. */}
          <span className="mb-2 flex size-11 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Clock className="size-5" />
          </span>
          <SheetTitle className="text-xl tracking-tight">
            {shown === "wait" ? t("ui.wait.title") : t("ui.decline.title")}
          </SheetTitle>
          <SheetDescription className="leading-6">
            {shown === "wait" ? t("ui.wait.description") : t("ui.decline.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5">
          {mayDecline && (
            <RadioGroup
              aria-label={t("ui.wait.title")}
              value={mode}
              onValueChange={(value) =>
                (value === "wait" || value === "decline") && setMode(value)
              }
              className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
            >
              {(["wait", "decline"] as const).map((m) => (
                <Label
                  key={m}
                  htmlFor={`mode-${m}`}
                  className="flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-medium text-muted-foreground transition-colors has-[[data-state=checked]]:bg-background has-[[data-state=checked]]:text-foreground has-[[data-state=checked]]:shadow-sm"
                >
                  <RadioGroupItem id={`mode-${m}`} value={m} className="sr-only" />
                  {m === "wait" ? t("ui.notYet") : t("ui.decline.tab")}
                </Label>
              ))}
            </RadioGroup>
          )}

          {shown === "wait" ? (
            <>
              <RadioGroup
                value={reason}
                onValueChange={(value) => isWaitReason(value) && setReason(value)}
              >
                {WAIT_REASONS.map((key) => {
                  const Icon = REASON_ICON[key];
                  return (
                    <Label
                      key={key}
                      htmlFor={`wait-${key}`}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border p-3 leading-snug font-normal transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.04]"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-has-[[data-state=checked]]:bg-primary/10 group-has-[[data-state=checked]]:text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex-1">{t(`waitReasons.${key}`)}</span>
                      <RadioGroupItem id={`wait-${key}`} value={key} />
                    </Label>
                  );
                })}
              </RadioGroup>
              {reason === "unclear" && (
                <p className="rounded-xl bg-muted p-3.5 text-sm">
                  {t("ui.wait.unclear")}{" "}
                  <Link
                    href="/hilfe"
                    className="font-medium text-primary hover:underline"
                  >
                    {t("ui.wait.ask")}
                  </Link>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="wait-note">{t("ui.wait.noteLabel")}</Label>
                <Textarea
                  id="wait-note"
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("ui.wait.notePlaceholder")}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="decline-reason">{t("ui.decline.label")}</Label>
              <Textarea
                id="decline-reason"
                value={why}
                rows={6}
                maxLength={2000}
                onChange={(e) => setWhy(e.target.value)}
                placeholder={t("ui.decline.placeholder")}
              />
              <p className="text-xs text-muted-foreground">{t("ui.decline.hint")}</p>
            </div>
          )}
        </div>
        <SheetFooter className="px-5 pb-6">
          {shown === "wait" ? (
            <Button size="lg" className="rounded-xl" onClick={() => onWait(reason, note)}>
              <Clock />
              {t("ui.wait.confirm")}
            </Button>
          ) : (
            <Button
              size="lg"
              className="rounded-xl"
              disabled={!whyReady}
              onClick={() => onDecline(why)}
            >
              {t("ui.decline.confirm")}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
