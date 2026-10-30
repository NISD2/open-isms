"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

/**
 * What setting up shows once: the QR code and key for the app, and the recovery codes. The sign-in's
 * setup step reads it from a plain fetch, so this checks the answer before anything shows it.
 */
export const setupMaterialSchema = z
  .object({
    secret: z.string().min(1),
    qrDataUrl: z.string().startsWith("data:image/"),
    recoveryCodes: z.array(z.string().min(1)).min(1).readonly(),
  })
  .readonly();
export type SetupMaterial = z.infer<typeof setupMaterialSchema>;

/** The QR code to scan, with the key to type behind a disclosure for when scanning fails. */
export function AppQrCode({ material }: { material: SetupMaterial }) {
  const t = useTranslations("auth.twoFactor");
  return (
    <div className="space-y-2">
      {/* A data URL made on the server from the otpauth address; nothing to optimise. */}
      {/* biome-ignore lint/performance/noImgElement: an inline SVG data URL, not a remote image */}
      <img
        src={material.qrDataUrl}
        alt={t("setupQrAlt")}
        width={176}
        height={176}
        className="mx-auto size-44 rounded-md border bg-white p-2"
      />
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          {t("setupManual")}
        </summary>
        <p className="mt-2 break-all rounded-md bg-muted px-3 py-2 text-center font-mono text-sm tracking-wider select-all">
          {material.secret}
        </p>
      </details>
    </div>
  );
}

/** The ten recovery codes, shown once, with one button that copies them all. */
export function RecoveryCodes({ codes }: { codes: readonly string[] }) {
  const t = useTranslations("auth.twoFactor");
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border bg-muted/40 px-4 py-3 font-mono text-sm tabular-nums">
        {codes.map((code) => (
          <li key={code} className="select-all">
            {code}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(codes.join("\n"));
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? t("copied") : t("copyCodes")}
      </Button>
    </div>
  );
}
