"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";

export function NotificationsPage({ items }: { items: Record<string, unknown>[] }) {
  const t = useTranslations("notifications");
  const router = useRouter();

  const acknowledgeMut = trpc.notification.acknowledge.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<Bell className="h-8 w-8 text-primary" />}
        title={t("title")}
        description={t("description")}
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.subject")}</TableHead>
                <TableHead>{t("fields.entityType")}</TableHead>
                <TableHead>{t("fields.scheduledFor")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id as string}>
                  <TableCell className="font-medium">
                    {item.subject as string}
                  </TableCell>
                  <TableCell>{item.entityType as string}</TableCell>
                  <TableCell>
                    {item.scheduledFor
                      ? new Date(item.scheduledFor as string).toLocaleDateString()
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {item.acknowledgedAt ? (
                      <Badge variant="default" className="bg-green-600 text-white">
                        {t("acknowledged")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {item.status as string}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!item.acknowledgedAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          acknowledgeMut.mutate({ id: item.id as string })
                        }
                        disabled={acknowledgeMut.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t("acknowledge")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
