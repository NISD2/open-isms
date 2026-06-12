import { permanentRedirect } from "@/i18n/navigation";

/**
 * /pitch and its localized aliases (universal slug across locales) now
 * permanent-redirect to /about. The pitch deck slideshow lives there above
 * the team and mission sections.
 */
export default async function PitchRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect({ href: "/about", locale });
}
