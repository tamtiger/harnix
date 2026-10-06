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

  it("lists all six platform flags wherever a docs line enumerates the platform flags", async () => {
    const flags = ["--kiro", "--antigravity", "--codex", "--claude", "--opencode", "--cursor"];
    for (const doc of ["README.md", "docs/HARNIX_PRD.md", "docs/GLOBAL_SETUP_REFACTOR_PLAN.md"]) {
      const lines = (await readDoc(doc)).split(/\r?\n/u);
      const enumerating = lines.filter((line) => /--kiro(?:\\)?\|--antigravity/u.test(line));
      expect(enumerating.length, `${doc} should enumerate platform flags`).toBeGreaterThan(0);
      for (const line of enumerating) for (const flag of flags) expect(line, `${doc}: ${line}`).toContain(flag);
    }
  });

  it("lists all six platform ids wherever a docs line enumerates the --platform values", async () => {
    for (const doc of ["docs/HARNIX_PRD.md", "docs/IMPLEMENTATION_PLAN.md"]) {
      const lines = (await readDoc(doc)).split(/\r?\n/u);
      const enumerating = lines.filter((line) => /<kiro\|antigravity\|codex\|claude/u.test(line));
      expect(enumerating.length, `${doc} should enumerate platform ids`).toBeGreaterThan(0);
      for (const line of enumerating) expect(line, `${doc}: ${line}`).toContain("claude|opencode|cursor>");
    }
  });

  it("names all six platforms in user-facing help, program description and uninstall message", async () => {
    for (const source of ["src/cli-workflow-commands.ts", "src/cli-program.ts", "src/core/global/uninstall.ts"]) {
      const content = await readDoc(source);
      expect(content, `${source} must name OpenCode`).toMatch(/OpenCode/u);
      expect(content, `${source} must name Cursor`).toMatch(/Cursor/u);
    }
    const testReadme = await readDoc("test/README.md");
    expect(testReadme).toMatch(/Kiro, Antigravity, Codex, Claude Code, OpenCode and Cursor/u);
  });

  it("keeps the AGENTS.md supported-platform boundary at exactly the six platforms", async () => {
    const agents = await readDoc("AGENTS.md");
    expect(agents).toContain("Kiro, Antigravity, Codex, Claude Code, OpenCode, and Cursor");
  });
});
