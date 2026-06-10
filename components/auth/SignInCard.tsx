"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
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

type Step = "auth" | "verify";

export function SignInCard() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Audit H-3 (2026-06-10): only accept absolute-path local URLs. An
  // attacker-controlled absolute URL ("https://evil.tld") or protocol-
  // relative URL ("//evil.tld") would let router.push escape origin via
  // window.location.assign on the next nav and host a credible
  // re-login-phish on the genuine nisd2.eu chrome.
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard";
  const [step, setStep] = useState<Step>("auth");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const domain = email.includes("@") ? email.split("@")[1] : "";
  const isCompanyDomain = domain && !/(gmail|yahoo|hotmail|outlook|icloud|web\.de|gmx)\./i.test(domain);

  // Auth step (login or register). Register routes to verify step; login
  // routes either straight to callbackUrl or back here with an
  // EMAIL_NOT_VERIFIED error that nudges the user to the verify step.
  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!consent) {
          setError(t("errorConsentRequired"));
          setLoading(false);
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, locale }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? t("errorGeneric"));
          setLoading(false);
          return;
        }

        // Registration accepted → user has been emailed a code.
        setStep("verify");
        setLoading(false);
        return;
      }

      // Login mode. Email was already proven owned at registration;
      // authorize() just validates the password and lets the session through.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth forwards our thrown CredentialsSignin's code via
        // `result.code` and sets `result.error` to "CredentialsSignin". We
        // join both so EMAIL_NOT_VERIFIED is matched regardless of which
        // field carries it.
        const raw = `${result.error} ${result.code ?? ""}`;
        if (raw.includes("EMAIL_NOT_VERIFIED")) {
          setError(t("errorEmailNotVerified"));
          // Pre-stage the verify step so the user can immediately enter a
          // code without retyping their email. Trigger a fresh OTP resend
          // since the original code may have expired.
          setStep("verify");
          await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, locale }),
          }).catch(() => {});
        } else {
          setError(t("errorInvalid"));
        }
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
    } catch {
      setError(t("errorGeneric"));
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        setError(t("verifyErrorInvalidCode"));
        setLoading(false);
        return;
      }

      // Email verified — sign in with the password we already have.
      // No further OTP: registration-time verification was the gate.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errorGeneric"));
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
    } catch {
      setError(t("errorGeneric"));
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      if (res.status === 429) {
        setError(t("verifyResendCooldown"));
      } else {
        setInfo(t("verifyResent"));
      }
    } catch {
      setError(t("errorGeneric"));
    }
    setLoading(false);
  }

  if (step === "verify") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t("verifyTitle")}</CardTitle>
          <CardDescription>{t("verifyDescription", { email })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerifySubmit} className="space-y-3">
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

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || code.length !== 6}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t("verifyVerifying") : t("verifySubmit")}
            </Button>
          </form>

          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={handleResend}
            disabled={loading}
          >
            {t("verifyResend")}
          </button>

          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setStep("auth");
              setCode("");
              setError("");
              setInfo("");
            }}
          >
            {t("verifyBack")}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAuthSubmit} className="space-y-3">
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
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              {mode === "login" && (
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  {t("forgotPasswordLink")}
                </Link>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </div>

          {mode === "register" && isCompanyDomain && (
            <p className="text-sm text-muted-foreground">
              {t("orgDomain", { domain })}
            </p>
          )}

          {mode === "register" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
                required
              />
              <span>
                {t.rich("consentLabel", {
                  terms: (chunks) => (
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      {chunks}
                    </a>
                  ),
                  privacy: (chunks) => (
                    <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            </label>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || (mode === "register" && !consent)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? t("signIn") : t("register")}
          </Button>
        </form>

        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setInfo(""); }}
        >
          {mode === "login" ? t("switchToRegister") : t("switchToLogin")}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t("or")}</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          size="lg"
          disabled={mode === "register" && !consent}
          onClick={() => {
            // Same consent gate as the credentials path. Without it, users
            // could click "Sign in with Google" without ticking the box and
            // the auto-create-on-first-signin in lib/auth/config.ts would
            // create the account anyway — defeating the GDPR Art. 7 / UWG §7
            // requirement to obtain consent at the point of registration.
            if (mode === "register" && !consent) {
              setError(t("errorConsentRequired"));
              return;
            }
            signIn("google", { callbackUrl });
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t("signInGoogle")}
        </Button>
      </CardContent>
    </Card>
  );
}
