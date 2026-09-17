import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { api } from "@/lib/trpc/server";

export const dynamic = "force-dynamic";

/**
 * The dominant-game scoreboard. Two numbers matter and both are strict:
 * discharged duties (five clauses, see the router docstring) and paid
 * referrals. Everything else on this page exists to explain those two or
 * to feed tomorrow's sends (the invite table is the 750-EUR mail-merge
 * source).
 */

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function d(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("de-DE");
}

export default async function MetricsPage() {
  await requirePlatformAdmin();
  const m = await api.platformAdmin.dominantMetrics();

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">Scoreboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Erledigte Pflichten (fünf Kriterien, eigene Firmen nicht gezählt) und
          bezahlte Vermittlungen. Referenz: 19.058 BSI-Registrierungen (31.07.2026).
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          label="Erledigte Pflichten"
          value={String(m.discharged.total)}
          sub={`davon letzte 30 Tage: ${m.discharged.last30}`}
        />
        <Tile
          label="Firmen mit mindestens einer"
          value={String(m.discharged.companiesWithAtLeastOne)}
          sub="von 19.058 registrierten Einrichtungen"
        />
        <Tile
          label="Bezahlte Vermittlungen"
          value={String(m.referrals.paidTotal)}
          sub={`${m.referrals.eurTotal.toFixed(2).replace(".", ",")} EUR gesamt`}
        />
        <Tile
          label="Lieferanten-Einladungen"
          value={`${m.invites.open} offen`}
          sub={`${m.invites.accepted} angenommen von ${m.invites.total}`}
        />
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Erledigte Pflichten je Firma</h2>
        {m.discharged.companies.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Noch keine. Das ist der ehrliche Stand, deshalb steht die Zahl hier.
          </p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">Firma</th>
                <th className="py-1 pr-2">Pflichten</th>
                <th className="py-1 pr-2">letzte 30 Tage</th>
                <th className="py-1">Hinweis</th>
              </tr>
            </thead>
            <tbody>
              {m.discharged.companies.map((r) => (
                <tr key={r.companyId} className="border-t">
                  <td className="py-1 pr-2">{r.companyName}</td>
                  <td className="py-1 pr-2 tabular-nums">{r.duties}</td>
                  <td className="py-1 pr-2 tabular-nums">{r.last30}</td>
                  <td className="py-1 text-xs text-muted-foreground">
                    {r.own ? "eigene Firma, nicht gezählt" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">
          Drop-off nach Anmeldemonat (Aktivitätsproxy: letzte Änderung an einer Anforderung)
        </h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-1 pr-2">Kohorte</th>
              <th className="py-1 pr-2">Firmen</th>
              <th className="py-1 pr-2">aktiv nach W1</th>
              <th className="py-1 pr-2">W2</th>
              <th className="py-1 pr-2">W4</th>
              <th className="py-1">W8</th>
            </tr>
          </thead>
          <tbody>
            {m.dropoff.map((r) => (
              <tr key={r.cohort} className="border-t">
                <td className="py-1 pr-2">{r.cohort}</td>
                <td className="py-1 pr-2 tabular-nums">{r.companies}</td>
                {r.active.map((a, i) => (
                  <td key={i} className="py-1 pr-2 tabular-nums">
                    {a}
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      ({r.companies ? Math.round((a / r.companies) * 100) : 0}%)
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">
          Lieferanten-Einladungen (Versandliste für das 750-EUR-Angebot)
        </h2>
        {m.invites.rows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Keine Einladungen vorhanden.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">Empfänger</th>
                <th className="py-1 pr-2">von</th>
                <th className="py-1 pr-2">eingeladen</th>
                <th className="py-1 pr-2">läuft ab</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {m.invites.rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 pr-2">{r.toEmail}</td>
                  <td className="py-1 pr-2">{r.fromCompany}</td>
                  <td className="py-1 pr-2">{d(r.createdAt)}</td>
                  <td className="py-1 pr-2">{d(r.expiresAt)}</td>
                  <td className="py-1">
                    {r.acceptedAt
                      ? `angenommen ${d(r.acceptedAt)}`
                      : new Date(r.expiresAt) > new Date()
                        ? "offen"
                        : "abgelaufen"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Absender (Käuferseite, Mom-Test-Liste)</h2>
        {m.senders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Noch keine Absender.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">Firma</th>
                <th className="py-1 pr-2">Inhaber</th>
                <th className="py-1 pr-2">Einladungen</th>
                <th className="py-1">angenommen</th>
              </tr>
            </thead>
            <tbody>
              {m.senders.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 pr-2">{r.company}</td>
                  <td className="py-1 pr-2">{r.ownerEmail}</td>
                  <td className="py-1 pr-2 tabular-nums">{r.invites}</td>
                  <td className="py-1 tabular-nums">{r.accepted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Bezahlte Vermittlungen je Woche</h2>
        {m.referrals.byWeek.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Noch keine. Die Zahl steht trotzdem hier, weil sie die Überlebensmetrik ist.
          </p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {m.referrals.byWeek.map((r) => (
              <li key={r.week} className="flex gap-3 tabular-nums">
                <span className="w-28">{r.week}</span>
                <span className="w-10">{r.count}</span>
                <span>{r.eur.toFixed(2).replace(".", ",")} EUR</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="text-xs text-muted-foreground">
        Zählregel für eine erledigte Pflicht: Unterzeichner vorhanden (nicht nur der Zeitstempel),
        Snapshot vorhanden, anwendbar, Eintrag in der Sign-off-Historie, mindestens ein Nachweis, der
        nicht Entwurf ist. Firmen von Plattform-Admins werden angezeigt, aber nicht gezählt.
      </footer>
    </main>
  );
}
