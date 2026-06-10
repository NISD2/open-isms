"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";

interface LinkAssetsDialogProps {
  riskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Record<string, unknown>[];
}

export function LinkAssetsDialog({ riskId, open, onOpenChange, assets }: LinkAssetsDialogProps) {
  const t = useTranslations("risks");
  const [selectedAssetId, setSelectedAssetId] = useState("");

  const { data: linkedAssets, refetch } = trpc.risk.listAssets.useQuery(
    { riskId },
    { enabled: open },
  );

  const linkMut = trpc.risk.linkAsset.useMutation({
    onSuccess: () => {
      setSelectedAssetId("");
      refetch();
    },
  });

  const unlinkMut = trpc.risk.unlinkAsset.useMutation({
    onSuccess: () => refetch(),
  });

  const linkedAssetIds = new Set((linkedAssets ?? []).map((la) => la.assetId));

  const availableAssets = assets.filter(
    (a) => !linkedAssetIds.has(a.id as string),
  );

  function handleLink() {
    if (!selectedAssetId) return;
    linkMut.mutate({ riskId, assetId: selectedAssetId });
  }

  function handleUnlink(linkId: string) {
    unlinkMut.mutate({ id: linkId });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col gap-6 p-6">
        <SheetHeader className="p-0">
          <SheetTitle>{t("linkedAssets.title")}</SheetTitle>
        </SheetHeader>

        {/* Linked assets */}
        <div className="space-y-2">
          {linkedAssets && linkedAssets.length > 0 ? (
            linkedAssets.map((la) => (
                <div key={la.id} className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1.5">
                    {la.asset.name}
                    <button
                      type="button"
                      onClick={() => handleUnlink(la.id)}
                      className="ml-1 hover:text-destructive"
                      disabled={unlinkMut.isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("linkedAssets.empty")}</p>
          )}
        </div>

        {/* Link new asset */}
        {availableAssets.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t("linkedAssets.selectAsset")} />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.map((a) => (
                  <SelectItem key={a.id as string} value={a.id as string}>
                    {a.name as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleLink}
              disabled={!selectedAssetId || linkMut.isPending}
            >
              {linkMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("linkedAssets.link")
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
