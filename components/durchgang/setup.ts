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
 * The steps of a walk. Setting the company up is one of them, right after the walk's
 * `setupAfter` (`withSetup`; a walk without one has no such step): open until the company is set
 * up, then filled in, and it stays on the path (Simon, 20.10.2026: it must not vanish once the
 * company is entered).
 */
export function useSteps(
  framework: WalkFramework,
  walk: readonly WalkEntry[],
  setup: boolean,
): readonly WalkEntry[] {
  const t = useTranslations("durchgang.ui.home");
  return withSetup(WALKS[framework], walk, {
    code: SETUP_STEP,
    section: t("setupSection"),
    headline: t("setupHeadline"),
    teaser: "",
    image: SETUP_ART,
    // No screen shows when setup was filled in; a fixed date keeps a render from inventing one.
    state: setup ? { kind: "open" } : { kind: "filled", since: new Date(0) },
  });
}
