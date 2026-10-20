import { useTranslations } from "next-intl";
import { SETUP_STEP, withSetup } from "@/lib/durchgang";
import { SETUP_ART } from "./Art";
import type { WalkEntry } from "./view";

/** Where a step of the walk opens: setting up the company has a page of its own. */
export const hrefOf = (code: string) =>
  code === SETUP_STEP
    ? ("/durchgang/nis2/unternehmen" as const)
    : ({ pathname: "/durchgang/nis2/[code]", params: { code } } as const);

/**
 * The steps of the walk. Setting the company up is one of them, right after the registration
 * (`withSetup`): open until the company is set up, then filled in, and it stays on the path
 * (Simon, 20.10.2026: it must not vanish once the company is entered).
 */
export function useSteps(
  walk: readonly WalkEntry[],
  setup: boolean,
): readonly WalkEntry[] {
  const t = useTranslations("durchgang.ui.home");
  return withSetup(walk, {
    code: SETUP_STEP,
    section: t("setupSection"),
    headline: t("setupHeadline"),
    teaser: "",
    image: SETUP_ART,
    // No screen shows when setup was filled in; a fixed date keeps a render from inventing one.
    state: setup ? { kind: "open" } : { kind: "filled", since: new Date(0) },
  });
}
