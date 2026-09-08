"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { MODULE_HREF } from "@/lib/compliance/operational-links";

interface ModuleRefPanelProps {
  moduleRef: string;
  count: number;
  isCompleted: boolean;
  isConfirming?: boolean;
  onConfirm?: () => void;
}

export function ModuleRefPanel({
  moduleRef,
  count,
  isCompleted,
  isConfirming = false,
  onConfirm,
}: ModuleRefPanelProps) {
  const t = useTranslations("common");
  const href = MODULE_HREF[moduleRef];
  const hasData = count > 0;

  // An unmapped moduleRef used to return null here, which put an "Operational
  // data" heading above an empty space and no way to reach the register. A
  // missing route is a wiring gap, so say so rather than rendering nothing:
  // silence is the one outcome the reader cannot act on or report.
  if (!href) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t("moduleRef.noRoute", { module: moduleRef })}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{t(`modules.${moduleRef}`)}</span>
          <Badge variant={hasData ? "secondary" : "outline"}>
            {t("entries", { count })}
          </Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={href as never}>
            {t("open")} <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      {!isCompleted && hasData && onConfirm && (
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isConfirming}
          className="w-full"
        >
          {isConfirming ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle className="mr-1 h-3 w-3" />
          )}
          {t("moduleRef.confirmCompliance")}
        </Button>
      )}

      {!hasData && !isCompleted && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t("moduleRef.noRecords")}
        </p>
      )}
    </div>
  );
}
