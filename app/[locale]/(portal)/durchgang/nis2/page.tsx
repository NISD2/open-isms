import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DurchgangHome } from "@/components/durchgang/DurchgangHome";
import { walkAccess } from "../gate";
import { loadWalk } from "./load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("durchgang");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The Durchgang's front door. An account that has not paid sees it locked once the walkthrough is
 * the portal's front: the same page, with the way to order in place of the way in.
 */
export default async function DurchgangHomePage() {
  const { mayWalk } = await walkAccess();
  const locked = !mayWalk;
  return <DurchgangHome walk={await loadWalk({ locked })} locked={locked} />;
}
