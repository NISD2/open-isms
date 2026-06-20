"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  BookOpen,
  Check,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  Lock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/portal/UserNav";
import { PortalSwitcher } from "@/components/portal/PortalSwitcher";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

interface TrainingAppSidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null; isPlatformAdmin?: boolean };
  courseId: string;
  courseTitle?: string;
  modules: CourseModule[];
  lessonMetas: Record<string, LessonMeta>;
  completedLessons: Set<string>;
  availableLessons: Set<string>;
}

export function TrainingAppSidebar({
  user,
  courseId,
  modules,
  lessonMetas,
  completedLessons,
  availableLessons,
}: TrainingAppSidebarProps) {
  const t = useTranslations("trainingPortal");
  const locale = useLocale();
  const pathname = usePathname();
  // `usePathname()` returns the route template (e.g.
  // `/training/courses/[courseId]/[lessonId]`), so active-state and the current
  // lesson must come from the resolved params, not concrete URL strings.
  const params = useParams<{ courseId?: string; lessonId?: string }>();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <PortalSwitcher current="training" />
      </SidebarHeader>

      <SidebarContent>
        {/* All courses + current course overview */}
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/training/courses"}
                  className="h-8"
                >
                  <Link href="/training/courses" prefetch={false}>
                    <LayoutGrid className="size-4" />
                    <span className="text-sm font-medium">{t("courses")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={params.courseId === courseId && !params.lessonId}
                  className="h-8"
                >
                  <Link
                    href={{
                      pathname: "/training/courses/[courseId]",
                      params: { courseId },
                    }}
                    prefetch={false}
                  >
                    <BookOpen className="size-4" />
                    <span className="text-sm font-medium">{t("courseOverview")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Modules with lessons */}
        {modules.map((mod) => {
          const completedInModule = mod.lessonIds.filter((id) =>
            completedLessons.has(id),
          ).length;

          const currentLessonId = params.lessonId;
          const hasActiveChild = mod.lessonIds.some(
            (id) => id === currentLessonId,
          );

          return (
            <Collapsible
              key={mod.id}
              defaultOpen={hasActiveChild}
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
                      {mod.lessonIds.map((lessonId) => {
                        const isCompleted = completedLessons.has(lessonId);
                        const isAvailable = availableLessons.has(lessonId);
                        const lessonPath = `/training/courses/${courseId}/${lessonId}`;
                        const isActive = params.lessonId === lessonId;
                        const title =
                          lessonMetas[lessonId]?.title?.[locale] ?? lessonMetas[lessonId]?.title?.en ?? lessonId;

                        return (
                          <SidebarMenuItem key={lessonId}>
                            <SidebarMenuButton
                              asChild={isAvailable}
                              isActive={isActive}
                              className={`h-7 ${!isAvailable ? "opacity-40 cursor-default" : ""}`}
                            >
                              {isAvailable ? (
                                <Link href={lessonPath as never} prefetch={false}>
                                  {isCompleted ? (
                                    <Check className="size-3 text-green-600 shrink-0" />
                                  ) : (
                                    <GraduationCap className="size-3 shrink-0" />
                                  )}
                                  <span className="text-xs truncate">
                                    {title}
                                  </span>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Lock className="size-3 shrink-0" />
                                  <span className="text-xs truncate">
                                    {title}
                                  </span>
                                </div>
                              )}
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
        })}
      </SidebarContent>

      <SidebarFooter>
        <UserNav user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
