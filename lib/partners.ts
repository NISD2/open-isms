/**
 * Programmes and incubators nisd2.eu takes part in, rendered on `/partner` and as
 * a logo strip on the landing page. One list so the two surfaces cannot drift.
 *
 * The ACS Teilnehmer badge is a separate export, see acsBadge below.
 *
 * heightClass is tuned per logo rather than shared: these lockups run from an
 * 8.9:1 wordmark to a 2.2:1 stacked mark, so a single height either drowns the
 * wide ones or shrinks the tall ones past legibility. The classes aim to land
 * every logo at a similar rendered width.
 */
export const programmes = [
  {
    name: "nvidia",
    logo: "/partners/nvidia-inception-program-badge.svg",
    logoWidth: 450,
    logoHeight: 165,
    heightClass: "h-12",
    href: "https://www.nvidia.com/en-us/startups/",
  },
  {
    name: "microsoft",
    logo: "/partners/microsoft-for-startups.png",
    logoWidth: 792,
    logoHeight: 89,
    heightClass: "h-5",
    href: "https://www.microsoft.com/en-us/startups",
  },
  {
    name: "google",
    logo: "/partners/google-for-startups.svg",
    logoWidth: 824,
    logoHeight: 100,
    heightClass: "h-5",
    href: "https://startup.google.com/",
  },
  {
    name: "lambda",
    logo: "/partners/lambda.svg",
    logoWidth: 196,
    logoHeight: 42,
    heightClass: "h-6",
    href: "https://lambda.ai/",
  },
  {
    name: "notion",
    logo: "/partners/notion-for-startups.svg",
    logoWidth: 512,
    logoHeight: 178,
    heightClass: "h-8",
    href: "https://www.notion.com/startups",
  },
  {
    name: "smartcityhouse",
    logo: "/partners/smartcityhouse-logo.png",
    logoWidth: 701,
    logoHeight: 317,
    heightClass: "h-11",
    href: "https://smartcityhouse.de/",
  },
] as const;

/**
 * The ACS Teilnehmer badge, for the landing-page strip only. `/partner` renders
 * the unaltered full-colour badge in its own block instead, so adding this to
 * `programmes` would show it twice there.
 *
 * It points at a purpose-built asset rather than the badge as supplied. The
 * original is four flat colours on an opaque white page; painted as a silhouette
 * it collapses into a filled rectangle with no lettering left. In
 * `acs-teilnehmer-mono.png` the white and the pale band behind "Teilnehmer" are
 * transparent, so the box, its knocked-out lettering and the emblem survive being
 * rendered in one colour.
 *
 * Placement note, decided by Simon on 11.09.2026 with the trade-off on the table:
 * the ACS Nutzungsbedingungen (Stand 01.09.2018) permit only the prescribed size
 * and colour (4)(b), require institution rather than product context (2), and
 * forbid use as advertising for our products (3). A flattened badge on the
 * landing page departs from all three, and (1) lets the ACS withdraw permission.
 */
export const acsBadge = {
  name: "acs",
  logo: "/partners/acs-teilnehmer-mono.png",
  logoWidth: 564,
  logoHeight: 218,
  heightClass: "h-12",
  href: "https://www.allianz-fuer-cybersicherheit.de",
} as const;

export type Programme = (typeof programmes)[number] | typeof acsBadge;
