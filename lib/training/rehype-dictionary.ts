/**
 * Rehype plugin that converts [[term]] wiki-link syntax in HTML
 * into annotated <span> elements with dictionary definitions.
 *
 * Input:  <p>Your [[CISO]] calls this a [[risk matrix]].</p>
 * Output: <p>Your <span class="term" data-term="ciso" data-definition="Chief Information...">CISO</span>
 *         calls this a <span class="term" data-term="risk-matrix" data-definition="The grid...">risk matrix</span>.</p>
 *
 * The plugin does NOT scan the full text for terms. It only processes
 * explicitly marked [[term]] patterns. The dictionary Map lookup is O(1).
 */

import type { Root, Text, Element } from "hast";

interface DictionaryPluginOptions {
  /** Map of lowercase term → definition string (already locale-resolved) */
  terms: Map<string, { definition: string; type: string }>;
}

/** Regex to split text on [[...]] markers */
const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

function slugify(term: string): string {
  return term.toLowerCase().replace(/\s+/g, "-");
}

export function rehypeDictionary(options: DictionaryPluginOptions) {
  const { terms } = options;

  return (tree: Root) => {
    visitTextNodes(tree, (textNode, parent, index) => {
      const text = textNode.value;
      if (!text.includes("[[")) return;

      const parts: (Text | Element)[] = [];
      let lastIndex = 0;

      for (const match of text.matchAll(WIKI_LINK_RE)) {
        const fullMatch = match[0];
        const rawCapture = match[1];
        const matchIndex = match.index ?? 0;

        // Support [[term|display]] pipe syntax
        const pipeIndex = rawCapture.indexOf("|");
        const lookupTerm = pipeIndex !== -1 ? rawCapture.slice(0, pipeIndex) : rawCapture;
        const displayText = pipeIndex !== -1 ? rawCapture.slice(pipeIndex + 1) : rawCapture;

        // Text before the match
        if (matchIndex > lastIndex) {
          parts.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
        }

        // Look up the term (case-insensitive)
        const slug = slugify(lookupTerm);
        const entry = terms.get(lookupTerm.toLowerCase()) ?? terms.get(slug);

        if (entry) {
          // Wrap in annotated <span>
          parts.push({
            type: "element",
            tagName: "span",
            properties: {
              className: ["term", `term--${entry.type}`],
              "data-term": slug,
              "data-definition": entry.definition,
            },
            children: [{ type: "text", value: displayText }],
          });
        } else {
          // Term not in dictionary — render as plain text (strip the [[ ]])
          parts.push({ type: "text", value: displayText });
        }

        lastIndex = matchIndex + fullMatch.length;
      }

      // Remaining text after last match
      if (lastIndex < text.length) {
        parts.push({ type: "text", value: text.slice(lastIndex) });
      }

      // Replace the original text node with the parts
      if (parts.length > 0 && parent && typeof index === "number") {
        parent.children.splice(index, 1, ...parts);
      }
    });
  };
}

/**
 * Walk text nodes in the HAST tree. Only visits text nodes inside
 * paragraph-level elements (p, li, td, blockquote) — skips headings,
 * links, code blocks, and pre elements.
 */
function visitTextNodes(
  node: Root | Element,
  visitor: (text: Text, parent: Element, index: number) => void,
) {
  const skipTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "a", "code", "pre"]);

  if ("tagName" in node && skipTags.has(node.tagName)) return;

  if ("children" in node) {
    // Iterate backwards because visitor may splice children
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i];
      if (child.type === "text" && "tagName" in node) {
        visitor(child as Text, node as Element, i);
      } else if (child.type === "element") {
        visitTextNodes(child, visitor);
      }
    }
  }
}
