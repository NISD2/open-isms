import { Fragment, cloneElement, isValidElement, type ReactNode } from "react";
import { GlossedText } from "./GlossedText";
import type { Locale } from "@/lib/seo";

/**
 * Recursive server-side walker that descends the React tree and wraps text
 * nodes inside prose containers with <GlossedText>. Applied once at the
 * wiki layout level so every wiki page gets dictionary tooltips without
 * any per-page wrapping.
 *
 * Rules:
 *   - Prose containers (p, li, blockquote, td, [data-slot="card-description"])
 *     enter "in prose" mode. Any descendant text gets glossed.
 *   - Hard skips (h1-h6, code, pre, a, kbd, [data-slot="badge"|"button"|"card-title"])
 *     are returned as-is; their text never glosses, no descent.
 *   - Everything else (div, section, Card, CardContent, span, ...) is
 *     traversed without changing the in-prose flag.
 *
 * Cost: O(node count), regex compiled once per locale via the matcher's
 * memo. ~1-5ms added to a typical wiki SSR pass.
 */
export function GlossedProse({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return <>{walk(children, locale, false)}</>;
}

const PROSE_TAGS = new Set(["p", "li", "blockquote", "td"]);
const HARD_SKIP_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "code",
  "pre",
  "a",
  "kbd",
  "samp",
  "script",
  "style",
  "textarea",
  "input",
]);
const PROSE_SLOTS = new Set(["card-description"]);
const HARD_SKIP_SLOTS = new Set([
  "badge",
  "button",
  "card-title",
  "alert-title",
  "tabs-trigger",
]);

function walk(node: ReactNode, locale: Locale, inProse: boolean): ReactNode {
  if (node === null || node === undefined || typeof node === "boolean") {
    return node;
  }
  if (typeof node === "string") {
    if (!inProse || node.trim().length === 0) return node;
    return <GlossedText text={node} locale={locale} />;
  }
  if (typeof node === "number") return node;
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <Fragment key={i}>{walk(child, locale, inProse)}</Fragment>
    ));
  }
  if (isValidElement(node)) {
    const element = node as React.ReactElement<{
      children?: ReactNode;
      "data-slot"?: string;
    }>;
    const type = element.type;
    const props = element.props;
    const dataSlot = typeof props["data-slot"] === "string" ? props["data-slot"] : null;

    if (typeof type === "string" && HARD_SKIP_TAGS.has(type)) return element;
    if (dataSlot && HARD_SKIP_SLOTS.has(dataSlot)) return element;

    const enterProse =
      (typeof type === "string" && PROSE_TAGS.has(type)) ||
      (dataSlot ? PROSE_SLOTS.has(dataSlot) : false);

    const nextInProse = inProse || enterProse;
    const newChildren = walk(props.children, locale, nextInProse);
    return cloneElement(element, undefined, newChildren);
  }
  return node;
}
