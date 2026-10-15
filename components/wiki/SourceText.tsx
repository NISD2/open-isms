/**
 * An address inside a source line, without the punctuation that closes the sentence or a
 * parenthesis after it. Source lines are free text, so a pattern.
 */
const ADDRESS = /(https?:\/\/\S+?)(?=[.,;:)\]]*(?:\s|$))/u;

export type SourcePart =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "address"; readonly href: string };

/** A source line as its text and the addresses in it, in reading order. */
export const sourceParts = (line: string): readonly SourcePart[] =>
  // A capturing split alternates text and address, so every odd part is an address.
  line
    .split(ADDRESS)
    .map(
      (part, i): SourcePart =>
        i % 2 === 1 ? { kind: "address", href: part } : { kind: "text", text: part },
    )
    .filter((part) => part.kind === "address" || part.text !== "");

/**
 * One line of a page's sources, with each official address in it as a link: the Czech pages end
 * a source with its e-Sbírka, NÚKIB or EUR-Lex address. The text around an address stays text.
 * One span, so a flex list item keeps the line as one item beside its bullet.
 */
export function SourceText({ text }: { text: string }) {
  return (
    <span>
      {sourceParts(text).map((part) =>
        part.kind === "text" ? (
          part.text
        ) : (
          <a
            key={part.href}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline underline-offset-2 hover:text-foreground"
          >
            {part.href}
          </a>
        ),
      )}
    </span>
  );
}
