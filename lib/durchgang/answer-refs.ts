import type { AnswerRef, AnyItem, AnyScreen } from "./types";

/** How an answer of another item is keyed where the item view carries it. */
export const refKey = (ref: AnswerRef): string => `${ref.code}:${ref.field}`;

/** Every answer of another item that an item's screens read: carried over or kept apart. */
export const answerRefsOf = (item: AnyItem): readonly AnswerRef[] => {
  const screens: readonly AnyScreen[] = item.screens;
  return screens.flatMap((screen) =>
    screen.kind === "fields"
      ? [...(screen.carry ? [screen.carry.from] : []), ...(screen.apart ?? [])]
      : [],
  );
};
