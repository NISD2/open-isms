"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface PolicyItemsTableProps {
  title: string;
  completionCount: number;
  totalCount: number;
  registerHref: string;
  children: React.ReactNode;
}

export function PolicyItemsTable({
  title,
  completionCount,
  totalCount,
  registerHref,
  children,
}: PolicyItemsTableProps) {
  const t = useTranslations("policyConfig.items");
  const pct = totalCount > 0 ? Math.round((completionCount / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">{t("noItems")}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href={registerHref as never}>
              {t("goToRegister")}
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href={registerHref as never}>
              {t("viewAll")}
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t("progress", { count: completionCount, total: totalCount })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded-lg overflow-hidden">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
