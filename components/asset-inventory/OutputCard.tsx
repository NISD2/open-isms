"use client";

import { useTranslations } from "next-intl";

import type {
  AssetLayer,
  InformationsverbundOutput,
  InventoryAsset,
} from "@/lib/asset-inventory/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OutputCardProps {
  output: InformationsverbundOutput;
}

const LAYER_ORDER: Array<{
  layer: AssetLayer;
  bucket: keyof InformationsverbundOutput;
}> = [
  { layer: "geschaeftsprozess", bucket: "geschaeftsprozesse" },
  { layer: "anwendung", bucket: "anwendungen" },
  { layer: "it-system", bucket: "itSysteme" },
  { layer: "raum", bucket: "raeume" },
  { layer: "kommunikation", bucket: "kommunikationsverbindungen" },
];

export function OutputCard({ output }: OutputCardProps) {
  const t = useTranslations("assetInventory");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("output.heading")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("output.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {LAYER_ORDER.map(({ layer, bucket }) => {
          const assets = output[bucket];
          return (
            <LayerSection
              key={layer}
              layer={layer}
              heading={t(`layers.${layer}.label`)}
              description={t(`layers.${layer}.description`)}
              assets={assets}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

interface LayerSectionProps {
  layer: AssetLayer;
  heading: string;
  description: string;
  assets: InventoryAsset[];
}

function LayerSection({ heading, description, assets }: LayerSectionProps) {
  const t = useTranslations("assetInventory");

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {heading}
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {assets.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {assets.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">
          {t("output.empty")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="flex items-start gap-2 rounded-md border bg-card px-3 py-2 text-sm"
            >
              <Badge
                variant="outline"
                className="font-mono text-[10px] shrink-0 h-fit"
              >
                {asset.id}
              </Badge>
              <div className="flex-1">
                <div className="text-foreground">{asset.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t(`categories.${asset.category}`, {
                    defaultValue: asset.category,
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
