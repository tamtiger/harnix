import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("CRLF/LF guidance for Windows", () => {
  it("tells agents how to avoid false-positive line-ending diffs", async () => {
    const text = await readFile("src/skills/harnix-verify/references/evidence.md", "utf8");
    expect(text).toContain("git diff --ignore-space-at-eol");
    expect(text).toContain(".gitattributes");
  });
});
