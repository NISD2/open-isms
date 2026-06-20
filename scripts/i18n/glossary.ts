/**
 * Term-lock + legal-fidelity policy injected into every translation prompt.
 *
 * The "reviewer" for fr/it/es/pl legal nuance is the model itself (decision
 * 2026-06-19: Simon does not read those languages). So the fidelity rule is
 * made explicit and conservative: when a nuance is genuinely ambiguous,
 * choose the STRICTER reading. Under-stating a duty is a defect; a little
 * extra caution is not.
 */

/**
 * Tokens kept verbatim in every language — brands, regulation short-forms,
 * bodies, and the EU-wide terminology our voice rules keep as primary.
 */
export const DO_NOT_TRANSLATE: string[] = [
  // Product / brand
  "open-isms",
  "nisd2.eu",
  "sicherheitsfragebogen.de",
  // Regulations / frameworks — keep recognisable EU-wide
  "NIS2",
  "NIS 2",
  "NIS-2",
  "DORA",
  "CRA",
  "GDPR",
  "ISO 27001",
  "ISO/IEC 27001",
  "CIR",
  // Bodies / methodologies
  "BSI",
  "BSIG",
  "ENISA",
  "IT-Grundschutz",
  "Grundschutz",
  // EU-wide privacy/security terminology (kept as primary per voice rules)
  "RoPA",
  "DPA",
  "DPIA",
  "DPO",
  "TOMs",
];

/** The conservative legal-fidelity contract, embedded in every prompt. */
export const LEGAL_FIDELITY_POLICY = [
  "Legal-fidelity rules (NON-NEGOTIABLE):",
  "- Preserve every article number, paragraph marker (Art., §), Annex reference, threshold, monetary amount, percentage, deadline and date EXACTLY. Never localise, convert or round them.",
  "- Preserve modal strength. Obligations (must / shall / is required to) stay obligations; never weaken them to should / may / can. Never strengthen a genuine may into a must.",
  "- When a legal nuance is genuinely ambiguous between a looser and a stricter interpretation, choose the STRICTER (more conservative, more demanding) reading. Under-stating an obligation is a defect; mild over-caution is acceptable.",
  "- Do not invent or substitute national law. Where the source names German law (BSIG, IT-Grundschutz) as a transposition EXAMPLE, keep it as an example. Do not swap in the target country's law — national localisation is handled separately.",
  "- Keep the locked terms below verbatim (do not translate or inflect them).",
].join("\n");

/**
 * Structure rules — these protect the message files from breaking next-intl.
 */
export const STRUCTURE_RULES = [
  "Structure rules (NON-NEGOTIABLE):",
  "- Translate only the human-readable text. Never translate, add, remove or reorder placeholders.",
  "- Keep ICU placeholders byte-identical, including the braces and the argument name: {count}, {name}, {count, plural, ...}, {date, ...}. The set of placeholders in your output must match the input exactly.",
  "- Keep any HTML/rich-text tags (<b>, <link>, </link>) byte-identical.",
  "- Keep markdown markers, URLs, email addresses and code spans unchanged.",
  "- Return exactly one translation per input id, reusing the same id.",
].join("\n");

/**
 * Voice rules — humanise the output. Em-dashes and dash-heavy phrasing read as
 * machine-generated; our register (CISOs, lawyers, Geschäftsführer) wants plain
 * sentences. This applies to translations too: do NOT mirror the English
 * source's punctuation when it is dash-heavy.
 */
export const VOICE_RULES = [
  "Voice rules (humanise the translation):",
  "- No em-dashes (—) and no en-dashes (–) as sentence punctuation. The English source uses them heavily; do NOT carry them over. Recast with a period, comma, colon, or parentheses so the sentence reads naturally in the target language.",
  "- Use hyphens (-) sparingly: only inside genuine compound words the target language actually hyphenates. Prefer a single word or a short phrase over a hyphen chain.",
  "- Exception: keep hyphens that are part of a locked term or proper noun (NIS-2, IT-Grundschutz, ISO/IEC).",
  "- Plain register over ornate punctuation. Short sentences beat one long clause held together by dashes. No emojis.",
].join("\n");

export function glossaryPromptBlock(): string {
  return [
    LEGAL_FIDELITY_POLICY,
    "",
    STRUCTURE_RULES,
    "",
    VOICE_RULES,
    "",
    "Locked terms (verbatim):",
    DO_NOT_TRANSLATE.map((t) => `  - ${t}`).join("\n"),
  ].join("\n");
}
