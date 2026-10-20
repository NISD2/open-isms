"use client";

import "./transitions.css";
import { ArrowRight, ChevronLeft, PenLine, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { CompanyEssentials } from "@/components/organization/CompanyEssentials";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { SETUP_STEP } from "@/lib/durchgang";
import { FOOTER, HEADER, STAGE } from "./transition";

const FORM_ID = "dg-setup-form";

/** A header icon button: 44 px to tap on a phone, the button's own 36 px from `sm` up. */
const PHONE_ICON_TARGET = "size-11 sm:size-9";

/**
 * Setting the company up, as a step of the walk: the same frame as an item (header with the way
 * out, one screen in the middle, Back and Continue in the footer), so it does not read as a
 * different page (Simon, 20.10.2026). The form's own button lives in the footer.
 */
export function SetupStep({
  next,
}: {
  next: ComponentProps<typeof CompanyEssentials>["next"];
}) {
  const t = useTranslations("durchgang.ui");
  const th = useTranslations("durchgang.ui.home");
  const te = useTranslations("organization.essentials");
  const router = useRouter();
  const home = () => router.push("/durchgang/nis2");

  return (
    <div className="-m-6 flex min-h-[calc(100svh-3rem)] flex-col">
      <header
        className="sticky top-12 z-10 bg-background/90 backdrop-blur-md print:hidden"
        style={HEADER}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6 lg:px-10">
          <Button
            variant="ghost"
            size="icon"
            className={PHONE_ICON_TARGET}
            aria-label={t("back")}
            onClick={home}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{th("setupSection")}</p>
            <p className="truncate text-sm font-semibold">{th("setupHeadline")}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={PHONE_ICON_TARGET}
            aria-label={t("exit")}
            onClick={home}
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="h-1 bg-muted" />
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-12 sm:px-6 lg:px-10 lg:pt-14">
        <div style={STAGE} className="w-full max-w-3xl" data-dg-item={SETUP_STEP}>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <PenLine className="size-3.5" />
            {t("kinds.fields")}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {te("title")}
          </h1>
          <p className="mt-4 max-w-[58ch] text-lg leading-8 text-muted-foreground">
            {th("setupLead")}
          </p>
          <div className="mt-8">
            <CompanyEssentials
              mode="create"
              next={next}
              submitLabel={te("create")}
              formId={FORM_ID}
              hints={{
                name: th("setupNameHint"),
                sector: th("setupSectorHint"),
                entityType: th("setupEntityTypeHint"),
                entityTypes: {
                  essential: th("setupEntityTypes.essential"),
                  important: th("setupEntityTypes.important"),
                  kritis: th("setupEntityTypes.kritis"),
                },
              }}
            />
          </div>
        </div>
      </div>

      <footer
        className="sticky bottom-0 z-10 border-t bg-background/90 backdrop-blur-md print:hidden"
        style={FOOTER}
      >
        <div className="mx-auto flex max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex w-full max-w-3xl items-center justify-end gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={home}
              className="h-11 rounded-xl sm:h-10"
              aria-label={t("back")}
            >
              <ChevronLeft />
              <span className="hidden sm:inline">{t("back")}</span>
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              size="lg"
              className="h-11 rounded-xl px-6 sm:h-10"
            >
              {t("next")}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
