"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
  Building2,
  Check,
  ChevronRight,
  Compass,
  FileText,
  Lock,
  ScrollText,
  Server,
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
  SidebarRail,
} from "@/components/ui/sidebar";
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

function NavMenu({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
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
  );
}

export function AppSidebar({
  user,
  frameworks,
}: AppSidebarProps) {
  const t = useTranslations("portal");
  const pathname = usePathname();
  // `usePathname()` returns the route template (e.g. `/compliance/[categorySlug]`),
  // so active-state must compare the resolved params, not concrete URL strings.
  const params = useParams<{ categorySlug?: string; requirementCode?: string }>();

  const overviewItems: NavItem[] = [
    { href: "/journey", label: t("journey"), icon: Compass },
  ];

  // Living registers the journey strands: /assets only appears in the journey
  // until 5 assets exist, and the all-policies overview has no swim-lane equivalent.
  const registerItems: NavItem[] = [
    { href: "/assets", label: t("assets"), icon: Server },
    { href: "/policies", label: t("policies"), icon: FileText },
  ];

  // Admin surfaces the journey never covers (org master data, roster, audit log).
  const managementItems: NavItem[] = [
    { href: "/team", label: t("team"), icon: Users },
    { href: "/organization", label: t("organization"), icon: Building2 },
    { href: "/audit", label: t("auditTrail"), icon: ScrollText },
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
            <NavMenu items={overviewItems} pathname={pathname} />
            {/* Registers — collapsible sub-section within Overview */}
            <Collapsible className="group/registers">
              <CollapsibleTrigger className="flex w-full items-center px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground">
                {t("registers")}
                <ChevronRight className="ml-auto size-3.5 transition-transform group-data-[state=open]/registers:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <NavMenu items={registerItems} pathname={pathname} />
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
                                <SidebarMenuItem key={step.slug}>
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
                                  <SidebarMenuBadge>
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
                                </SidebarMenuItem>
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

        {/* Administration — admin surfaces the journey never covers */}
        <SidebarGroup className="mt-2 border-t border-sidebar-border/40">
          <SidebarGroupLabel>{t("administration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={managementItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

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
