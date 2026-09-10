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

const LOGO_CLASS =
  "w-auto max-w-[210px] object-contain opacity-60 brightness-0 transition-opacity group-hover:opacity-100 dark:invert";

function PartnerLogo({ programme, alt }: { programme: Programme; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: programme logos are arbitrary aspect ratios from a static list; next/image adds no value here
    <img
      src={programme.logo}
      alt={alt}
      width={programme.logoWidth}
      height={programme.logoHeight}
      className={`${programme.heightClass} ${LOGO_CLASS}`}
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
