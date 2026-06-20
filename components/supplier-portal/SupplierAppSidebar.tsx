"use client";

/**
 * Supplier portal sidebar — same shadcn primitives as the entity portal
 * AppSidebar, but a much simpler structure: two groups (General + Customers).
 *
 * General group:
 *   - Profile           → identity + customer-facing incident contact
 *   - Security practices → company-wide ISMS / NIS2 baseline practices
 *   - Certifications     → upload ISO 27001 / Grundschutz certs
 *
 * Customers group (collapsible, default open):
 *   One entry per supplier_relationship row, labelled by the email domain
 *   (e.g. "acme.com" extracted from ciso@acme.com). Each entry expands to:
 *     - Assets    → per-customer service offerings (SaaS app, on-prem
 *                   appliance, consulting engagement, etc.)
 *     - Incidents → notify this customer about events affecting their assets
 *     - Access    → invite/revoke people from this customer org
 *
 *   When the supplier has zero customers, this group shows just an empty-
 *   state add button. The "+ Add customer" affordance under each customer
 *   list also creates a new relationship row via the existing invite flow.
 */
import { Link, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  Building2,
  ListChecks,
  ShieldCheck,
  Users,
  Plus,
  Server,
  AlertCircle,
  KeyRound,
  Layers,
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/portal/UserNav";
import { PortalSwitcher } from "@/components/portal/PortalSwitcher";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const GENERAL_NAV: NavItem[] = [
  { href: "/portal/supplier/profile", label: "Profile", icon: Building2 },
  {
    href: "/portal/supplier/practices",
    label: "Security practices",
    icon: ListChecks,
  },
  {
    href: "/portal/supplier/service-type",
    label: "Service type",
    icon: Layers,
  },
  {
    href: "/portal/supplier/certifications",
    label: "Certifications",
    icon: ShieldCheck,
  },
];

interface CustomerEntry {
  id: string;
  customerEmail: string | null;
  customerOrgName: string | null;
  status: "active" | "revoked" | "bounced" | null;
}

interface SupplierAppSidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null; isPlatformAdmin?: boolean };
  customers: CustomerEntry[];
}

/** Extract a stable display label for a customer row — domain first, then full email. */
function customerLabel(c: CustomerEntry): string {
  if (c.customerOrgName?.trim()) return c.customerOrgName.trim();
  if (c.customerEmail) {
    const at = c.customerEmail.indexOf("@");
    if (at >= 0 && at < c.customerEmail.length - 1) {
      return c.customerEmail.slice(at + 1);
    }
    return c.customerEmail;
  }
  return "(unknown)";
}

export function SupplierAppSidebar({
  user,
  customers,
}: SupplierAppSidebarProps) {
  const pathname = usePathname();
  // `usePathname()` returns the route template (e.g.
  // `/portal/supplier/customers/[relationshipId]/assets`), so per-customer
  // active-state compares the resolved param, not concrete URL strings.
  const params = useParams<{ relationshipId?: string }>();

  // Active customers only — revoked/bounced rows still exist for audit but
  // shouldn't clutter the sidebar.
  const visibleCustomers = customers.filter((c) => c.status !== "revoked");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <PortalSwitcher current="supplier" />
      </SidebarHeader>

      <SidebarContent>
        {/* ── General group ── */}
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {GENERAL_NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link href={item.href as never} prefetch={false}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Customers group ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Customers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleCustomers.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Add customer">
                    <Link href="/portal/supplier/customers" prefetch={false}>
                      <Plus className="h-4 w-4" />
                      <span>Add customer</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <>
                  {visibleCustomers.map((c) => {
                    const isActive = params.relationshipId === c.id;
                    return (
                      <SidebarMenuItem key={c.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={customerLabel(c)}
                        >
                          <Link
                            href={{
                              pathname: "/portal/supplier/customers/[relationshipId]/assets",
                              params: { relationshipId: c.id },
                            }}
                            prefetch={false}
                          >
                            <Users className="h-4 w-4" />
                            <span className="truncate">{customerLabel(c)}</span>
                          </Link>
                        </SidebarMenuButton>
                        {isActive && (
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === "/portal/supplier/customers/[relationshipId]/assets"}
                              >
                                <Link
                                  href={{
                                    pathname: "/portal/supplier/customers/[relationshipId]/assets",
                                    params: { relationshipId: c.id },
                                  }}
                                  prefetch={false}
                                >
                                  <Server className="h-3.5 w-3.5" />
                                  <span>Assets</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === "/portal/supplier/customers/[relationshipId]/incidents"}
                              >
                                <Link
                                  href={{
                                    pathname: "/portal/supplier/customers/[relationshipId]/incidents",
                                    params: { relationshipId: c.id },
                                  }}
                                  prefetch={false}
                                >
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>Incidents</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === "/portal/supplier/customers/[relationshipId]/access"}
                              >
                                <Link
                                  href={{
                                    pathname: "/portal/supplier/customers/[relationshipId]/access",
                                    params: { relationshipId: c.id },
                                  }}
                                  prefetch={false}
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                  <span>Access</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Add customer">
                      <Link href="/portal/supplier/customers" prefetch={false}>
                        <Plus className="h-4 w-4" />
                        <span>Add customer</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserNav user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
