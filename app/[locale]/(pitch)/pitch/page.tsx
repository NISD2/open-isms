import { permanentRedirect } from "@/i18n/navigation";

/**
 * /pitch and its localized aliases (universal slug across locales) now
 * permanent-redirect to /about, which introduces the team and the mission.
 * The deck is no longer shown there.
 */
export default async function PitchRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect({ href: "/about", locale });
}
