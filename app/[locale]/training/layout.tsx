import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { TrainingAppSidebar } from "@/components/training-portal/TrainingAppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { COURSES } from "@/lib/training/catalog";
import { api } from "@/lib/trpc/server";

/**
 * The training portal: its own sidebar on every course page, with the portal switcher at the top
 * as the way back to the compliance portal. It skips the compliance portal's gates, because every
 * account may take a course. The header carries no guide, whose offer of help opens on its own and
 * would cover the lesson.
 */
export default async function TrainingPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const [locale, courses] = await Promise.all([
    getLocale(),
    Promise.all(COURSES.map(({ id }) => api.trainingPortal.getCourse({ courseId: id }))),
  ]);

  return (
    <SidebarProvider defaultOpen>
      <TrainingAppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isPlatformAdmin: isPlatformAdmin(session.user.email),
        }}
        courses={courses.map(({ course, progress, lessonMetas }) => ({
          id: course.id,
          title: course.title[locale] ?? course.title.en,
          modules: course.modules,
          lessonMetas,
          completedLessons: progress.filter((p) => p.completed).map((p) => p.lessonId),
        }))}
      />
      <SidebarInset>
        <PortalHeader />
        <div className="flex-1 px-6 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
