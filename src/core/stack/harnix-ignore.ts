import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { matchesSafeGlob } from "src/utils/safe-glob.js";

export interface HarnixIgnore {
  readonly patterns: readonly string[];
  ignores(relativePath: string): boolean;
}

const MAX_IGNORE_BYTES = 256 * 1024;

export async function loadHarnixIgnore(projectRoot: string): Promise<HarnixIgnore> {
  const filePath = join(projectRoot, ".harnixignore");
  let content: string | undefined;
  try {
    const s = await stat(filePath);
    if (s.size <= MAX_IGNORE_BYTES) {
      content = await readFile(filePath, "utf8");
    }
  } catch {
    // Missing or unreadable .harnixignore is treated as empty
  }
  return parseHarnixIgnore(content ?? "");
}

export function parseHarnixIgnore(content: string): HarnixIgnore {
  const patterns: string[] = [];
  for (const rawLine of content.split(/\r?\n/u)) {
    const trimmed = rawLine.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;
    const normalized = trimmed.replaceAll("\\", "/").replace(/\/+$/u, "");
    if (normalized.length > 0) {
      patterns.push(normalized);
    }
  }

  return {
    patterns,
    ignores(relativePath: string): boolean {
      if (patterns.length === 0) return false;
      const cleanPath = relativePath.replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/+$/u, "");
      if (cleanPath.length === 0) return false;
      const segments = cleanPath.split("/");

      for (const pattern of patterns) {
        if (cleanPath === pattern || cleanPath.startsWith(`${pattern}/`)) return true;
        if (!pattern.includes("/")) {
          if (segments.includes(pattern)) return true;
        }
        if (pattern.includes("*")) {
          if (
            matchesSafeGlob(cleanPath, pattern) ||
            matchesSafeGlob(cleanPath, `**/${pattern}`) ||
            matchesSafeGlob(cleanPath, `${pattern}/**`)
          ) {
            return true;
          }
        }
      }
      return false;
    },
  };
}
