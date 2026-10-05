import type { MarkerSelector } from "src/core/global/managed-files.js";
import { detectEol, withEol } from "src/core/global/toml-guard.js";

export function markersOverlap(left: MarkerSelector, right: MarkerSelector): boolean {
  return [left.begin, left.end].some((leftToken) =>
    [right.begin, right.end].some((rightToken) => markerTokensOverlap(leftToken, rightToken)),
  );
}

export function markerTokensOverlap(left: string, right: string): boolean {
  return left.includes(right) || right.includes(left);
}

export function renderManagedBlock(selector: MarkerSelector, content: string): string {
  const normalizedContent = content.replaceAll("\r\n", "\n").replace(/^\n+|\n+$/gu, "");
  return `${selector.begin}\n${normalizedContent}\n${selector.end}`;
}

export function canonicalManagedBlock(content: string): string {
  return content.replaceAll("\r\n", "\n");
}

/** Appends a block using the line ending that dominates the existing file, so a CRLF file stays CRLF. */
export function appendManagedBlock(content: string, fragment: string): string {
  if (content.length === 0) return `${fragment}\n`;
  const eol = detectEol(content);
  const suffix = content.endsWith("\n") ? content : `${content}${eol}`;
  return `${suffix}${eol}${withEol(fragment, eol)}${eol}`;
}

export type LocatedManagedBlock =
  { kind: "missing" } | { kind: "malformed" } | { kind: "found"; start: number; end: number; value: string };

export function locateManagedBlock(content: string, selector: MarkerSelector): LocatedManagedBlock {
  const begins = findAll(content, selector.begin);
  const ends = findAll(content, selector.end);
  if (begins.length === 0 && ends.length === 0) return { kind: "missing" };
  if (begins.length !== 1 || ends.length !== 1 || begins[0]! >= ends[0]!) return { kind: "malformed" };
  const start = begins[0]!;
  const end = ends[0]! + selector.end.length;
  return { kind: "found", start, end, value: content.slice(start, end) };
}

function findAll(content: string, value: string): number[] {
  const indexes: number[] = [];
  let offset = 0;
  while (offset <= content.length) {
    const index = content.indexOf(value, offset);
    if (index < 0) return indexes;
    indexes.push(index);
    offset = index + value.length;
  }
  return indexes;
}
