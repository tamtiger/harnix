import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const scripts = (
  JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  }
).scripts;

describe("package script test:gates", () => {
  const tokens = (scripts["test:gates"] ?? "").trim().split(/\s+/u);

  it("runs vitest on test files only", () => {
    expect(tokens.slice(0, 2)).toEqual(["vitest", "run"]);
    expect(tokens.length).toBeGreaterThan(2);
  });

  it("lists only existing test files, each once, so a missing space cannot drop a gate silently", () => {
    const files = tokens.slice(2);

    for (const file of files) {
      expect(file, file).toMatch(/^test\/[\w./-]+\.test\.ts$/u);
      expect(existsSync(resolve(repositoryRoot, file)), file).toBe(true);
    }
    expect(new Set(files).size).toBe(files.length);
  });

  it("keeps the token-budget gate and the skill scan exercise in the gate", () => {
    expect(tokens).toContain("test/workflow/instruction-budget.test.ts");
    expect(tokens).toContain("test/workflow/skill-scan-exercise.test.ts");
  });
});
