import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".vs", ".idea", "tasks"]);

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        files.push(...(await collectMarkdownFiles(join(dir, entry.name))));
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/gu;

describe("markdown links validation", () => {
  it("resolves all relative markdown links to existing files", async () => {
    const root = resolve(".");
    const mdFiles = await collectMarkdownFiles(root);
    expect(mdFiles.length).toBeGreaterThan(20);

    const brokenLinks: { file: string; target: string; resolved: string }[] = [];

    for (const file of mdFiles) {
      const content = await readFile(file, "utf8");
      const matches = content.matchAll(LINK_PATTERN);

      for (const match of matches) {
        const rawTarget = match[1]?.trim() ?? "";
        // Skip external protocols and internal anchor-only links
        if (
          rawTarget.startsWith("http://") ||
          rawTarget.startsWith("https://") ||
          rawTarget.startsWith("mailto:") ||
          rawTarget.startsWith("#") ||
          rawTarget.startsWith("file://")
        ) {
          continue;
        }

        const pathWithoutAnchor = rawTarget.split("#")[0]?.split("?")[0]?.trim();
        if (!pathWithoutAnchor) continue;

        // Relative to current file's directory
        const resolvedPath = resolve(dirname(file), pathWithoutAnchor);
        try {
          await access(resolvedPath);
        } catch {
          brokenLinks.push({ file, target: rawTarget, resolved: resolvedPath });
        }
      }
    }

    expect(brokenLinks, `Found broken relative markdown links: ${JSON.stringify(brokenLinks, null, 2)}`).toEqual([]);
  });
});
