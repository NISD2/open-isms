"use client";

import { Check, Copy, GraduationCap, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPathname } from "@/i18n/navigation";
import type { WalkLocale } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";

/**
 * Under 1.1's list: someone from management is invited to the platform's course for management,
 * and lands in it after signing in. Joining the team is what puts their progress on the list
 * above. Anyone may copy the course's link for a colleague already in the team; only an admin
 * invites someone new, as on the team page.
 */
export function CourseInvite({
  admin,
  locale,
  course,
}: {
  admin: boolean;
  locale: WalkLocale;
  course: string;
}) {
  const t = useTranslations("durchgang.ui.training.invite");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const path = getPathname({
    href: { pathname: "/training/courses/[courseId]", params: { courseId: "nis2-ceo" } },
    locale,
  });
  const invite = trpc.team.invite.useMutation({
    onSuccess: (data, input) => {
      setEmail("");
      if (data.emailed) toast.success(t("invited", { email: input.email }));
      else toast.warning(t("notEmailed", { email: input.email }));
    },
    onError: (err) => toast.error(userFacingError(err, t("failed"))),
  });
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4 border-t px-5 py-5">
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GraduationCap className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t("title", { course })}</p>
          <p className="mt-0.5 max-w-[60ch] text-sm leading-6 text-muted-foreground">
            {t("lead")}
          </p>
        </div>
      </div>
      {admin ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) invite.mutate({ email: email.trim(), redirectPath: path });
          }}
        >
          <label htmlFor="dg-course-email" className="text-sm font-medium">
            {t("label")}
          </label>
          <div className="flex max-w-md gap-2">
            <Input
              id="dg-course-email"
              type="email"
              required
              placeholder={t("placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={invite.isPending}>
              <Send />
              {t("send")}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("askAdmin")}</p>
      )}
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {t("copyLink")}
      </Button>
    </section>
  );
}
