#!/usr/bin/env bun
/**
 * Render a CV markdown file as a standalone PDF for IHK / AfA submission.
 *
 * Usage:
 *   bun run scripts/render-lebenslauf-pdf.ts                       # default Simon
 *   bun run scripts/render-lebenslauf-pdf.ts anhang-a2-lebenslauf-cory.md
 *
 * Output:
 *   business/plan/rendered/lebenslauf-{slug}.pdf
 *
 * Re-uses the BP rendering stack (remark/rehype + chromium) so the visual style
 * matches the rest of the submission packet.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();

async function main() {
  const planDir = resolve(ROOT, "business/plan/de");
  const outDir = resolve(ROOT, "business/plan/rendered");
  await mkdir(outDir, { recursive: true });

  const fileArg = process.argv[2] ?? "anhang-a1-lebenslauf.md";
  const slug = fileArg.includes("cory") ? "hisey" : "orzel";
  const headerName =
    slug === "hisey" ? "Lebenslauf · Cory Hisey" : "Lebenslauf · Simon Orzel";

  const md = await readFile(join(planDir, fileArg), "utf-8");

  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(md);

  const wrapped = wrapHtml(String(html), headerName);
  const tempHtml = join(outDir, `_temp_lebenslauf_${slug}.html`);
  await writeFile(tempHtml, wrapped, "utf-8");

  const browser = await chromium.launch({
    args: ["--allow-file-access-from-files"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`file://${tempHtml}`, { waitUntil: "networkidle" });

  const pdfPath = join(outDir, `lebenslauf-${slug}.pdf`);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    margin: { top: "20mm", right: "18mm", bottom: "18mm", left: "18mm" },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:8.5pt; width:100%; padding: 0 18mm; color:#666; font-family: -apple-system, sans-serif;">
        <span style="float:left;">${headerName}</span>
        <span style="float:right;">Kardashev Catalyst UG (haftungsbeschränkt)</span>
      </div>`,
    footerTemplate: `
      <div style="font-size:8.5pt; width:100%; text-align:center; color:#666; font-family: -apple-system, sans-serif;">
        Seite <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>`,
  });

  await browser.close();
  console.log(`Wrote ${pdfPath}`);
}

function wrapHtml(body: string, title: string): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 20mm 18mm 18mm 18mm; }
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
  line-height: 1.45;
  color: var(--body);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
h1 {
  font-family: "Inter Tight", "Inter", sans-serif;
  font-size: 22pt;
  font-weight: 700;
  color: var(--accent);
  margin: 0 0 4pt 0;
  padding-bottom: 6pt;
  border-bottom: 2px solid var(--accent);
  letter-spacing: -0.02em;
}
h2 {
  font-family: "Inter Tight", "Inter", sans-serif;
  font-size: 13pt;
  font-weight: 600;
  color: var(--ink);
  margin: 14pt 0 5pt 0;
  page-break-after: avoid;
}
h3 {
  font-family: "Inter Tight", "Inter", sans-serif;
  font-size: 11pt;
  font-weight: 600;
  color: var(--ink);
  margin: 10pt 0 4pt 0;
  page-break-after: avoid;
}
p { margin: 5pt 0; text-align: left; hyphens: auto; orphans: 3; widows: 3; }
ul, ol { margin: 5pt 0; padding-left: 17pt; }
li { margin: 2.5pt 0; }
em { font-style: italic; color: var(--muted); }
strong { font-weight: 600; color: var(--ink); }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 7pt 0 10pt 0;
  font-size: 9.8pt;
  page-break-inside: avoid;
  font-variant-numeric: tabular-nums;
}
thead { display: table-header-group; }
thead tr:has(th:empty:only-of-type),
thead tr:has(th:empty + th:empty) { display: none; }
th, td {
  border-bottom: 1px solid var(--rule);
  padding: 4.5pt 6.5pt;
  text-align: left;
  vertical-align: top;
  line-height: 1.35;
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
hr { border: none; border-top: 1px solid var(--rule); margin: 14pt 0; }
a { color: var(--accent); text-decoration: none; }
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
