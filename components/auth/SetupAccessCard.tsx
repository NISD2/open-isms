"use client";

/**
 * The page an account setup link opens (lib/auth/setup-link.ts): the customer continues with
 * Google under the same address, or sets a first password and is signed in straight away.
 */
import { Loader2, Shield } from "lucide-react";
import { signIn } from "next-auth/react";
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

/** Where a freshly set up customer lands: their journey. */
const AFTER_SETUP = "/journey";

export function SetupAccessCard({
  token,
  email,
}: {
  readonly token: string;
  readonly email: string;
}) {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/setup-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    }).catch(() => null);
    const body: unknown = await res?.json().catch(() => null);
    const failed = !res?.ok;
    if (failed) {
      const message =
        typeof body === "object" && body && "error" in body ? String(body.error) : null;
      setError(message ?? t("errorGeneric"));
      setSaving(false);
      return;
    }
    const signedIn = await signIn("credentials", { email, password, redirect: false });
    if (signedIn?.error) {
      setError(t("errorGeneric"));
      setSaving(false);
      return;
    }
    window.location.assign(AFTER_SETUP);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Shield className="mx-auto h-8 w-8 text-primary" aria-hidden />
        <CardTitle>{t("setup.title")}</CardTitle>
        <CardDescription>{t("setup.description")}</CardDescription>
        <p className="font-medium text-sm">{t("setup.forEmail", { email })}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => signIn("google", { callbackUrl: AFTER_SETUP })}
        >
          {t("signInGoogle")}
        </Button>
        <p className="text-center text-muted-foreground text-xs">{t("or")}</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="setup-password">{t("setup.passwordLabel")}</Label>
            <Input
              id="setup-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("setup.passwordHint")}</p>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button
            type="submit"
            className="w-full"
            disabled={saving || password.length < 8}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {t("setup.submitting")}
              </>
            ) : (
              t("setup.submit")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
