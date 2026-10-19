import { GraduationCap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * The free management course, the third way forward of the homepage hero (beside starting the
 * walkthrough and booking a call), wherever that hero's ways forward are repeated. Its words are
 * the hero's own, so the offer reads the same on every page.
 */
export async function ManagementCourseLink({
  className,
  icon = false,
}: {
  className: string;
  icon?: boolean;
}) {
  const t = await getTranslations("landing.guided");
  return (
    <Link href="/training/nis2-ceo" className={className}>
      {icon && <GraduationCap aria-hidden className="size-3.5" />}
      {t("trainingCta")}
    </Link>
  );
}
