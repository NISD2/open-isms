import { useTranslations } from "next-intl";
import {
  itemHref,
  SETUP_STEP,
  WALK_ROUTES,
  WALKS,
  type WalkFramework,
  withSetup,
} from "@/lib/durchgang";
import { SETUP_ART } from "./Art";
import type { WalkEntry } from "./view";

/** Where a step of a walk opens: setting up the company has a page of its own. */
export const hrefOf = (framework: WalkFramework, code: string) =>
  code === SETUP_STEP ? WALK_ROUTES[framework].setup : itemHref(framework, code);

/**
 * The steps of a walk. A company not set up yet (the draft every account gets at sign-up) walks
 * one step more, setting itself up, right after the walk's `setupAfter` (`withSetup`).
 */
export function useSteps(
  framework: WalkFramework,
  walk: readonly WalkEntry[],
  setup: boolean,
): readonly WalkEntry[] {
  const t = useTranslations("durchgang.ui.home");
  if (!setup) return walk;
  return withSetup(WALKS[framework], walk, {
    code: SETUP_STEP,
    section: t("setupSection"),
    headline: t("setupHeadline"),
    teaser: "",
    image: SETUP_ART,
    state: { kind: "open" },
  });
}
