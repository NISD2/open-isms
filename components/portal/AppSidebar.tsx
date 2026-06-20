"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lock,
  ScrollText,
  Search,
  Server,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ComplianceProgress } from "@/components/compliance/ComplianceProgress";
import { UserNav } from "./UserNav";
import { PortalSwitcher } from "./PortalSwitcher";

interface CategoryStep {
  slug: string;
  code: string;
  name: string;
  phase: string;
  requirementCount: number;
  completedCount: number;
  requirements: string[];
}

export interface FrameworkGroup {
  code: string;
  /** Translation key used with t() — e.g. "nis2", "dsgvo" */
  label: string;
  /** Prefix for category codes — e.g. "NIS2-", "DSGVO-" */
  codePrefix: string;
  steps: CategoryStep[];
  completed: number;
  total: number;
  /** Map of requirementCode → [prerequisite codes that are not yet done] */
  blockedRequirements: Record<string, string[]>;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isPlatformAdmin?: boolean;
  };
  frameworks: FrameworkGroup[];
}

export function AppSidebar({
  user,
  frameworks,
}: AppSidebarProps) {
  const t = useTranslations("portal");
  const tReq = useTranslations("requirements");
  const pathname = usePathname();
  // `usePathname()` returns the route template (e.g. `/compliance/[categorySlug]`),
  // so active-state must compare the resolved params, not concrete URL strings.
  const params = useParams<{ categorySlug?: string; requirementCode?: string }>();

  const overviewItems: NavItem[] = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/gap-assessment", label: t("gapAssessment"), icon: ClipboardCheck },
    { href: "/team", label: t("team"), icon: Users },
    { href: "/organization", label: t("organization"), icon: Building2 },
    { href: "/audit", label: t("auditTrail"), icon: ScrollText },
  ];

  const registerItems: NavItem[] = [
    { href: "/risks", label: t("riskRegister"), icon: AlertTriangle },
    { href: "/assets", label: t("assets"), icon: Server },
    { href: "/suppliers", label: t("suppliers"), icon: Truck },
    { href: "/policies", label: t("policies"), icon: FileText },
    { href: "/training", label: t("training"), icon: GraduationCap },
    { href: "/internal-audits", label: t("internalAudits"), icon: Search },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <PortalSwitcher current="compliance" />
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("overview")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href as never} prefetch={false}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            {/* Registers — collapsible sub-section within Overview */}
            <Collapsible className="group/registers">
              <CollapsibleTrigger className="flex w-full items-center px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground">
                {t("registers")}
                <ChevronRight className="ml-auto size-3.5 transition-transform group-data-[state=open]/registers:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu>
                  {registerItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.label}
                      >
                        <Link href={item.href as never} prefetch={false}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Frameworks */}
        {frameworks.map((fw) => {
          // Group steps by phase, preserving order
          const phases: { label: string; steps: CategoryStep[] }[] = [];
          for (const step of fw.steps) {
            const last = phases[phases.length - 1];
            if (last && last.label === step.phase) {
              last.steps.push(step);
            } else {
              phases.push({ label: step.phase, steps: [step] });
            }
          }

          return (
            <div key={fw.code} className="mt-2 border-t border-sidebar-border/40">
              <SidebarGroup className="py-1">
                <Collapsible className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center text-sidebar-foreground/90 font-medium">
                      {t(fw.label)}
                      <ChevronRight className="ml-auto size-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <div className="px-2 pt-1 pb-1 group-data-[collapsible=icon]:hidden">
                        <ComplianceProgress
                          completed={fw.completed}
                          total={fw.total}
                          className="w-full"
                        />
                      </div>
                      {phases.map((phase) => (
                        <div key={phase.label}>
                          <p className="px-2 pt-2 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
                            {t(phase.label)}
                          </p>
                          <SidebarMenu>
                            {phase.steps.map((step) => {
                              const categoryPath = `/compliance/${step.slug}`;
                              const isCompleted =
                                step.completedCount >= step.requirementCount &&
                                step.requirementCount > 0;
                              const codePrefix = fw.codePrefix;
                              const allBlocked = step.requirements.length > 0 &&
                                step.requirements.every((rc) => fw.blockedRequirements[rc]?.length);

                              return (
                                <Collapsible
                                  key={step.slug}
                                  asChild
                                  defaultOpen
                                >
                                  <SidebarMenuItem>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={params.categorySlug === step.slug && !params.requirementCode}
                                      tooltip={step.name}
                                      size="sm"
                                    >
                                      <Link href={categoryPath as never} prefetch={false}>
                                        <span className="font-mono text-[10px] text-muted-foreground w-4 text-center shrink-0">
                                          {step.code.replace(codePrefix, "")}
                                        </span>
                                        <span>{step.name}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuBadge className="cursor-pointer">
                                        {isCompleted ? (
                                          <Check className="size-3 text-green-600" />
                                        ) : allBlocked ? (
                                          <Lock className="size-3 text-muted-foreground/50" />
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground">
                                            {step.completedCount}/{step.requirementCount}
                                          </span>
                                        )}
                                      </SidebarMenuBadge>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <SidebarMenuSub>
                                        {step.requirements.map((reqCode) => {
                                          const reqKey = reqCode.replace(/\./g, "_");
                                          const reqPath = `${categoryPath}/${reqCode}`;
                                          const blockedBy = fw.blockedRequirements[reqCode];
                                          const isLocked = !!blockedBy?.length;

                                          const content = (
                                            <>
                                              {isLocked ? (
                                                <Lock className="size-3 text-muted-foreground shrink-0" />
                                              ) : (
                                                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                                  {reqCode}
                                                </span>
                                              )}
                                              <span className="truncate">
                                                {tReq(`${reqKey}.title`)}
                                              </span>
                                            </>
                                          );

                                          const item = isLocked ? (
                                            <SidebarMenuSubButton
                                              className="opacity-40 cursor-not-allowed"
                                            >
                                              {content}
                                            </SidebarMenuSubButton>
                                          ) : (
                                            <SidebarMenuSubButton
                                              asChild
                                              isActive={params.categorySlug === step.slug && params.requirementCode === reqCode}
                                            >
                                              <Link href={reqPath as never} prefetch={false}>
                                                {content}
                                              </Link>
                                            </SidebarMenuSubButton>
                                          );

                                          return (
                                            <SidebarMenuSubItem key={reqCode}>
                                              {isLocked ? (
                                                <TooltipProvider delayDuration={200}>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      {item}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="text-xs">
                                                      {t("blockedBy", { codes: blockedBy.join(", ") })}
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              ) : (
                                                item
                                              )}
                                            </SidebarMenuSubItem>
                                          );
                                        })}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  </SidebarMenuItem>
                                </Collapsible>
                              );
                            })}
                          </SidebarMenu>
                        </div>
                      ))}
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            </div>
          );
        })}

      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-2 py-1">
          <LocaleSwitcher />
        </div>
        <UserNav user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
