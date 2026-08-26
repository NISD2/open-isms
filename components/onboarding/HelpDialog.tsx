"use client";

import { CalendarDays, Mail, MessageSquare, Server, Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CONTACT_EMAIL = "contact@nisd2.eu";

function HelpRow({
  icon: Icon,
  children,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

/**
 * The offer of help behind the portal header's question mark, and the thing a
 * user meets once on their second login.
 *
 * `permanent` distinguishes the two: the second-login appearance retires
 * itself for good, while opening it deliberately from the header should not
 * quietly burn the one automatic showing.
 */
export function HelpDialog({
  open,
  onOpenChange,
  calLink,
  permanent,
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cal.com handle from CAL_LINK. Empty on instances that set no calendar. */
  calLink: string;
  permanent: boolean;
  /** Absent on pages that have no tour to replay. */
  onStartTour?: () => void;
}) {
  const t = useTranslations("guide");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* One close affordance, so the built-in corner cross stays off. */}
      <DialogContent
        showCloseButton={false}
        data-testid="help-dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{t("help.title")}</DialogTitle>
          <DialogDescription>{t("help.body")}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          <HelpRow icon={Mail}>
            {t("help.email")}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium underline underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>
          </HelpRow>

          {calLink && (
            <HelpRow icon={CalendarDays}>
              <a
                href={`https://cal.com/${calLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                {t("help.call")}
              </a>
            </HelpRow>
          )}

          <HelpRow icon={Server}>{t("help.selfHost")}</HelpRow>
          <HelpRow icon={MessageSquare}>{t("help.feedback")}</HelpRow>
        </ul>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onStartTour && (
            <Button type="button" variant="ghost" onClick={onStartTour}>
              <Compass className="size-4" aria-hidden />
              {t("help.startTour")}
            </Button>
          )}
          <Button
            type="button"
            data-testid="help-close"
            onClick={() => onOpenChange(false)}
          >
            {permanent ? t("help.dismissForever") : t("help.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
