"use client";

import { CalendarDays, Mail, Check, GraduationCap, Server, Compass, Handshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCopy } from "@/lib/clipboard/use-copy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The in-product address, and deliberately NOT the one /hilfe publishes.
 *
 *   PUBLIC   /hilfe is reachable by anyone, including people who have never
 *            signed up, and goes to the shared inbox (help.contact.email).
 *   IN-APP   this dialog is what a signed-in user meets on their second
 *            login. It is a direct line, not a queue.
 *
 * Recorded here because the split reads as drift from the code alone and has
 * been "corrected" once already. e2e/l1/guide.spec.ts:199 pins this value, so
 * the test is the second half of the same decision.
 *
 * STILL A LITERAL, and it should not stay one. CLAUDE.md's "Never commit"
 * list says support emails belong in the SUPPORT_EMAIL env var, and this is a
 * named person's mailbox shipping in an AGPL repo: a self-hosted instance
 * renders it in its own help dialog with no way to change it. Being a client
 * component is NOT the obstacle -- `calLink` two properties down is
 * env.CAL_LINK, threaded (portal)/layout.tsx -> PortalHeader -> PortalGuide
 * -> here, and it already models the empty case ("" hides the row).
 *
 * Left as it is only because SUPPORT_EMAIL is the OTHER address, the shared
 * inbox /hilfe publishes; pointing this at it would silently reroute the
 * in-app direct line and fail e2e/l1/guide.spec.ts:199. It wants its own
 * variable and its own prop, which is a change to the portal layout rather
 * than to this file, so it is written down here instead of half-done.
 */
const CONTACT_EMAIL = "cory@nisd2.eu";

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
  const tHelp = useTranslations("help");
  const { copied, copy } = useCopy();

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
          <HelpRow icon={copied ? Check : Mail}>
            {t("help.email")}{" "}
            <button
              type="button"
              data-testid="help-copy-email"
              onClick={() => void copy(CONTACT_EMAIL, t("help.emailCopied"))}
              className="font-medium underline underline-offset-4 hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </button>
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
          {/* What happens when the platform is not enough. The full offer,
              including how a referral earns us anything, lives on /hilfe;
              this is the pointer to it, not a second copy of it. */}
          <HelpRow icon={Handshake}>{tHelp("inApp.dialog.line")}</HelpRow>
          <HelpRow icon={GraduationCap}>
            {t("help.training")}{" "}
            <Link
              href={{
                pathname: "/training/courses/[courseId]",
                params: { courseId: "nis2-ceo" },
              }}
              className="font-medium underline underline-offset-4"
            >
              {t("help.trainingLink")}
            </Link>
          </HelpRow>
        </ul>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" asChild>
            <Link href="/hilfe" target="_blank" rel="noopener noreferrer">
              <Handshake className="size-4" aria-hidden />
              {tHelp("inApp.dialog.cta")}
            </Link>
          </Button>
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
