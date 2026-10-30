"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppQrCode, RecoveryCodes, type SetupMaterial } from "./TwoFactorMaterial";
import { type CodeSignInResult, signInWithCode } from "./two-factor-sign-in";

type Load =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly material: SetupMaterial }
  | { readonly kind: "failed" };

/**
 * The sign-in's setup step, for someone who must use a code (their company requires it, or they
 * run the platform) and has no app set up yet: scan, save the recovery codes, type the first
 * code. That code confirms the setup and signs them in, in one request.
 */
export function TwoFactorSetupStep({
  email,
  password,
  callbackUrl,
  onBack,
}: {
  email: string;
  password: string;
  callbackUrl: string;
  onBack: () => void;
}) {
  const t = useTranslations("auth.twoFactor");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // One setup per step. Each request makes a new secret and replaces the pending one, so a second
  // request (React runs effects twice in development) would leave a QR code on screen whose
  // secret the server no longer holds, and every code from it would be refused.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/api/auth/two-factor/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        setLoad({ kind: "ready", material: (await res.json()) as SetupMaterial });
      })
      .catch(() => setLoad({ kind: "failed" }));
  }, [email, password]);

  const messages: Record<Exclude<CodeSignInResult, "ok">, string> = {
    invalid: t("errorInvalid"),
    rateLimited: tAuth("errorRateLimited"),
    unreadable: t("errorUnreadable"),
    setupRequired: t("errorInvalid"),
    codeRequired: t("errorInvalid"),
    locked: t("errorLocked"),
    failed: tAuth("errorGeneric"),
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInWithCode(email, password, code);
      if (result === "ok") {
        router.push(callbackUrl);
        return;
      }
      setError(messages[result]);
    } catch {
      setError(tAuth("errorGeneric"));
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-balance">{t("setupTitle")}</CardTitle>
        <CardDescription>{t("setupDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {load.kind === "loading" && (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {load.kind === "failed" && (
          <p className="text-sm text-destructive" role="alert">
            {t("setupError")}
          </p>
        )}
        {load.kind === "ready" && (
          <ol className="space-y-5 text-sm">
            <li className="space-y-3">
              <p>
                <span className="font-medium tabular-nums">1. </span>
                {t("setupScan")}
              </p>
              <AppQrCode material={load.material} />
            </li>
            <li className="space-y-3">
              <p>
                <span className="font-medium tabular-nums">2. </span>
                {t("setupSave")}
              </p>
              <RecoveryCodes codes={load.material.recoveryCodes} />
            </li>
            <li className="space-y-3">
              <p>
                <span className="font-medium tabular-nums">3. </span>
                {t("setupConfirm")}
              </p>
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="setup-code" className="sr-only">
                    {t("codeLabel")}
                  </Label>
                  <Input
                    id="setup-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    className="font-mono tracking-widest text-center text-lg"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("setupSubmit")}
                </Button>
              </form>
            </li>
          </ol>
        )}
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          {t("back")}
        </button>
      </CardContent>
    </Card>
  );
}
