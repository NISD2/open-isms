import { z } from "zod";
import { ACTIVITY_CATALOG } from "./catalog";

/**
 * The catalogue's words, parsed: each activity's name and the answers the walk suggests for it,
 * stored in messages/durchgang under `activities.<id>`. The one reader of that layout, for the
 * screens, the server and the tests, so a missing or misshapen entry fails a test instead of
 * showing up empty on a customer's screen.
 */

const text = z.string().trim().min(1);

const ACTIVITY_COPY = z.object({
  label: text,
  purpose: text,
  dataSubjects: text,
  dataCategories: text,
  recipients: text,
  retention: text,
  /**
   * The interest pursued, for an activity whose usual bases include legitimate interests
   * (`ACTIVITY_CATALOG[].bases`); a test checks each such activity has one.
   */
  legitimateInterests: text.optional(),
});

export type ActivityCopy = z.infer<typeof ACTIVITY_COPY>;

const NAMESPACE = z.object({ activities: z.record(z.string(), z.unknown()) });

/**
 * Every catalogue activity's words in one language, by id, from the parsed `durchgang` namespace.
 * An entry that is missing or misshapen is left out (`errors` names it), so a caller shows the
 * name it has rather than nothing.
 */
export function activityCopyOf(namespace: unknown): {
  readonly copy: ReadonlyMap<string, ActivityCopy>;
  readonly errors: readonly string[];
} {
  const parsed = NAMESPACE.safeParse(namespace);
  const entries = parsed.success ? parsed.data.activities : {};
  const results = ACTIVITY_CATALOG.map(({ id }) => ({
    id,
    result: ACTIVITY_COPY.safeParse(entries[id]),
  }));
  return {
    copy: new Map(
      results.flatMap(({ id, result }) => (result.success ? [[id, result.data]] : [])),
    ),
    errors: results.flatMap(({ id, result }) =>
      result.success
        ? []
        : [`activities.${id}: ${result.error.issues[0]?.message ?? "invalid"}`],
    ),
  };
}
