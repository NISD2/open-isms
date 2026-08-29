import { ImageResponse } from "next/og";
import { DOCS_ENTRIES, findEntry } from "@/lib/docs/toc";

/**
 * A card per documentation page, generated at build time.
 *
 * The site's other Open Graph images come from the og-shot pipeline, which
 * screenshots real routes and stores the result in lib/og-cards.json. That is
 * right for marketing pages, where the picture is the page. It is wrong here:
 * a screenshot of a wall of prose is unreadable at 1200x630, and every one of
 * these pages would look identical in a link preview.
 *
 * So the card is drawn instead, from the same fields as the <title>: section,
 * headline, one line of description. Someone pasting a link into Slack sees
 * which page it is.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return DOCS_ENTRIES.map((entry) => ({
    section: entry.section.slug,
    page: entry.page.slug,
  }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ section: string; page: string }>;
}) {
  const { section: sectionSlug, page: pageSlug } = await params;
  const entry = findEntry(`${sectionSlug}/${pageSlug}`);

  const section = entry?.section.title ?? "Documentation";
  const title = entry?.page.seoTitle ?? "open-isms documentation";
  const description = entry?.page.description ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#3c6e71",
              fontWeight: 700,
            }}
          >
            {section}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 66,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              color: "#1f1f1f",
              fontWeight: 700,
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: 28, width: 88, height: 5, background: "#284b63" }} />
          <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.4, color: "#6b6b6b" }}>
            {description}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#284b63",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              o
            </div>
            <div style={{ marginLeft: 18, fontSize: 30, fontWeight: 600, color: "#1f1f1f" }}>
              open-isms
            </div>
          </div>
          <div style={{ fontSize: 26, color: "#9a9a9a" }}>nisd2.eu/docs</div>
        </div>
      </div>
    ),
    size,
  );
}
