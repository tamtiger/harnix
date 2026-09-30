const CODE_PAGES = ["windows-1252", "windows-1258"] as const;
const EXCERPT_LENGTH = 40;
const REPLACEMENT_CHARACTER = "�";
const hasNonAscii = (text: string): boolean => [...text].some((character) => (character.codePointAt(0) ?? 0) > 0x7f);

export interface CorruptedText {
  reason: "mojibake" | "replacement-character";
  excerpt: string;
}

/** Character to byte table of a single-byte code page, built from the platform decoder. */
function byteTable(label: string): Map<string, number> {
  const decoder = new TextDecoder(label);
  const table = new Map<string, number>();
  for (let byte = 0; byte < 256; byte += 1) {
    const character = decoder.decode(Uint8Array.of(byte));
    if (!table.has(character)) table.set(character, byte);
  }
  return table;
}

const TABLES = CODE_PAGES.map(byteTable);

/**
 * True when every character maps to one byte of the code page and those bytes
 * are valid UTF-8 that decodes to non-ASCII text: the signature of UTF-8 that a
 * shell read with its legacy default encoding. Genuine Vietnamese contains
 * characters outside the code page, and genuine Latin text is not valid UTF-8
 * when read back byte by byte, so neither matches.
 */
function isMojibake(text: string, table: Map<string, number>): boolean {
  const bytes: number[] = [];
  for (const character of text) {
    const byte = table.get(character);
    if (byte === undefined) return false;
    bytes.push(byte);
  }
  if (!bytes.some((byte) => byte >= 0x80)) return false;
  try {
    return hasNonAscii(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes)));
  } catch {
    return false;
  }
}

function inspect(text: string): CorruptedText | undefined {
  const excerpt = text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;
  if (text.includes(REPLACEMENT_CHARACTER)) return { reason: "replacement-character", excerpt };
  return TABLES.some((table) => isMojibake(text, table)) ? { reason: "mojibake", excerpt } : undefined;
}

/** First corrupted string value found anywhere inside `value`; object keys are not inspected. */
export function findCorruptedText(value: unknown): CorruptedText | undefined {
  if (typeof value === "string") return inspect(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCorruptedText(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      const found = findCorruptedText(item);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * Refuses text that a shell has already damaged (wrong code page or lossy
 * conversion) so it can never be persisted, even through a replan.
 */
export function assertTextIntegrity(value: unknown): void {
  const corrupted = findCorruptedText(value);
  if (corrupted === undefined) return;
  const cause =
    corrupted.reason === "replacement-character"
      ? "contains the replacement character U+FFFD"
      : "looks like UTF-8 text read with a legacy code page";
  throw new Error(
    `Workflow text has the wrong text encoding: "${corrupted.excerpt}" ${cause}. Nothing was saved. Edit prd.md/plan.md/design.md directly with the editor tool and use the flag transports (--set-check, --add-criterion, --set-paths) instead of piping accented text through Windows PowerShell 5.1; use bash or pwsh 7.4+ when JSON is unavoidable.`,
  );
}
