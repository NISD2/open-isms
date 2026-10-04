import { getTranslations } from "next-intl/server";
import type { ComponentProps } from "react";
import { CompanyEssentials } from "./CompanyEssentials";

/**
 * Setting up the company, wherever a company that is not set up yet arrives: the walk's first
 * step, and in place of any page that needs a company. Never a separate onboarding screen
 * (Simon, 04.10.2026: "I should never see this").
 */
export async function CompanySetup({
  eyebrow,
  next,
}: {
  eyebrow?: string;
  next?: ComponentProps<typeof CompanyEssentials>["next"];
}) {
  const t = await getTranslations("organization.essentials");
  return (
    <div className="mx-auto max-w-2xl py-6">
      {eyebrow && (
        <p className="inline-flex rounded-full bg-primary/[0.08] px-3 py-1 text-sm font-medium text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-[58ch] text-lg leading-8 text-muted-foreground">
        {t("lead")}
      </p>
      <div className="mt-8 rounded-3xl border bg-card p-6 shadow-xs sm:p-8">
        <CompanyEssentials mode="create" next={next} submitLabel={t("create")} />
      </div>
    </div>
  );
}
