"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  alsoCountsFor,
  WALK_FRAMEWORKS,
  WALK_ROUTES,
  type WalkFramework,
} from "@/lib/durchgang";
import { FrameworkBadge, LAW_NAME_KEY } from "./FrameworkBadge";

/**
 * What management's approval covers, said before the list: the documents and steps of this
 * walk's law, and for the other law only what is the same record there (`alsoCountsFor`), which
 * today is nothing. The other walk keeps its own approval page, linked here.
 */
export function ApprovalScope({
  framework,
  codes,
}: {
  framework: WalkFramework;
  /** The items this approval signs or approves documents of. */
  codes: readonly string[];
}) {
  const t = useTranslations("durchgang.ui.approve.scope");
  const tLaw = useTranslations("portal");
  const lawOf = (f: WalkFramework) => tLaw(LAW_NAME_KEY[f]);
  const also = codes.flatMap(alsoCountsFor);
  return (
    <section className="mt-8 rounded-2xl border bg-muted/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{t("title")}</p>
        <FrameworkBadge framework={framework} />
      </div>
      <p className="mt-2 max-w-[62ch] text-sm leading-6">
        {t("own", { law: lawOf(framework) })}
      </p>
      {WALK_FRAMEWORKS.filter((other) => other !== framework).map((other) => {
        const credited = also.filter((a) => a.framework === other).map((a) => a.code);
        return (
          <p
            key={other}
            className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground"
          >
            {credited.length > 0
              ? t("also", { law: lawOf(other), codes: credited.join(", ") })
              : t("other", { law: lawOf(other) })}{" "}
            <Link
              href={WALK_ROUTES[other].approval}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("openOther", { law: lawOf(other) })}
            </Link>
          </p>
        );
      })}
    </section>
  );
}
