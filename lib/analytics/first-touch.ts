import { campaignTags } from "@/lib/analytics/token-routes";

type Tags = Readonly<Record<string, string>>;

/**
 * The campaign tags of the first page a document showed, held in memory and nowhere else: no
 * cookie, no storage, gone with the next full page load. A client-side navigation drops the next
 * page's query, so without this a visitor who reads a second page before registering has lost the
 * tags of the link that brought them. `read` is the address bar's query, called once.
 */
export function createFirstTouch(read: () => string): () => Tags {
  let held: Tags | null = null;
  return () => {
    held ??= Object.fromEntries(campaignTags(read()));
    return held;
  };
}
