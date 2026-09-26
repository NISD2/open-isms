/**
 * The numbered sections of a legal document (/terms, /avv), read from messages as data: a heading,
 * its paragraphs, and optionally one link. Kept as data so the German and English texts can differ
 * in length without the page changing, and so the page stays copyable (§ 312i Abs. 1 Nr. 4 BGB).
 */
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

/** Our own legal pages, linked through the locale router; anything else must be an https URL. */
const INTERNAL = ["/terms", "/avv", "/toms", "/subprozessoren", "/datenschutz"] as const;

const sectionSchema = z.object({
  heading: z.string(),
  paragraphs: z.array(z.string()),
  link: z
    .object({
      label: z.string(),
      href: z.union([z.enum(INTERNAL), z.url({ protocol: /^https$/ })]),
    })
    .optional(),
});

const linkClass = "font-medium text-foreground underline underline-offset-4";

const isInternal = (href: string): href is (typeof INTERNAL)[number] =>
  INTERNAL.some((p) => p === href);

export async function LegalSections({
  base,
  keys,
}: {
  /** The message path the sections live under, such as "agb.sections". */
  readonly base: string;
  readonly keys: readonly string[];
}) {
  const t = await getTranslations("info");
  return (
    <div className="space-y-8">
      {keys.map((key) => {
        const section = sectionSchema.parse(t.raw(`${base}.${key}`));
        return (
          <section key={key} id={key}>
            <Card>
              <CardHeader>
                <CardTitle>{section.heading}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground text-sm">
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {section.link ? (
                  <p>
                    {isInternal(section.link.href) ? (
                      <Link href={section.link.href} className={linkClass}>
                        {section.link.label}
                      </Link>
                    ) : (
                      <a href={section.link.href} className={linkClass} rel="noopener">
                        {section.link.label}
                      </a>
                    )}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
