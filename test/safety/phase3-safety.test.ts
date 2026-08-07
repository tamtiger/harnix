import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Phase 3 supported platform surface", () => {
  it("contains no unsupported platform adapter directories", async () => {
    const adapters = await readdir(join(process.cwd(), "src", "configurators"));
    expect(adapters).toEqual(["codex.ts"]);
  });
  it("does not expose deprecated Gemini CLI or Trellis product surfaces", async () => {
    const files = await readdir(join(process.cwd(), "src"), { recursive: true });
    const names = files.map(String).join("\n");
    expect(names).not.toMatch(/gemini-cli|trellis/iu);
  });
});
