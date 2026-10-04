import { useTranslations } from "next-intl";
import { withSetup } from "@/lib/durchgang";
import { SETUP_ART } from "./Art";
import type { WalkEntry } from "./view";

/** Setting up the company, as a step of the walk. It has no item code, so it carries its own. */
export const SETUP_STEP = "unternehmen";

/** Where a step of the walk opens: setting up the company has a page of its own. */
export const hrefOf = (code: string) =>
  code === SETUP_STEP
    ? ("/durchgang/nis2/unternehmen" as const)
    : ({ pathname: "/durchgang/nis2/[code]", params: { code } } as const);

/**
 * The steps of the walk. A company not set up yet (the draft every account gets at sign-up) walks
 * one step more, setting itself up, right after the registration (`withSetup`).
 */
export function useSteps(
  walk: readonly WalkEntry[],
  setup: boolean,
): readonly WalkEntry[] {
  const t = useTranslations("durchgang.ui.home");
  if (!setup) return walk;
  return withSetup(walk, {
    code: SETUP_STEP,
    section: t("setupSection"),
    headline: t("setupHeadline"),
    teaser: "",
    image: SETUP_ART,
    state: { kind: "open" },
  });
}
