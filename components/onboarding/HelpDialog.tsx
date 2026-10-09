"use client";

import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { BookingLink } from "@/components/pricing/BookingLink";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The offer of help behind the portal header's question mark, and the thing a
 * user meets once on their second login: one sentence and one way to reach us,
 * the booking calendar.
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
  const tCall = useTranslations("pricing.tiers.talkFirst");

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

        {calLink && (
          <BookingLink
            calLink={calLink}
            data-testid="help-book-call"
            className={buttonVariants({ size: "lg" })}
          >
            {tCall("title")}
          </BookingLink>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onStartTour && (
            <Button type="button" variant="ghost" onClick={onStartTour}>
              <Compass className="size-4" aria-hidden />
              {t("help.startTour")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
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
