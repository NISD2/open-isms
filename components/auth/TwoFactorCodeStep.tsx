"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { type CodeSignInResult, signInWithCode } from "./two-factor-sign-in";

/** The sign-in's second step for someone whose app is set up: a code, or a recovery code. */
export function TwoFactorCodeStep({
  email,
  password,
  callbackUrl,
  contactEmail,
  onBack,
}: {
  email: string;
  password: string;
  callbackUrl: string;
  /** Where someone without phone and codes writes; an address a person reads. */
  contactEmail: string;
  onBack: () => void;
}) {
  const t = useTranslations("auth.twoFactor");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const messages: Record<Exclude<CodeSignInResult, "ok">, string> = {
    invalid: t("errorInvalid"),
    rateLimited: tAuth("errorRateLimited"),
    unreadable: t("errorUnreadable"),
    setupRequired: tAuth("errorGeneric"),
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
      // Paused or unreadable app codes leave the recovery code as the way in: show its field.
      if ((result === "locked" || result === "unreadable") && !recovery) {
        setRecovery(true);
        setCode("");
      }
      setError(messages[result]);
    } catch {
      setError(tAuth("errorGeneric"));
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-balance">
          {recovery ? t("recoveryTitle") : t("codeTitle")}
        </CardTitle>
        <CardDescription>
          {recovery ? t("recoveryDescription") : t("codeDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="totp-code">
              {recovery ? t("recoveryLabel") : t("codeLabel")}
            </Label>
            {recovery ? (
              <Input
                key="recovery"
                id="totp-code"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={20}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="xxxx-xxxx-xxxx"
                required
                autoFocus
                className="font-mono tracking-wider text-center text-lg"
              />
            ) : (
              <Input
                key="app"
                id="totp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                autoFocus
                className="font-mono tracking-widest text-center text-lg"
              />
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>
        </form>

        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setRecovery(!recovery);
            setCode("");
            setError("");
          }}
        >
          {recovery ? t("useApp") : t("useRecovery")}
        </button>

        {recovery && (
          <p className="text-center text-xs text-muted-foreground text-pretty">
            {t("noAccess", { email: contactEmail })}
          </p>
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
