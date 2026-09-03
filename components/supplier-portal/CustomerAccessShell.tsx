"use client";

/**
 * Customer-facing shell for the token-gated /supplier-access/{token} page.
 *
 * Wraps the read-only SecurityProfilePage with a slim header (showing the
 * customer's email so they know who they're "logged in as") and a footer
 * with the Revoke access button. The bearer token is the only credential.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

export function CustomerAccessShell({
  children,
  token,
  customerEmail,
}: {
  children: React.ReactNode;
  token: string;
  customerEmail: string;
}) {
  const router = useRouter();
  const t = useTranslations("supplierPortal.customerView");
  const [revoked, setRevoked] = useState(false);

  const revoke = trpc.supplierPortal.public.revoke.useMutation({
    onSuccess: () => setRevoked(true),
  });

  if (revoked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h1 className="text-xl font-semibold">{t("revokedTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("revokedBody")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {t("sharedWith")} <strong>{customerEmail}</strong>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-testid="revoke-access"
            onClick={() => revoke.mutate({ token })}
            disabled={revoke.isPending}
          >
            {revoke.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <LogOut className="h-3 w-3 mr-1" />
                {t("revoke")}
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
