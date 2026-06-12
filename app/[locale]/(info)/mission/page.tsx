import { permanentRedirect } from "@/i18n/navigation";

/**
 * /mission permanent-redirects to /about. The slim mission section lives
 * there below the team cards.
 */
export default async function MissionRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect({ href: "/about", locale });
}
