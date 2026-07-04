import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { getLocale } from "next-intl/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TrainingAppSidebar } from "@/components/training-portal/TrainingAppSidebar";
import { CoursePortalCta } from "@/components/training-portal/CoursePortalCta";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { api } from "@/lib/trpc/server";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const [session, locale] = await Promise.all([getSession(), getLocale()]);

  const { course, progress, lessonMetas } = await api.trainingPortal.getCourse({
    courseId,
  });

  const completedLessons = new Set(
    progress.filter((p) => p.completed).map((p) => p.lessonId),
  );

  return (
    <SidebarProvider defaultOpen>
      <TrainingAppSidebar
        user={{
          name: session?.user.name,
          email: session?.user.email,
          image: session?.user.image,
          isPlatformAdmin: isPlatformAdmin(session?.user.email),
        }}
        courseId={course.id}
        courseTitle={course.title[locale] ?? course.title.en}
        modules={course.modules}
        lessonMetas={lessonMetas}
        completedLessons={completedLessons}
      />
      <SidebarInset>
        <PortalHeader />
        <div className="flex-1 px-6 py-6">
          {courseId === "nis2-ceo" ? (
            <div className="mb-4 flex justify-end">
              <CoursePortalCta
                hasCompany={session?.companyActivated ?? false}
                locale={locale}
              />
            </div>
          ) : null}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
