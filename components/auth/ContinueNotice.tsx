import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CallbackDestination } from "@/lib/auth/callback-destination";

/**
 * Where a sign-in leads, said above the card. Someone sent here by a protected link, an email or
 * an expired session otherwise meets a bare form that does not say why it appeared. Shows the
 * name of the destination, never its path (lib/auth/callback-destination.ts).
 */
export async function ContinueNotice({
  destination,
}: {
  destination: CallbackDestination | null;
}) {
  if (destination === null) return null;
  const t = await getTranslations("auth.continueTo");

  return (
    <section
      aria-label={t("heading")}
      className="mb-4 flex w-full max-w-sm items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm"
    >
      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-muted-foreground">
        {t("heading")}{" "}
        <span className="font-medium text-foreground">
          {t(`destination.${destination}`)}
        </span>
      </p>
    </section>
  );
}
