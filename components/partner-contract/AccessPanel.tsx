"use client";

/**
 * "Ihr Zugang" at the top of the agreement page: the contact email already has the Durchgang, and
 * one button leads in, to set a first password or to sign in. The server decides which
 * (lib/partner-contract/access), so the button only asks and follows.
 */
import { KeyRound, Mail } from "lucide-react";
import { createTranslator } from "next-intl";
import { Button } from "@/components/ui/button";
import type { PartnerContractLocale } from "@/lib/partner-contract/date";
import type { PartnerContractPageMessages } from "@/lib/partner-contract/document";
import { trpc } from "@/lib/trpc/client";

interface Props {
  readonly token: string;
  readonly locale: PartnerContractLocale;
  readonly messages: PartnerContractPageMessages;
  readonly email: string;
  readonly entry: "setup" | "signin";
  /** The language prefix for links into the app ("" for the default language). */
  readonly localePrefix: string;
  readonly contactEmail: string;
}

export function AccessPanel(props: Props) {
  const t = createTranslator({
    locale: props.locale,
    messages: { page: props.messages },
    namespace: "page",
  });
  const enter = trpc.partnerContract.enter.useMutation({
    onSuccess: (r) => {
      const path = r.kind === "setup" ? r.path : "/auth/signin";
      window.location.assign(`${props.localePrefix}${path}`);
    },
  });

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <KeyRound className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">{t("access.title")}</h3>
      </div>
      <p className="mt-4 max-w-[62ch] text-base font-medium leading-6">
        {t("access.trial")}
      </p>
      <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm">
        <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 break-all">{props.email}</span>
      </p>
      <p className="mt-4 max-w-[62ch] text-[15px] leading-6 text-muted-foreground">
        {t("access.body")}
      </p>
      <div className="mt-5">
        <Button
          size="lg"
          disabled={enter.isPending || enter.isSuccess}
          onClick={() => enter.mutate({ token: props.token })}
        >
          {props.entry === "setup" ? t("access.setup") : t("access.signin")}
        </Button>
      </div>
      {enter.isError ? (
        <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">
          {t("access.error", { email: props.contactEmail })}
        </p>
      ) : null}
    </div>
  );
}
