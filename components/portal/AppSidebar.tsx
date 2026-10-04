"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardCheck,
  Compass,
  Download,
  FileText,
  Footprints,
  Gauge,
  GraduationCap,
  Receipt,
  ScrollText,
  Server,
  Truck,
  Users,
} from "lucide-react";
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
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { PortalSwitcher } from "./PortalSwitcher";
import { UserNav } from "./UserNav";

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
  /** Whether this person can order (lib/billing/ordering-access.ts). */
  showBilling: boolean;
  /** Whether this person's role may read the audit trail (hasReviewAccess, server/trpc/routers/audit.ts). */
  reviewAccess: boolean;
  /** Whether this person may export the company's records (`mayExport`, lib/export/access.ts). */
  mayExport: boolean;
  /**
   * Whether the account has the Compliance Portal (paid or grandfathered). Without it the journey
   * and the team are not shown, since each would only lead to the offer; the registers and the
   * audit log are, with example rows (`EXAMPLE_PORTAL_PATHS`).
   */
  portalOpen: boolean;
  /** Whether opening the journey asks first whether to stay in the walkthrough, every time. */
  journeyNotice: boolean;
}

/**
 * The journey, behind the walkthrough. For someone who can walk, every click asks first whether to
 * stay in the walkthrough, the simpler way through (Simon, 04.10.2026: "If I click on the sidebar,
 * the journey view, this modal should show up").
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
  const stay = useRef<HTMLButtonElement>(null);
  const answer = (go: boolean) => {
    setAsking(false);
    if (go) router.push("/journey");
  };
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
        <Link
          href="/journey"
          prefetch={false}
          onClick={(e) => {
            if (!notice) return;
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

/**
 * The compliance portal's sidebar: the walkthrough first, the journey behind it, the export; then
 * every register the walk writes into; then administration (Simon, 03.10.2026).
 */
export function AppSidebar({
  user,
  showBilling,
  reviewAccess,
  mayExport,
  portalOpen,
  journeyNotice,
}: AppSidebarProps) {
  const t = useTranslations("portal");
  const pathname = usePathname();

  const journey: NavItem = { href: "/journey", label: t("journey"), icon: Compass };
  const walkthrough: NavItem = {
    href: "/durchgang/nis2",
    label: t("durchgang"),
    icon: Footprints,
  };

  // The registers the walk writes into, in the walk's order (2.2 assets, 5.1 suppliers, 2.3 risks,
  // 2.4 and on the policies, 1.1 and 8.2 training, 7.3 reviews).
  const registerItems: NavItem[] = [
    { href: "/assets", label: t("assets"), icon: Server },
    { href: "/suppliers", label: t("suppliers"), icon: Truck },
    { href: "/risks", label: t("riskRegister"), icon: Gauge },
    { href: "/policies", label: t("policies"), icon: FileText },
    { href: "/training", label: t("training"), icon: GraduationCap },
    { href: "/management-reviews", label: t("managementReviews"), icon: ClipboardCheck },
  ];

  // Admin surfaces the walk never covers (org master data, roster, audit log). The roster sits
  // behind the paywall, so an account without the portal is not shown it; the audit log always
  // shows, with example entries until there is something of its own (Simon, 04.10.2026).
  const managementItems: NavItem[] = [
    ...(portalOpen ? [{ href: "/team", label: t("team"), icon: Users }] : []),
    { href: "/organization", label: t("organization"), icon: Building2 },
    ...(showBilling ? [{ href: "/billing", label: t("billing"), icon: Receipt }] : []),
    ...(reviewAccess
      ? [{ href: "/audit", label: t("auditTrail"), icon: ScrollText }]
      : []),
  ];

  // Everything recorded, as files to pass on (Simon, 03.10.2026).
  const exportItems: NavItem[] = mayExport
    ? [{ href: "/export", label: t("export"), icon: Download }]
    : [];

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
            <NavMenu items={[walkthrough]} pathname={pathname} />
            {portalOpen && (
              <SidebarMenu>
                <JourneyItem item={journey} notice={journeyNotice} pathname={pathname} />
              </SidebarMenu>
            )}
            <NavMenu items={exportItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Every register the walk writes into stands open, so a finished walk can be changed
            where it was recorded (Simon, 03.10.2026); without the portal, with example rows. */}
        <SidebarGroup data-tour="sidebar-registers">
          <SidebarGroupLabel>{t("registers")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={registerItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration — admin surfaces the walk never covers */}
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
