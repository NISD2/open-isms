import { getLocale } from "next-intl/server";
import { CoursePortalCta } from "@/components/training-portal/CoursePortalCta";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const [{ courseId }, locale] = await Promise.all([params, getLocale()]);

  return (
    <>
      {courseId === "nis2-ceo" ? (
        <div className="mb-4 flex justify-end">
          <CoursePortalCta locale={locale} />
        </div>
      ) : null}
      {children}
    </>
  );
}
