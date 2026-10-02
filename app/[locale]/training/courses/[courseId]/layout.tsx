import { getLocale } from "next-intl/server";
import { CoursePortalCta } from "@/components/training-portal/CoursePortalCta";
import { getSession } from "@/lib/auth";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const [session, locale] = await Promise.all([getSession(), getLocale()]);

  return (
    <>
      {courseId === "nis2-ceo" ? (
        <div className="mb-4 flex justify-end">
          <CoursePortalCta
            hasCompany={session?.companyActivated ?? false}
            locale={locale}
          />
        </div>
      ) : null}
      {children}
    </>
  );
}
