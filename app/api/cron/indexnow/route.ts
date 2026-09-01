/**
 * Cron Job: IndexNow submission
 *
 * Pings the IndexNow endpoint with public URLs that changed recently.
 * One submission reaches Bing, Yandex, Seznam and Naver — they share the
 * IndexNow index. Google does not participate.
 *
 * Why this exists: 44% of search arrivals in the 30 days to 2026-08-31
 * came through Bing's index (Bing 281 visitors, plus DuckDuckGo 69,
 * Qwant 12, Ecosia 9, Brave 7, Yahoo 4 — all Bing-backed) against 502
 * from Google. The EU B2B norm is 10-15%. Nothing in the codebase was
 * addressing that index deliberately, and the country-status pages whose
 * whole value is being current are exactly the pages that benefit from
 * same-day recrawl.
 *
 * URL set is read back from our own /sitemap.xml rather than rebuilt
 * here, so the submitted set cannot drift from the indexed set. Only
 * URLs whose <lastmod> falls inside the window are sent — IndexNow is
 * for "this changed", not "here is my whole site". Pass ?all=1 for a
 * one-off full submission (after first setting the key, or a redesign).
 *
 * Security: Bearer token from CRON_SECRET env var.
 * Schedule: daily is plenty; the endpoint is idempotent.
 */
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyCronBearer } from "@/lib/cron/auth";
import { getAppUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** Protocol cap per submission. Our sitemap is ~1.7k URLs, so this is headroom. */
const MAX_URLS = 10_000;
const DEFAULT_WINDOW_DAYS = 7;

interface SitemapUrl {
  loc: string;
  lastmod: string | null;
}

/**
 * Pull <loc>/<lastmod> pairs out of our own sitemap. Deliberately a
 * regex and not an XML parser: this is our own generated, well-formed
 * document, and the alternate-language links are `xhtml:link` elements
 * carrying href *attributes*, so a <loc> match cannot pick them up.
 */
function parseSitemap(xml: string): SitemapUrl[] {
  const out: SitemapUrl[] = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of blocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null;
    out.push({ loc: loc.trim(), lastmod: lastmod?.trim() ?? null });
  }
  return out;
}

export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (!verifyCronBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = env.INDEXNOW_KEY;
  if (!key) {
    // Not an error: a self-hosted instance is expected to run without one.
    return NextResponse.json(
      { skipped: "INDEXNOW_KEY not configured", submitted: 0 },
      { status: 200 },
    );
  }

  const appUrl = getAppUrl();
  const host = new URL(appUrl).host;

  let urls: SitemapUrl[];
  try {
    const res = await fetch(`${appUrl}/sitemap.xml`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `sitemap fetch failed: ${res.status}` },
        { status: 502 },
      );
    }
    urls = parseSitemap(await res.text());
  } catch (err) {
    return NextResponse.json(
      { error: "sitemap fetch failed", detail: String(err) },
      { status: 502 },
    );
  }

  const submitAll = req.nextUrl.searchParams.get("all") === "1";
  const windowDays = Number(
    req.nextUrl.searchParams.get("days") ?? DEFAULT_WINDOW_DAYS,
  );
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;

  const selected = urls.filter((u) => {
    if (submitAll) return true;
    if (!u.lastmod) return false;
    const t = Date.parse(u.lastmod);
    return Number.isFinite(t) && t >= cutoff;
  });

  // Same-host only: IndexNow rejects a submission whose urlList contains
  // a URL outside the declared host, and rejects the whole batch with it.
  const urlList = selected
    .map((u) => u.loc)
    .filter((loc) => {
      try {
        return new URL(loc).host === host;
      } catch {
        return false;
      }
    })
    .slice(0, MAX_URLS);

  if (urlList.length === 0) {
    return NextResponse.json({
      submitted: 0,
      note: submitAll
        ? "sitemap returned no same-host URLs"
        : `nothing changed in the last ${windowDays} days`,
    });
  }

  const body = {
    host,
    key,
    keyLocation: `${appUrl}/api/indexnow-key`,
    urlList,
  };

  let status: number;
  let text: string;
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    status = res.status;
    text = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: "indexnow submission failed", detail: String(err) },
      { status: 502 },
    );
  }

  // 200 accepted, 202 accepted-pending-key-validation. Anything else is
  // surfaced verbatim so a bad key or host mismatch is visible in logs
  // rather than silently succeeding.
  const ok = status === 200 || status === 202;
  return NextResponse.json(
    {
      submitted: ok ? urlList.length : 0,
      indexnowStatus: status,
      indexnowBody: text.slice(0, 500),
      window: submitAll ? "all" : `${windowDays}d`,
      sitemapUrls: urls.length,
    },
    { status: ok ? 200 : 502 },
  );
}
