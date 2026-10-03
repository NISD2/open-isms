"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser's print window, where the page is saved as a PDF. Not printed itself. */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
