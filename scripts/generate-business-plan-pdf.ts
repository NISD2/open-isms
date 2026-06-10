#!/usr/bin/env bun
/**
 * Generate the business plan as PDF.
 *
 * Two variants:
 *   - "source": the full source-of-truth plan in business/plan/{locale}/
 *   - "ihk": the slimmed IHK-submission adapter in business/plan/ihk/{locale}/
 *
 * Usage:
 *   bun run scripts/generate-business-plan-pdf.ts en           # source (default)
 *   bun run scripts/generate-business-plan-pdf.ts de
 *   bun run scripts/generate-business-plan-pdf.ts en ihk       # IHK adapter
 *   bun run scripts/generate-business-plan-pdf.ts de ihk
 *
 * Output:
 *   business/plan/rendered/{variant}/{locale}/business-plan-{locale}.pdf
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();

async function main() {
  const locale = process.argv[2];
  const variant = (process.argv[3] ?? "source") as "source" | "ihk";
  if (locale !== "en" && locale !== "de") {
    console.error(
      "Usage: bun run scripts/generate-business-plan-pdf.ts {en|de} [source|ihk]"
    );
    process.exit(1);
  }
  if (variant !== "source" && variant !== "ihk") {
    console.error("Variant must be 'source' or 'ihk'");
    process.exit(1);
  }

  const planDir =
    variant === "ihk"
      ? resolve(ROOT, `business/plan/ihk/${locale}`)
      : resolve(ROOT, `business/plan/${locale}`);
  const outDir =
    variant === "ihk"
      ? resolve(ROOT, `business/plan/rendered/ihk/${locale}`)
      : resolve(ROOT, `business/plan/rendered/${locale}`);
  await mkdir(outDir, { recursive: true });

  const all = await readdir(planDir);
  const numbered = all.filter((f) => /^\d{2}-.*\.md$/.test(f)).sort();
  // IHK variant: CVs are submitted as separate documents (see scripts/render-lebenslauf-pdf.ts).
  // Source variant: CVs are appended to the BP for the integrated reading copy.
  const includeCvs = variant !== "ihk";
  const cv1 = includeCvs ? all.find((f) => f.startsWith("anhang-a1")) : undefined;
  const cv2 = includeCvs ? all.find((f) => f.startsWith("anhang-a2")) : undefined;
  const order = [...numbered, cv1, cv2].filter(Boolean) as string[];

  console.log(`Locale: ${locale}. Files in order:`);
  for (const f of order) console.log(`  ${f}`);

  const chapters: string[] = [];
  for (const file of order) {
    const md = await readFile(join(planDir, file), "utf-8");
    chapters.push(md);
  }
  const combined = chapters.join("\n\n");

  const visualsAbs = resolve(ROOT, "business/plan/visuals");
  const mdAbsolute = combined.replace(
    /\(\.\.\/visuals\//g,
    `(file://${visualsAbs}/`
  );

  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(mdAbsolute);

  const wrapped = wrapHtml(String(html), locale);
  const tempHtml = join(outDir, `_temp_${locale}.html`);
  await writeFile(tempHtml, wrapped, "utf-8");

  const browser = await chromium.launch({
    args: ["--allow-file-access-from-files"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`file://${tempHtml}`, { waitUntil: "networkidle" });

  const pdfPath = join(outDir, `business-plan-${locale}.pdf`);
  const docTitle =
    locale === "de"
      ? "Kardashev Catalyst UG · Businessplan"
      : "Kardashev Catalyst UG · Business Plan";

  await page.pdf({
    path: pdfPath,
    format: "A4",
    margin: { top: "22mm", right: "18mm", bottom: "20mm", left: "18mm" },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:8.5pt; width:100%; padding: 0 18mm; color:#666; font-family: -apple-system, sans-serif;">
        <span style="float:left;">${docTitle}</span>
        <span style="float:right;">${locale.toUpperCase()}</span>
      </div>`,
    footerTemplate: `
      <div style="font-size:8.5pt; width:100%; text-align:center; color:#666; font-family: -apple-system, sans-serif;">
        Seite <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>`,
  });

  await browser.close();
  console.log(`\nWrote ${pdfPath}`);
}

function wrapHtml(body: string, locale: string): string {
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>Businessplan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
@page {
  size: A4;
  margin: 22mm 20mm 20mm 20mm;
}
:root {
  --ink: #111418;
  --body: #1f2329;
  --muted: #5b6470;
  --rule: #e3e6ea;
  --rule-strong: #c5cad1;
  --soft: #f7f8fa;
  --soft-2: #eef1f4;
  --accent: #1d3a6e;
  --accent-soft: #e8edf6;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 10.5pt;
  line-height: 1.42;
  color: var(--body);
  font-feature-settings: "cv11", "ss01", "ss03";
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ===== Headings ===== */
h1, h2, h3, h4, h5, h6 {
  font-family: "Inter Tight", "Inter", sans-serif;
  color: var(--ink);
  letter-spacing: -0.01em;
}
h1 {
  font-size: 21pt;
  font-weight: 700;
  margin: 0 0 14pt 0;
  padding-bottom: 7pt;
  border-bottom: 2px solid var(--accent);
  color: var(--accent);
  letter-spacing: -0.02em;
  page-break-before: always;
  page-break-after: avoid;
  page-break-inside: avoid;
}
h1:first-of-type { page-break-before: avoid; }
h2 {
  font-size: 13pt;
  font-weight: 600;
  margin: 14pt 0 5pt 0;
  page-break-after: avoid;
}
h3 {
  font-size: 11pt;
  font-weight: 600;
  margin: 10pt 0 4pt 0;
  color: var(--ink);
  page-break-after: avoid;
}
h4 {
  font-size: 9pt;
  font-weight: 600;
  margin: 10pt 0 4pt 0;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  page-break-after: avoid;
}

/* ===== Body text ===== */
p {
  margin: 5pt 0;
  text-align: justify;
  hyphens: auto;
  orphans: 3;
  widows: 3;
}
ul, ol {
  margin: 5pt 0;
  padding-left: 17pt;
}
li {
  margin: 2.5pt 0;
}
li > p { margin: 2pt 0; }
em {
  font-style: italic;
  color: var(--muted);
}
strong {
  font-weight: 600;
  color: var(--ink);
}

/* ===== Code ===== */
code {
  font-family: "JetBrains Mono", "SF Mono", Monaco, Consolas, monospace;
  font-size: 8.8pt;
  background: var(--soft);
  padding: 1pt 4pt;
  border-radius: 3pt;
  color: var(--ink);
  font-variant-ligatures: none;
}
pre {
  background: var(--soft);
  border: 1px solid var(--rule);
  border-radius: 4pt;
  padding: 8pt 10pt;
  font-size: 8.8pt;
  line-height: 1.4;
  overflow: hidden;
  page-break-inside: avoid;
}
pre code { background: transparent; padding: 0; }

/* ===== Tables ===== */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 7pt 0 10pt 0;
  font-size: 9.8pt;
  page-break-inside: avoid;
  font-variant-numeric: tabular-nums;
}
thead { display: table-header-group; }
/* Hide empty table headers (cover-page key-value tables) */
thead tr:has(th:empty:only-of-type),
thead tr:has(th:empty + th:empty) { display: none; }
th, td {
  border-bottom: 1px solid var(--rule);
  padding: 4.5pt 6.5pt;
  text-align: left;
  vertical-align: top;
  line-height: 1.32;
}
thead th {
  background: var(--soft-2);
  font-weight: 600;
  color: var(--ink);
  border-bottom: 1.5px solid var(--rule-strong);
  text-transform: uppercase;
  font-size: 9pt;
  letter-spacing: 0.04em;
}
tbody tr:nth-child(even) td { background: var(--soft); }
table th[align="right"],
table td[align="right"] { text-align: right; font-variant-numeric: tabular-nums; }
table th[align="center"],
table td[align="center"] { text-align: center; }

/* ===== Figures ===== */
img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 10pt auto 4pt auto;
  page-break-inside: avoid;
  border-radius: 4pt;
}
/* Italic paragraph immediately after image = figure caption */
img + em,
p:has(> img) + p > em:only-child,
p > em {
  /* tighten the look of caption-style italics */
}
p > em:only-child {
  display: block;
  font-size: 8.8pt;
  color: var(--muted);
  text-align: left;
  margin: 0 0 14pt 0;
  line-height: 1.4;
  padding: 0 4pt;
  border-left: 2px solid var(--rule);
}

/* ===== Layout chrome ===== */
hr {
  border: none;
  border-top: 1px solid var(--rule);
  margin: 14pt 0;
}
blockquote {
  border-left: 3px solid var(--accent);
  padding: 6pt 12pt;
  color: var(--ink);
  margin: 10pt 0;
  background: var(--accent-soft);
  border-radius: 0 4pt 4pt 0;
}
a {
  color: var(--accent);
  text-decoration: none;
}

/* ===== Cover page ===== */
/* The very first H1 is "# Business Plan" / "# Businessplan" on cover */
body > h1:first-of-type {
  font-size: 44pt;
  text-align: center;
  margin: 70mm 0 18pt 0;
  border-bottom: none;
  padding-bottom: 0;
  letter-spacing: -0.03em;
  font-weight: 700;
  color: var(--ink);
}
/* The h2 right after cover h1 is the company name */
body > h1:first-of-type + h2 {
  font-size: 18pt;
  text-align: center;
  font-weight: 500;
  color: var(--accent);
  margin: 0 0 12pt 0;
  text-transform: none;
  letter-spacing: 0;
  border: none;
}
/* The h3 right after cover (subtitle) */
body > h1:first-of-type + h2 + h3 {
  font-size: 12pt;
  text-align: center;
  font-weight: 400;
  color: var(--muted);
  margin: 0 0 14pt 0;
  letter-spacing: 0;
}

/* ===== Misc safety ===== */
.page-break { page-break-before: always; }
h2 + p, h3 + p, h2 + ul, h3 + ul, h2 + table, h3 + table {
  page-break-before: avoid;
}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
