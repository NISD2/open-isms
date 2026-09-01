/**
 * Submit public NISD2.eu URLs to Google Indexing API.
 *
 * URLs are read from the live /sitemap.xml rather than a list kept here.
 * The previous hardcoded list had gone stale: it still named the
 * root-level slugs from before the /wiki migration (/what-is-nis2,
 * /nis2-in-germany, …), every one of which now 301s, and it only ever
 * covered de + en — missing the eight other locales entirely.
 *
 * The IndexNow counterpart is app/api/cron/indexnow/route.ts, which
 * reaches Bing/Yandex/Seznam/Naver and reads the same source. Google does
 * not participate in IndexNow, hence two mechanisms.
 *
 * Note: Google documents this API for JobPosting and BroadcastEvent
 * pages. Submitting other page types is tolerated but not guaranteed to
 * do anything — the sitemap remains the real signal for Google.
 *
 * Prerequisites:
 * 1. Create a Google Cloud project and enable the "Indexing API"
 * 2. Create a service account and download the JSON key file
 * 3. In Google Search Console, add the service account email as an Owner
 *    (Settings → Users and permissions → Add user → Owner)
 * 4. Place the key file at the project root as `google-service-account.json`
 *    or set GOOGLE_SERVICE_ACCOUNT_PATH env var
 *
 * Usage:
 *   bun run index-urls                 # everything in the sitemap
 *   bun run index-urls -- --days 7     # only URLs with lastmod in 7 days
 */

import { GoogleAuth } from "google-auth-library";

const INDEXING_API = "https://indexing.googleapis.com/v3/urlNotifications:publish";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nisd2.eu";

/**
 * Pull <loc>/<lastmod> out of our own sitemap. Our own generated,
 * well-formed document; the hreflang alternates are `xhtml:link`
 * elements carrying href *attributes*, so a <loc> match cannot catch them.
 */
async function sitemapUrls(): Promise<Array<{ loc: string; lastmod: string | null }>> {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) {
    throw new Error(`sitemap fetch failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const out: Array<{ loc: string; lastmod: string | null }> = [];
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    out.push({
      loc: loc.trim(),
      lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? null,
    });
  }
  return out;
}

async function main() {
  // `--days N` narrows to URLs whose sitemap <lastmod> is inside N days.
  const daysArg = process.argv.indexOf("--days");
  const days = daysArg > -1 ? Number(process.argv[daysArg + 1]) : null;

  const entries = await sitemapUrls();
  const cutoff =
    days && Number.isFinite(days) ? Date.now() - days * 86_400_000 : null;

  const urls = entries
    .filter((e) => {
      if (cutoff === null) return true;
      if (!e.lastmod) return false;
      const t = Date.parse(e.lastmod);
      return Number.isFinite(t) && t >= cutoff;
    })
    .map((e) => e.loc);

  if (urls.length === 0) {
    console.log(
      cutoff === null
        ? "Sitemap returned no URLs."
        : `No URLs changed in the last ${days} days.`,
    );
    process.exit(0);
  }

  const keyFile =
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH ?? "./google-service-account.json";

  const auth = new GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const client = await auth.getClient();

  console.log(`Submitting ${urls.length} URLs to Google Indexing API...\n`);

  let success = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      const res = await client.request({
        url: INDEXING_API,
        method: "POST",
        data: {
          url,
          type: "URL_UPDATED",
        },
      });

      const meta = (res.data as Record<string, unknown>).urlNotificationMetadata as
        | Record<string, unknown>
        | undefined;

      console.log(`  ✓ ${url}`);
      if (meta?.latestUpdate) {
        const update = meta.latestUpdate as Record<string, string>;
        console.log(`    notifyTime: ${update.notifyTime}`);
      }
      success++;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${url}`);
      console.log(`    ${message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} submitted, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
