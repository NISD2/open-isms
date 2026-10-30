import { Server } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown on /supplier-invite/[token] when no invite here carries the token. Mostly a self-hosted
 * install sent it: its link forwards to nisd2.eu, but the invite and its message stay in that
 * install's database. The supplier can still answer here and share the answers with whoever asked.
 * The portal sends an account without a company through supplier onboarding first.
 */
export async function InviteNotHere() {
  const t = await getTranslations("supplierInvite");
  return (
    <Card>
      <CardContent className="py-8 space-y-4 text-center">
        <Server className="h-10 w-10 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-semibold">{t("notHereTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("notHereBody")}</p>
        <p className="text-sm text-muted-foreground">{t("notHereNext")}</p>
        <Button asChild>
          <a href="/portal/supplier/customers">{t("notHereContinue")}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
