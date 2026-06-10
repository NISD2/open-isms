export type GeminiSection = {
  timeMs: number;
  text: string; // full block text including all speaker turns
};

/**
 * Parses a Gemini Google Meet transcript.
 *
 * Actual format (timestamp on its own line, speakers on separate lines below):
 *   00:01:05
 *
 *   Cory Hisey: just gonna call him...
 *   Simon Orzel: Sure,
 *
 *   00:02:14
 *
 *   Simon Orzel: Yeah,
 *   ...
 */
export function parseGeminiTranscript(raw: string): GeminiSection[] {
  const lines = raw.split("\n");
  const sections: GeminiSection[] = [];

  // Matches a standalone timestamp line: HH:MM:SS or MM:SS (nothing else on the line)
  const standaloneTimestampRe = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

  let currentTimeMs: number | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentTimeMs !== null && currentLines.length > 0) {
      sections.push({ timeMs: currentTimeMs, text: currentLines.join(" ") });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const tsMatch = trimmed.match(standaloneTimestampRe);
    if (tsMatch) {
      flush();
      const [, a, b, c] = tsMatch;
      if (c !== undefined) {
        // HH:MM:SS
        currentTimeMs = (parseInt(a) * 3600 + parseInt(b) * 60 + parseInt(c)) * 1000;
      } else {
        // MM:SS
        currentTimeMs = (parseInt(a) * 60 + parseInt(b)) * 1000;
      }
    } else if (currentTimeMs !== null) {
      // Speaker line or continuation — collect it
      currentLines.push(trimmed);
    }
    // Lines before the first timestamp (title, date, etc.) are ignored
  }

  flush();
  return sections;
}

/**
 * Builds a prompt-ready transcript string with both human-readable
 * and millisecond timestamps so Grok can return accurate clipStartMs/clipEndMs.
 */
export function buildGrokTranscript(sections: GeminiSection[]): string {
  return sections
    .map((s) => {
      const m = Math.floor(s.timeMs / 60000);
      const sec = Math.floor((s.timeMs % 60000) / 1000);
      const display = `${m}:${sec.toString().padStart(2, "0")}`;
      return `[${display} = ${s.timeMs}ms]\n${s.text}`;
    })
    .join("\n\n");
}
