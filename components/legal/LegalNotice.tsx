import { getTranslations } from "next-intl/server";
import { isSellerInstance } from "@/lib/billing/seller";
import { NISD2_ORIGIN } from "@/lib/edition";
import { LICENSE_URL, SOURCE_URL } from "@/lib/legal-notice";
import { cn } from "@/lib/utils";

const linkClass = "underline hover:text-foreground";

/**
 * The AGPL's "Appropriate Legal Notices" (section 0): who may use the software on what terms,
 * the warranty position, and where the source is. Shown on every install, ours included, so a
 * copy that keeps this component keeps showing them (section 5(d)). A copy also says it is not
 * nisd2.eu: its users have no contract with us, and the operator, not nisd2.eu, runs it.
 * Judged on the server, from the address the install is configured with: the same check the
 * email footer uses (isSellerInstance).
 */
export async function LegalNotice({ className }: { className?: string }) {
  const t = await getTranslations("legalNotice");
  return (
    <div className={cn("space-y-1 text-center text-xs text-muted-foreground", className)}>
      <p>
        {t.rich("software", {
          // The attribution NOTICE's section 7(b) term asks every copy to keep, with its link.
          product: (chunks) => (
            <a href={NISD2_ORIGIN} className={linkClass}>
              {chunks}
            </a>
          ),
          license: (chunks) => (
            <a
              href={LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {chunks}
            </a>
          ),
          source: (chunks) => (
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {chunks}
            </a>
          ),
        })}
      </p>
      {isSellerInstance() ? null : <p>{t("independent")}</p>}
    </div>
  );
}
