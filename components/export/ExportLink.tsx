"use client";

import type { ReactNode } from "react";
import { useBillingAct } from "@/components/billing/BillingActGate";

/**
 * A download from the export page, or the page to print everything, that asks first where the
 * billing state says so (AGB B7, B10): inside the money back, or without an order. Otherwise an
 * ordinary link.
 */
export function ExportLink({
  href,
  download = false,
  className,
  children,
}: {
  href: string;
  download?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { blocks, guard, dialog } = useBillingAct("export");
  return (
    <>
      <a
        href={href}
        download={download || undefined}
        className={className}
        onClick={(e) => {
          if (!blocks) return;
          e.preventDefault();
          guard(() => window.location.assign(href));
        }}
      >
        {children}
      </a>
      {dialog}
    </>
  );
}
