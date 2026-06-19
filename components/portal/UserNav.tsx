"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import {
  Check,
  ChevronsUpDown,
  Globe,
  LogOut,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { getInitials } from "@/lib/utils";
import { LOCALES, type LocaleCode } from "@/lib/locale";

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
  const { isMobile } = useSidebar();

  function switchLocale(next: string) {
    if (next === locale) return;
    router.replace(pathname as never, { locale: next as LocaleCode });
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
            {LOCALES.map((opt) => (
              <DropdownMenuItem key={opt.code} onClick={() => switchLocale(opt.code)}>
                <Globe className="mr-2 h-4 w-4" />
                {opt.label}
                {locale === opt.code && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
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
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
