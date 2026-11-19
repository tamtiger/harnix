import { makeSymbol } from "./outline-helpers.js";
import type { RepoMapSymbolOutlineV1 } from "./types.js";

const secretValue = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;

/** Headings of a Markdown file as symbols, each spanning to the next heading of the same or a higher level. */
export function extractMarkdownSymbols(lines: readonly string[]): RepoMapSymbolOutlineV1[] {
  const headings: Array<{ level: number; line: number; name: string; raw: string }> = [];
  let inFence = false;
  let lastContent = 1;
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = (lines[i] ?? "").trim();
    if (trimmed.length > 0) lastContent = i + 1;
    if (/^(?:```|~~~)/u.test(trimmed)) inFence = !inFence;
    else if (!inFence && !secretValue.test(trimmed)) {
      const match = /^(#{1,6})\s+(.{1,240})$/u.exec(trimmed);
      if (match) headings.push({ level: match[1]!.length, line: i + 1, name: match[2]!.trim(), raw: trimmed });
    }
  }
  return headings.map((h, idx) => {
    const nextPeer = headings.slice(idx + 1).find((c) => c.level <= h.level);
    return makeSymbol([
      h.name,
      "heading",
      true,
      h.line,
      nextPeer ? Math.max(h.line, nextPeer.line - 1) : Math.max(h.line, lastContent),
      h.raw,
    ]);
  });
}
