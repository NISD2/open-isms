"use client";

import { Eye, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The screenshots are the walk's own screens at 1280×800 less the sidebar, and less the portal
 * header except for the sheet (shot 3), whose heading sits at the very top.
 */
const shotSize = (shot: number) =>
  shot === 3 ? { width: 1024, height: 800 } : { width: 1024, height: 752 };

/**
 * One promise of the walk on its front door, with a screenshot of how the walk keeps it: on hover
 * with a mouse, on a tap on touch, since a tooltip never opens on touch (Simon, 03.10.2026).
 * `shot` is the screenshot's number in `public/images/durchgang/promises/`, one per language.
 */
export function PromiseCard({
  icon: Icon,
  title,
  text,
  shot,
}: {
  icon: LucideIcon | undefined;
  title: string;
  text: string;
  shot: number;
}) {
  const t = useTranslations("durchgang.ui.intro");
  const locale = useLocale() === "de" ? "de" : "en";
  const [open, setOpen] = useState(false);
  return (
    <li>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
            className="flex h-full w-full cursor-pointer flex-col rounded-2xl border bg-card p-5 text-left shadow-xs transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {Icon && (
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                <Icon className="size-[1.125rem]" />
              </span>
            )}
            <span className="mt-3 font-semibold">{title}</span>
            <span className="mt-1 text-sm leading-6 text-muted-foreground">{text}</span>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-medium text-primary">
              <Eye className="size-3.5" />
              {t("example")}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-[min(36rem,calc(100vw-2rem))] overflow-hidden p-0"
        >
          <Image
            src={`/images/durchgang/promises/${locale}-${shot}.png`}
            alt={title}
            {...shotSize(shot)}
            sizes="36rem"
            className="h-auto w-full"
          />
        </PopoverContent>
      </Popover>
    </li>
  );
}
