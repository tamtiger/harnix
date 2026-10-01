import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

async function readDoc(relativePath: string): Promise<string> {
  return readFile(fileURLToPath(new URL(`../../../${relativePath}`, import.meta.url)), "utf8");
}

describe("supported-platforms documentation sync", () => {
  it("names OpenCode and Cursor in the product docs", async () => {
    for (const doc of ["docs/HARNIX_PRD.md", "AGENTS.md", "README.md", "docs/GLOBAL_SETUP_REFACTOR_PLAN.md"]) {
      const content = await readDoc(doc);
      expect(content, `${doc} must mention OpenCode`).toContain("OpenCode");
      expect(content, `${doc} must mention Cursor`).toContain("Cursor");
    }
  });

  it("records the verified OpenCode and Cursor limits in the global setup plan", async () => {
    const plan = await readDoc("docs/GLOBAL_SETUP_REFACTOR_PLAN.md");
    expect(plan).toContain("~/.config/opencode/AGENTS.md");
    expect(plan).toContain("~/.cursor/skills/harnix-*/SKILL.md");
    expect(plan).toContain("hookless");
    expect(plan).toContain("opencode.ai/docs/rules");
    expect(plan).toContain("cursor.com/docs/hooks");
  });

  it("keeps the AGENTS.md supported-platform boundary at exactly the six platforms", async () => {
    const agents = await readDoc("AGENTS.md");
    expect(agents).toContain("Kiro, Antigravity, Codex, Claude Code, OpenCode, and Cursor");
  });
});
