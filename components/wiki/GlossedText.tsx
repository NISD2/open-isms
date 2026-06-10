import { Fragment } from "react";
import { glossText } from "@/lib/dictionary/matcher";
import type { Locale } from "@/lib/seo";

/**
 * Renders a string with dictionary terms auto-glossed: matched terms become
 * a <span class="term"> with data-term + data-definition attributes, which
 * the .wiki-content .term CSS in globals.css picks up for the dotted
 * underline + hover tooltip.
 *
 * Use for paragraph-level prose only. Headings, badges, buttons and code
 * should render their text raw (no GlossedText wrap).
 */
export function GlossedText({ text, locale }: { text: string; locale: Locale }) {
  const chunks = glossText(text, locale);
  return (
    <>
      {chunks.map((chunk, i) => {
        if (chunk.kind === "text") {
          return <Fragment key={i}>{chunk.value}</Fragment>;
        }
        return (
          <span
            key={i}
            className={`term term--${chunk.type}`}
            data-term={chunk.slug}
            data-definition={chunk.definition}
          >
            {chunk.value}
          </span>
        );
      })}
    </>
  );
}
