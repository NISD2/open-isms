import { describe, expect, test } from "bun:test";
import { renderDocumentMarkdown, renderNewsletterMarkdown } from "./markdown";

const PAGE = "https://nisd2.eu/de/newsletter/some-issue";

/** Every href and src in the rendered HTML, read by an HTML parser as the browser would. */
async function urlsIn(html: string): Promise<string[]> {
  const urls: string[] = [];
  const collect = {
    element(el: HTMLRewriterTypes.Element) {
      for (const name of ["href", "src"]) {
        const value = el.getAttribute(name);
        if (value !== null) urls.push(value);
      }
    },
  };
  await new HTMLRewriter()
    .on("a", collect)
    .on("img", collect)
    .transform(new Response(html))
    .text();
  return urls;
}

describe("renderNewsletterMarkdown", () => {
  test("keeps http, https, mailto and relative links", async () => {
    const html = await renderNewsletterMarkdown(
      "[a](https://nisd2.eu/kurse) [b](http://example.test) [c](mailto:hallo@nisd2.eu) [d](/wiki) [e](#top) ![f](https://nisd2.eu/logo.png)",
    );
    expect(await urlsIn(html)).toEqual([
      "https://nisd2.eu/kurse",
      "http://example.test",
      "mailto:hallo@nisd2.eu",
      "/wiki",
      "#top",
      "https://nisd2.eu/logo.png",
    ]);
  });

  test("drops every other scheme, however it is spelled", async () => {
    const hostile = [
      "[x](javascript:alert(1))",
      "[x](JaVaScRiPt:alert(1))",
      "[x](<java\tscript:alert(1)>)",
      "[x](&#106;avascript:alert(1))",
      "[x](&#x6A;&#x61;vascript:alert(1))",
      "[x](<\u0001javascript:alert(1)>)",
      "[x](<  javascript:alert(1)>)",
      "[x](data:text/html,<script>alert(1)</script>)",
      "[x](vbscript:msgbox(1))",
      "[x](VBScript:msgbox(1))",
      "<javascript:alert(1)>",
      "[x]\n\n[x]: javascript:alert(1)",
      "![x](javascript:alert(1))",
      "![x](data:image/svg+xml,<svg onload=alert(1)>)",
    ];
    for (const markdown of hostile) {
      const urls = await urlsIn(await renderNewsletterMarkdown(markdown));
      for (const url of urls) {
        expect(["http:", "https:", "mailto:"]).toContain(new URL(url, PAGE).protocol);
      }
    }
  });

  test("keeps the link text when the target is dropped", async () => {
    const html = await renderNewsletterMarkdown("[Mehr lesen](javascript:alert(1))");
    expect(html).toContain("Mehr lesen");
    expect(await urlsIn(html)).toEqual([]);
  });
});

describe("renderDocumentMarkdown", () => {
  test("loads no image: it shows the alt text, or nothing", async () => {
    const html = await renderDocumentMarkdown(
      "Kontakt ![Logo](https://tracker.example/pixel.png) und ![](https://tracker.example/x.png)",
    );
    expect(await urlsIn(html)).toEqual([]);
    expect(html).toContain("Kontakt Logo und");
  });

  test("shows the address of a link whose text says something else", async () => {
    const html = await renderDocumentMarkdown(
      "[BSI-Portal](https://elsewhere.example/login)",
    );
    expect(html).toContain("BSI-Portal (https://elsewhere.example/login)");
    expect(await urlsIn(html)).toEqual(["https://elsewhere.example/login"]);
  });

  test("leaves a written-out address as it is", async () => {
    const html = await renderDocumentMarkdown(
      "Meldungen an security@muster-gmbh.example oder https://portal.bsi.bund.de",
    );
    expect(html).not.toContain("(");
    expect(await urlsIn(html)).toEqual([
      "mailto:security@muster-gmbh.example",
      "https://portal.bsi.bund.de",
    ]);
  });

  test("keeps the newsletter rules on schemes", async () => {
    const html = await renderDocumentMarkdown("[Mehr lesen](javascript:alert(1))");
    expect(html).toContain("Mehr lesen");
    expect(await urlsIn(html)).toEqual([]);
  });
});
