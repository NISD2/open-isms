"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CancelDialog, type CancelOption } from "./CancelDialog";

/** The cancel on /billing, for the account holder of a full account. */
export function CancelButton({ option }: { readonly option: CancelOption }) {
  const t = useTranslations("billing.cancel");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid="cancel-licence"
      >
        {t("button")}
      </Button>
      <CancelDialog option={option} open={open} onOpenChange={setOpen} />
    </>
  );
}
