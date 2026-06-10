"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

type Step = "request" | "reset";

/**
 * Forgot-password flow:
 *   1. request — enter email, we send an OTP via /api/auth/forgot-password.
 *      Response is always 200 regardless of whether the email exists
 *      (user-enumeration resistance), so the UI just transitions.
 *   2. reset — enter OTP + new password, /api/auth/reset-password updates
 *      the hash and marks emailVerifiedAt. After success we sign the user
 *      in with the new password and route to the dashboard.
 *
 * Generic error messages everywhere — same shape regardless of whether
 * the email exists, the code is wrong, or the password is too short.
 */
export function ForgotPasswordCard() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      // Always advance — the API returns success regardless of whether
      // the email exists, so the UI does too.
      setStep("reset");
      setInfo(t("forgotPassword.codeSentInfo"));
    } catch {
      setError(t("errorGeneric"));
    }
    setLoading(false);
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? t("forgotPassword.errorResetFailed"));
        setLoading(false);
        return;
      }

      // Password is reset and the email is already proven owned (the
      // reset OTP was the gate). Sign the user in and land them on the
      // dashboard.
      const result = await signIn("credentials", {
        email,
        password: newPassword,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errorGeneric"));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError(t("errorGeneric"));
    }
    setLoading(false);
  }

  if (step === "request") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t("forgotPassword.title")}</CardTitle>
          <CardDescription>{t("forgotPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("forgotPassword.sendCode")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "reset") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t("forgotPassword.resetTitle")}</CardTitle>
          <CardDescription>
            {t("forgotPassword.resetDescription", { email })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">{t("verifyCodeLabel")}</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder={t("verifyCodePlaceholder")}
                required
                className="font-mono tracking-widest text-center text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">{t("forgotPassword.newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || code.length !== 6 || newPassword.length < 8}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("forgotPassword.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return null;
}
