import { ScrollText } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { ExampleNote } from "@/components/shared/ExampleNote";
import { getSession, hasReviewAccess } from "@/lib/auth";
import { showsExamples } from "@/lib/billing/shows-examples";
import { api } from "@/lib/trpc/server";

/** Message files are data: example entries that do not parse show none rather than breaking. */
const EXAMPLE_ROWS = z
  .array(z.object({ action: z.string(), detail: z.string(), minutesAgo: z.number() }))
  .catch([]);

/**
 * Who changed what, and when. An account that has not ordered, and one with nothing logged yet,
 * sees example entries, marked as examples (Simon, 04.10.2026: "some kind of example items that
 * show the activity log actually works"), by a made-up person rather than the viewer, so nobody's
 * real name stands next to work they did not do.
 */
export default async function AuditPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (!hasReviewAccess(session.role)) {
    redirect("/dashboard");
  }

  const [t, tx, examplesOnly] = await Promise.all([
    getTranslations("audit"),
    getTranslations("portal.examples"),
    showsExamples(),
  ]);
  const rows = examplesOnly ? [] : await api.audit.list({ limit: 100, offset: 0 });
  const now = Date.now();
  const examples = EXAMPLE_ROWS.parse(tx.raw("auditRows")).map((row, i) => ({
    id: `example-${i}`,
    action: row.action,
    entityType: "example",
    entityId: null,
    description: row.detail,
    previousValue: null,
    newValue: null,
    userName: tx("person"),
    createdAt: new Date(now - row.minutesAgo * 60_000),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {rows.length > 0 ? (
        <AuditLogTable rows={rows} />
      ) : (
        <>
          <ExampleNote text={tx("audit")} order={examplesOnly} />
          <AuditLogTable rows={examples} />
        </>
      )}
    </div>
  );
}
