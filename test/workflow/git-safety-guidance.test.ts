import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const read = (path: string): Promise<string> => readFile(path, "utf8");

describe("git safety guidance", () => {
  it.each([
    "AGENTS.md",
    "src/templates/harnix/activation.ts",
    "src/skills/harnix-implement/SKILL.md",
    "src/skills/harnix-implement/references/commit-hygiene.md",
  ])("%s requires the branch check and forbids piping git checkout", async (path) => {
    const text = await read(path);
    expect(text).toContain("git branch --show-current");
    expect(text).toMatch(/never pipe `git checkout`|Never pipe `git checkout`/u);
  });

  it("explains how to rewrite or waive a criterion without editing task.json", async () => {
    const text = await read("src/skills/harnix-plan/references/replan.md");
    expect(text).toContain("--set-criterion");
    expect(text).toContain("waiverReason");
    expect(text).not.toContain("needs one `--save` envelope");
  });
});
