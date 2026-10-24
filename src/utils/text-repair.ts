const CODE_PAGES = ["windows-1252", "windows-1258"] as const;
const hasNonAscii = (text: string): boolean => [...text].some((character) => (character.codePointAt(0) ?? 0) > 0x7f);

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

function decodeMojibake(text: string, table: Map<string, number>): string | undefined {
  const bytes: number[] = [];
  for (const character of text) {
    const byte = table.get(character);
    if (byte === undefined) return undefined;
    bytes.push(byte);
  }
  if (!bytes.some((byte) => byte >= 0x80)) return undefined;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return hasNonAscii(decoded) ? decoded : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Automatically repairs UTF-8 text that was read with a legacy single-byte code page (e.g. windows-1252/1258).
 * If the string was garbled by a legacy shell, reverses the bytes back to valid UTF-8.
 * Returns the original string if it is already clean or cannot be cleanly reversed.
 */
export function autoRepairMojibake(text: string): string {
  for (const table of TABLES) {
    const repaired = decodeMojibake(text, table);
    if (repaired !== undefined) return repaired;
  }
  return text;
}
