"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  Compass,
  FileText,
  Footprints,
  Gauge,
  GraduationCap,
  Receipt,
  ScrollText,
  Server,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { PortalSwitcher } from "./PortalSwitcher";
import { UserNav } from "./UserNav";

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
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Set when the destination is not open to this person yet: why, shown instead of a link. */
  soon?: string;
}

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isPlatformAdmin?: boolean;
  };
  frameworks: FrameworkGroup[];
  /** Whether billing is launched for this person (lib/billing/ordering-access.ts). */
  showBilling: boolean;
  /** Whether this person's role may read the audit trail (hasReviewAccess, server/trpc/routers/audit.ts). */
  showAuditTrail: boolean;
  /**
   * Whether the walkthrough is the portal's front for this person (lib/walkthrough.ts): it comes
   * first and is a link (its home shows an unpaid account the way to order), the journey follows
   * behind a one-time notice, the registers stand open and the framework tree is gone. Otherwise
   * the journey comes first and the walkthrough sits in its place marked as coming soon.
   */
  walkthroughLive: boolean;
  /** Whether the journey shows at all: not for an account that has not paid. */
  showJourney: boolean;
  /** Whether opening the journey still asks once whether to stay in the walkthrough. */
  journeyNotice: boolean;
}

/**
 * A destination not open to this person yet: in its place, not clickable, with why. The note
 * opens on hover with a mouse and on a tap, since a tooltip never opens on touch; collapsed to
 * icons it also names the item.
 */
function SoonButton({ item }: { item: NavItem & { soon: string } }) {
  const [open, setOpen] = useState(false);
  const { state } = useSidebar();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* The sidebar's own aria-disabled style dims the item and turns pointer events off,
            which would also stop the hover and the tap that show why; this one keeps them. */}
        <SidebarMenuButton
          aria-disabled
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          className="cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground aria-disabled:pointer-events-auto"
        >
          <item.icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto max-w-64 px-3 py-1.5 text-xs"
      >
        {state === "collapsed" ? `${item.label}: ${item.soon}` : item.soon}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The journey, once the walkthrough is the portal's front. The first click asks once whether to
 * stay in the walkthrough, the simpler way through, and records the answer either way, so it never
 * asks again (Simon, 03.10.2026). Closing the question without an answer asks again next time.
 */
function JourneyItem({
  item,
  notice,
  pathname,
}: {
  item: NavItem;
  notice: boolean;
  pathname: string;
}) {
  const t = useTranslations("portal.journeyNotice");
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(notice);
  const stay = useRef<HTMLButtonElement>(null);
  const dismiss = trpc.user.dismissHint.useMutation();
  const answer = (go: boolean) => {
    setAsking(false);
    setPending(false);
    dismiss.mutate({ hint: "journeyNotice" });
    if (go) router.push("/journey");
  };
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
        <Link
          href="/journey"
          prefetch={false}
          onClick={(e) => {
            if (!pending) return;
            e.preventDefault();
            setAsking(true);
          }}
        >
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      <AlertDialog open={asking} onOpenChange={setAsking}>
        {/* The recommended answer holds the focus, so Enter stays in the walkthrough; Radix
            would otherwise focus the cancel button, which here leaves for the journey. */}
        <AlertDialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            stay.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("text")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => answer(true)}>{t("go")}</AlertDialogCancel>
            <AlertDialogAction ref={stay} onClick={() => answer(false)}>
              {t("stay")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  );
}

function NavMenu({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          {item.soon === undefined ? (
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
          ) : (
            <SoonButton item={{ ...item, soon: item.soon }} />
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar({
  user,
  frameworks,
  showBilling,
  showAuditTrail,
  walkthroughLive,
  showJourney,
  journeyNotice,
}: AppSidebarProps) {
  const t = useTranslations("portal");
  const pathname = usePathname();
  // `usePathname()` returns the route template (e.g. `/compliance/[categorySlug]`),
  // so active-state must compare the resolved params, not concrete URL strings.
  const params = useParams<{ categorySlug?: string; requirementCode?: string }>();

  const journey: NavItem = { href: "/journey", label: t("journey"), icon: Compass };
  const walkthrough: NavItem = {
    href: "/durchgang/nis2",
    label: t("durchgang"),
    icon: Footprints,
    ...(walkthroughLive ? {} : { soon: t("comingSoon") }),
  };

  // Living registers the journey strands: /assets only appears in the journey
  // until 5 assets exist, and the all-policies overview has no swim-lane equivalent.
  const registerItems: NavItem[] = [
    { href: "/assets", label: t("assets"), icon: Server },
    { href: "/policies", label: t("policies"), icon: FileText },
  ];

  // Once the walkthrough is the front: the registers it writes into, in the walk's order (2.2
  // assets, 5.1 suppliers, 2.3 risks, 2.4 and on the policies, 1.1 and 8.2 training, 7.3 reviews).
  const walkRegisterItems: NavItem[] = [
    { href: "/assets", label: t("assets"), icon: Server },
    { href: "/suppliers", label: t("suppliers"), icon: Truck },
    { href: "/risks", label: t("riskRegister"), icon: Gauge },
    { href: "/policies", label: t("policies"), icon: FileText },
    { href: "/training", label: t("training"), icon: GraduationCap },
    { href: "/management-reviews", label: t("managementReviews"), icon: ClipboardCheck },
  ];

  // Admin surfaces the journey never covers (org master data, roster, audit log).
  const managementItems: NavItem[] = [
    { href: "/team", label: t("team"), icon: Users },
    { href: "/organization", label: t("organization"), icon: Building2 },
    ...(showBilling ? [{ href: "/billing", label: t("billing"), icon: Receipt }] : []),
    ...(showAuditTrail
      ? [{ href: "/audit", label: t("auditTrail"), icon: ScrollText }]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <PortalSwitcher current="compliance" />
      </SidebarHeader>

      <SidebarContent data-tour="sidebar-nav">
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("overview")}</SidebarGroupLabel>
          <SidebarGroupContent>
            {walkthroughLive ? (
              <>
                <NavMenu items={[walkthrough]} pathname={pathname} />
                {showJourney && (
                  <SidebarMenu>
                    <JourneyItem
                      item={journey}
                      notice={journeyNotice}
                      pathname={pathname}
                    />
                  </SidebarMenu>
                )}
              </>
            ) : (
              <>
                <NavMenu items={[journey, walkthrough]} pathname={pathname} />
                {/* Registers — collapsible sub-section within Overview */}
                <Collapsible data-tour="sidebar-registers" className="group/registers">
                  <CollapsibleTrigger className="flex w-full items-center px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground">
                    {t("registers")}
                    <ChevronRight className="ml-auto size-3.5 transition-transform group-data-[state=open]/registers:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <NavMenu items={registerItems} pathname={pathname} />
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Every register the walk writes into stands open, so a finished walk can be changed
            where it was recorded (Simon, 03.10.2026). */}
        {walkthroughLive && (
          <SidebarGroup data-tour="sidebar-registers">
            <SidebarGroupLabel>{t("registers")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMenu items={walkRegisterItems} pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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

          const pct = fw.total > 0 ? Math.round((fw.completed / fw.total) * 100) : 0;

          return (
            <SidebarGroup key={fw.code} className="py-0.5">
              <SidebarGroupContent>
                <Collapsible className="group/fw">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="font-medium">
                          <ShieldCheck />
                          <span>{t(fw.label)}</span>
                          <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground group-data-[collapsible=icon]:hidden">
                            {fw.completed}/{fw.total}
                          </span>
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/fw:rotate-90 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                  </SidebarMenu>
                  <CollapsibleContent>
                    <div className="mb-1 mt-1 px-3 group-data-[collapsible=icon]:hidden">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-sidebar-border/60">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {phases.map((phase) => (
                      <div
                        key={phase.label}
                        className="group-data-[collapsible=icon]:hidden"
                      >
                        <p className="px-2 pb-0.5 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                          {t(phase.label)}
                        </p>
                        <SidebarMenu>
                          {phase.steps.map((step) => {
                            const categoryPath = `/compliance/${step.slug}`;
                            const isCompleted =
                              step.completedCount >= step.requirementCount &&
                              step.requirementCount > 0;
                            return (
                              <SidebarMenuItem key={step.slug}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={
                                    params.categorySlug === step.slug &&
                                    !params.requirementCode
                                  }
                                  tooltip={step.name}
                                  size="sm"
                                >
                                  <Link href={categoryPath as never} prefetch={false}>
                                    <span className="w-4 shrink-0 text-center font-mono text-[10px] text-muted-foreground">
                                      {step.code.replace(fw.codePrefix, "")}
                                    </span>
                                    <span className="truncate">{step.name}</span>
                                  </Link>
                                </SidebarMenuButton>
                                <SidebarMenuBadge>
                                  {isCompleted ? (
                                    <Check className="size-3 text-emerald-600" />
                                  ) : (
                                    <span className="text-[10px] tabular-nums text-muted-foreground">
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
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroupContent>
            </SidebarGroup>
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
