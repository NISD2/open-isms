"use client";

/**
 * "Ihr Zugang" at the top of the agreement page: the contact email already has the Durchgang, and
 * one button leads in, to set a first password or to sign in. The server decides which
 * (lib/partner-contract/access), so the button only asks and follows.
 */
import { KeyRound } from "lucide-react";
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
    <div className="rounded-lg border border-primary/25 bg-primary/5 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{t("access.title")}</h3>
            <p className="max-w-[62ch] text-[15px] leading-6">
              {t("access.body", { email: props.email })}
            </p>
          </div>
          <Button
            size="lg"
            disabled={enter.isPending || enter.isSuccess}
            onClick={() => enter.mutate({ token: props.token })}
          >
            {props.entry === "setup" ? t("access.setup") : t("access.signin")}
          </Button>
          {enter.isError ? (
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t("access.error", { email: props.contactEmail })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
