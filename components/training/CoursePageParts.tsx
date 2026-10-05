import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Art } from "@/components/durchgang/Art";
import { Link } from "@/i18n/navigation";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";
import { cn } from "@/lib/utils";

/** Back to the public course overview, at the top of the course page. */
async function AllCoursesLink() {
  const t = await getTranslations("trainingPortal.coursePage");
  return (
    <Link
      href="/kurse"
      className="-my-2 -ml-1 flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      <ChevronLeft aria-hidden className="size-4" />
      {t("allCourses")}
    </Link>
  );
}

/**
 * The course's hero: the way back to all courses, then its text beside its picture on a wide
 * screen. On a phone the picture stays small above the text, so the start button still sits on the
 * first screen.
 */
export function CourseHero({
  art,
  children,
}: {
  art: string;
  children: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      <AllCoursesLink />
      <div className="grid gap-x-10 gap-y-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="space-y-4">{children}</div>
        <Art src={art} className="order-first h-20 sm:order-none sm:h-52 lg:h-60" />
      </div>
    </header>
  );
}

/**
 * What a course reader gets free and what costs money, said once for every course page. The price
 * is the published list price, never typed into a message.
 */
export async function WhatIsFree({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const t = await getTranslations("trainingPortal.coursePage");
  return (
    <p className={cn("text-muted-foreground leading-relaxed", className)}>
      {t("whatIsFree", { price: formatWholeEuro(ANNUAL_NET_CENTS, locale) })}
    </p>
  );
}
