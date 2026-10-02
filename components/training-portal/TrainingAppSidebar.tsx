"use client";

import { BookOpen, Check, ChevronRight, GraduationCap, LayoutGrid } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { PortalSwitcher } from "@/components/portal/PortalSwitcher";
import { UserNav } from "@/components/portal/UserNav";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";

interface CourseModule {
  id: string;
  title: Record<string, string>;
  order: number;
  lessonIds: string[];
}

interface LessonMeta {
  title: Record<string, string>;
  estimatedMinutes: number;
  hasQuiz: boolean;
}

/** One course as the sidebar shows it: its title in the visitor's language, its lessons, what is done. */
export interface TrainingCourseNav {
  id: string;
  title: string;
  modules: CourseModule[];
  lessonMetas: Record<string, LessonMeta>;
  completedLessons: string[];
}

interface TrainingAppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isPlatformAdmin?: boolean;
  };
  courses: TrainingCourseNav[];
}

/** The open course's modules, each a collapsible list of its lessons. */
function CourseLessons({
  course,
  lessonId,
  locale,
}: {
  course: TrainingCourseNav;
  lessonId: string | undefined;
  locale: string;
}) {
  const completed = new Set(course.completedLessons);

  return course.modules.map((mod) => {
    const completedInModule = mod.lessonIds.filter((id) => completed.has(id)).length;

    return (
      <Collapsible
        key={mod.id}
        defaultOpen={mod.lessonIds.includes(lessonId ?? "")}
        className="group/collapsible"
      >
        <SidebarGroup className="py-0">
          <SidebarGroupLabel asChild className="h-8 px-3">
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <span className="truncate">{mod.title[locale] ?? mod.title.en}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {completedInModule}/{mod.lessonIds.length}
                </span>
                <ChevronRight className="size-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </div>
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {mod.lessonIds.map((id) => {
                  const meta = course.lessonMetas[id];
                  const title = meta?.title?.[locale] ?? meta?.title?.en ?? id;

                  return (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        asChild
                        isActive={lessonId === id}
                        className="h-7"
                      >
                        <Link
                          href={`/training/courses/${course.id}/${id}` as never}
                          prefetch={false}
                        >
                          {completed.has(id) ? (
                            <Check className="size-3 text-green-600 shrink-0" />
                          ) : (
                            <GraduationCap className="size-3 shrink-0" />
                          )}
                          <span className="text-xs truncate">{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  });
}

/**
 * The training portal's sidebar, on every course page. The portal switcher at the top is the way
 * back to the compliance portal; below it every course, and the open course's lessons.
 */
export function TrainingAppSidebar({ user, courses }: TrainingAppSidebarProps) {
  const t = useTranslations("trainingPortal");
  const locale = useLocale();
  const pathname = usePathname();
  // `usePathname()` returns the route template (e.g.
  // `/training/courses/[courseId]/[lessonId]`), so active-state and the current
  // lesson must come from the resolved params, not concrete URL strings.
  const params = useParams<{ courseId?: string; lessonId?: string }>();
  const current = courses.find((course) => course.id === params.courseId);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <PortalSwitcher current="training" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/training/courses"}
                  tooltip={t("courses")}
                  className="h-8"
                >
                  <Link href="/training/courses" prefetch={false}>
                    <LayoutGrid className="size-4" />
                    <span className="text-sm font-medium">{t("courses")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {courses.map((course) => (
                <SidebarMenuItem key={course.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={params.courseId === course.id && !params.lessonId}
                    tooltip={course.title}
                    className="h-8 pr-11"
                  >
                    <Link
                      href={{
                        pathname: "/training/courses/[courseId]",
                        params: { courseId: course.id },
                      }}
                      prefetch={false}
                    >
                      <BookOpen className="size-4" />
                      <span className="truncate text-sm">{course.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuBadge className="text-[10px] tabular-nums text-muted-foreground">
                    {course.completedLessons.length}/
                    {course.modules.reduce((n, m) => n + m.lessonIds.length, 0)}
                  </SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {current ? (
          <CourseLessons course={current} lessonId={params.lessonId} locale={locale} />
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <UserNav user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
