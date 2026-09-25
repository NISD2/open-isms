"use client";

import { Check, ChevronsUpDown, CircleX, Globe, LogOut, Shield } from "lucide-react";
import { useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { CancelDialog } from "@/components/billing/CancelDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, type LocaleCode } from "@/lib/locale";
import { trpc } from "@/lib/trpc/client";
import { getInitials } from "@/lib/utils";
import { OrganizationSubmenu } from "./OrganizationSubmenu";

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isPlatformAdmin?: boolean;
  };
}

export function UserNav({ user }: UserNavProps) {
  const t = useTranslations("portal");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { isMobile } = useSidebar();
  const tCancel = useTranslations("billing.cancel");
  const [cancelOpen, setCancelOpen] = useState(false);
  // Only the holder of a full account gets an option back. Without an open company (training or
  // supplier portal) the query fails quietly and there is simply no item.
  const billing = trpc.billing.status.useQuery(undefined, { retry: false });
  const cancelOption = billing.data?.cancel ?? null;

  function switchLocale(next: string) {
    if (next === locale) return;
    // `usePathname()` returns the route template (e.g.
    // `/training/courses/[courseId]/[lessonId]`); the dynamic segments are
    // filled from `params` so they survive the locale switch. Passing the bare
    // template without params leaves the `[..]` placeholders literal and
    // breaks every dynamic route (compliance requirements, course lessons).
    router.replace({ pathname, params } as Parameters<typeof router.replace>[0], {
      locale: next as LocaleCode,
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg" size="default">
                {user.image ? (
                  <AvatarImage
                    src={user.image}
                    alt={user.name ?? user.email ?? "User"}
                    className="rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.name ?? t("defaultUser")}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg" size="default">
                  {user.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? user.email ?? "User"}
                      className="rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.name ?? t("defaultUser")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <OrganizationSubmenu />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="mr-2 h-4 w-4" />
                {LOCALES.find((l) => l.code === locale)?.label ?? locale.toUpperCase()}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LOCALES.map((opt) => (
                  <DropdownMenuItem key={opt.code} onClick={() => switchLocale(opt.code)}>
                    {opt.label}
                    {locale === opt.code && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {user.isPlatformAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/platform-admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Platform Admin
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {cancelOption && (
              <DropdownMenuItem onSelect={() => setCancelOpen(true)}>
                <CircleX className="mr-2 h-4 w-4" />
                {tCancel("menuItem")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {cancelOption && (
          <CancelDialog
            option={cancelOption}
            open={cancelOpen}
            onOpenChange={setCancelOpen}
          />
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
