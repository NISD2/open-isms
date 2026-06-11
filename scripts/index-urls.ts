/**
 * Submit public NISD2.eu URLs to Google Indexing API.
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
 *   bun run index-urls
 */

import { GoogleAuth } from "google-auth-library";

const INDEXING_API = "https://indexing.googleapis.com/v3/urlNotifications:publish";

const SITE = "https://www.nisd2.eu";

/** All public routes (DE default = root, EN = /en/ prefix) */
const routes = [
  "",
  "what-is-nis2",
  "nis2-in-germany",
  "nis2-requirements",
  "features",
  "applicability",
  "geschaftsfuhrerhaftung",
  "it-grundschutz",
  "kosten",
  "umsetzung-mittelstand",
  "anforderungen-checkliste",
  "nis2-registrierung",
  "cir-2024-2690",
  "nis2-iso-27001",
  "nis2-meldepflicht",
  "nis2-umsetzung-europa",
  "nis2-registrierung-verpasst",
  "nis2-vs-kritis",
  "nis2-bussgelder",
  "glossar",
  "it-sicherheitspflicht",
  "bsig-30",
  "bsi-registrierung-anleitung",
  "nis2-was-tun",
  "nis2-europaeischer-standard",
  "nis2-lebensmittel",
  "nis2-produzierendes-gewerbe",
  "nis2-gesundheitswesen",
  "nis2-logistik",
  "nis2-abfallwirtschaft",
  "nis2-einrichtungen",
  "faq",
];

const urls = routes.flatMap((r) => {
  const path = r ? `/${r}` : "";
  return [`${SITE}${path}`, `${SITE}/en${path}`];
});

async function main() {
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
