import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { acsBadge, type Programme, programmes } from "@/lib/partners";

type PartnerLogoStripProps = {
  /**
   * "landing" prepends the ACS Teilnehmer badge and sends every logo to
   * `/partner`, so the strip reads as one claim about us rather than six
   * outbound links. "page" links each logo out to its own programme and leaves
   * ACS out, because `/partner` renders the unaltered full-colour badge in its
   * own block and would otherwise show it twice.
   */
  variant?: "landing" | "page";
};

/* Full-strength --primary at rest, lightening on hover. The lift is brightness
   rather than opacity: fading a fill toward the page lightens it on white but
   darkens it on the dark theme's near-black, so opacity would invert the effect
   between themes. brightness raises it in both. */
const LOGO_CLASS =
  "block w-auto max-w-[210px] bg-primary transition-[filter] duration-200 group-hover:brightness-125";

/**
 * Tints each logo to the brand blue by using it as a CSS mask over a solid
 * bg-primary fill, rather than an <img> under a filter. A filter chain can only
 * reach black via brightness(0); approximating a hue from there with
 * sepia/saturate/hue-rotate lands near the token rather than on it. Masking
 * paints --primary exactly, and follows it from #284b63 to #5a93b5 in dark mode
 * with no second rule.
 *
 * Every asset in the list already carries its silhouette in the alpha channel,
 * which is what the mask reads, so nothing needed re-exporting.
 *
 * The element is a span rather than an img, so the accessible name comes from
 * role and aria-label. aspectRatio against the definite height from heightClass
 * is what resolves the width.
 */
function PartnerLogo({ programme, alt }: { programme: Programme; alt: string }) {
  const mask = `url(${programme.logo}) center / contain no-repeat`;

  return (
    <span
      role="img"
      aria-label={alt}
      className={`${programme.heightClass} ${LOGO_CLASS}`}
      style={{
        aspectRatio: `${programme.logoWidth} / ${programme.logoHeight}`,
        WebkitMask: mask,
        mask,
      }}
    />
  );
}

export async function PartnerLogoStrip({ variant = "page" }: PartnerLogoStripProps) {
  const t = await getTranslations("info");
  const items: readonly Programme[] =
    variant === "landing" ? [acsBadge, ...programmes] : programmes;

  /* gap-x-10, not 12: the seven-logo landing row measures ~899px of artwork in a
     1152px container, so a 48px gap overflows by a hair and strands one logo on a
     second line. At 40px the full row fits on desktop and still wraps cleanly
     below that. */
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-8">
      {items.map((programme) =>
        variant === "landing" ? (
          <Link key={programme.name} href="/partner" className="group">
            <PartnerLogo
              programme={programme}
              alt={t(`partners.${programme.name}.title`)}
            />
          </Link>
        ) : (
          <a
            key={programme.name}
            href={programme.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <PartnerLogo
              programme={programme}
              alt={t(`partners.${programme.name}.title`)}
            />
          </a>
        ),
      )}
    </div>
  );
}
