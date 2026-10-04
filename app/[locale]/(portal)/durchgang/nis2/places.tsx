import { Footprints } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { mayWalkDurchgang } from "@/lib/billing/access";
import { WALK } from "@/lib/durchgang";
import { placesOf, type WalkRegister } from "@/lib/durchgang/places";
import { headlinesOf } from "./load";

/**
 * Above a register the walk writes into: the steps of the walk where it is filled, each a link to
 * that very screen (Simon, 03.10.2026). Only for a person who may walk it; anyone else would land on
 * the locked home.
 */
export async function WalkPlaces({ register }: { register: WalkRegister }) {
  const session = await getSession();
  if (!session) return null;
  const mayWalk = mayWalkDurchgang(
    session.accessLevel,
    isPlatformAdmin(session.user.email),
  );
  if (!mayWalk) return null;
  const places = placesOf(WALK, register);
  if (places.length === 0) return null;

  const [t, headlineOf] = await Promise.all([
    getTranslations("durchgang.ui.places"),
    headlinesOf(places.map((p) => p.code)),
  ]);

  return (
    <nav
      aria-label={t("label")}
      className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-primary/[0.06] px-4 py-3 text-sm"
    >
      <span className="mr-1 inline-flex items-center gap-2 font-medium text-primary">
        <Footprints className="size-4" />
        {t("label")}
      </span>
      {places.map(({ code, at }) => (
        <Link
          key={code}
          href={{
            pathname: "/durchgang/nis2/[code]",
            params: { code },
            query: { s: String(at) },
          }}
          className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="text-muted-foreground tabular-nums">{code}</span>
          {headlineOf.get(code) ?? code}
        </Link>
      ))}
    </nav>
  );
}
