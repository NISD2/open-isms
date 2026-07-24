export type WalkthroughPlacement = "top" | "bottom" | "left" | "right";

export type WalkthroughStep = {
  /** Stable step id, used for keys/debugging only. */
  id: string;
  /** DOM element id this step points at. */
  targetId: string;
  /** i18n key (relative to the "walkthrough" namespace) for the step title. */
  titleKey: string;
  /** i18n key (relative to the "walkthrough" namespace) for the step body. */
  bodyKey: string;
  placement?: WalkthroughPlacement;
  /** If the target element isn't present, skip this step instead of blocking the tour. Defaults to true. */
  optional?: boolean;
};
