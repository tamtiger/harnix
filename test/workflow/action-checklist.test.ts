import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const HEADING = "### Thêm cờ hoặc action workflow";

async function checklistPaths(): Promise<string[]> {
  const lines = (await readFile(join(root, "AGENTS.md"), "utf8")).split(/\r?\n/u);
  const start = lines.findIndex((line) => line.trim() === HEADING);
  if (start < 0) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,3} /u.test(line));
  const section = (end < 0 ? rest : rest.slice(0, end)).join("\n");
  return [...section.matchAll(/`([^`\s]+\.(?:ts|md|json|mjs))`/gu)].map((match) => match[1] as string);
}

describe("workflow action checklist in AGENTS.md", () => {
  it("lists every file to update when a workflow flag or action is added", async () => {
    const paths = await checklistPaths();

    expect(paths).toEqual(
      expect.arrayContaining([
        "src/commands/workflow-command.ts",
        "src/commands/workflow-flags.ts",
        "src/commands/workflow-flag-owners.ts",
        "src/commands/workflow-handlers.ts",
        "src/core/workflow/brief.ts",
        "src/core/workflow/schema.ts",
        "src/core/workflow/index.ts",
        "test/workflow/cli-contract.test.ts",
        "test/unit/core/workflow/index.test.ts",
        "test/unit/commands/workflow-handlers.test.ts",
        "test/workflow/behavior-snapshot.golden.json",
        "docs/HARNIX_WORKFLOW.md",
        "src/templates/harnix/workflow.md",
      ]),
    );
  });

  it("names only files that exist, so the list cannot go stale unnoticed", async () => {
    for (const path of await checklistPaths()) expect(existsSync(join(root, path)), path).toBe(true);
  });
});
