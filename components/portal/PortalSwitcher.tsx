"use client";

/**
 * Portal switcher — sits in the SidebarHeader of BOTH the entity portal and
 * the supplier portal. Lets the user jump between the two portals via a
 * shadcn dropdown.
 *
 * Same component, two callers. Each portal's sidebar passes its own `current`
 * value, and the dropdown highlights it. Clicking the OTHER portal navigates
 * to its root URL — Next.js handles the layout switch automatically because
 * the two portals live under different route segments.
 *
 * If the user is signed into a company that hasn't opted into one of the
 * roles yet (e.g. supplier-only company with actsAsNis2Entity=false), clicking
 * the unavailable portal still navigates — the destination's onboarding flow
 * handles the role-flag flip on first save.
 */
import { Link } from "@/i18n/navigation";
import { BookOpen, Check, ChevronsUpDown, Shield, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type PortalKey = "compliance" | "supplier" | "training";

interface PortalDef {
  key: PortalKey;
  name: string;
  tagline: string;
  href: string;
  Icon: typeof Shield;
}

const PORTALS: PortalDef[] = [
  {
    key: "compliance",
    name: "Compliance Portal",
    tagline: "NIS2 entity",
    href: "/dashboard",
    Icon: Shield,
  },
  {
    key: "supplier",
    name: "Supplier Portal",
    tagline: "Share security data",
    href: "/portal/supplier",
    Icon: ShieldCheck,
  },
  {
    key: "training",
    name: "Training Portal",
    tagline: "CEO & management courses",
    href: "/training/courses",
    Icon: BookOpen,
  },
];

export function PortalSwitcher({ current }: { current: PortalKey }) {
  const { isMobile } = useSidebar();
  const active = PORTALS.find((p) => p.key === current) ?? PORTALS[0];
  const ActiveIcon = active.Icon;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <ActiveIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{active.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  nisd2.eu
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch portal
            </DropdownMenuLabel>
            {PORTALS.map((p) => {
              const Icon = p.Icon;
              const isActive = p.key === current;
              return (
                <DropdownMenuItem key={p.key} asChild className="gap-2 p-2">
                  <Link href={p.href as never} prefetch={false}>
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.tagline}
                      </div>
                    </div>
                    {isActive && <Check className="size-4 ml-auto" />}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Use the supplier portal to share your security profile with
              customers. Use the compliance portal to assess your own NIS2
              obligations.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
