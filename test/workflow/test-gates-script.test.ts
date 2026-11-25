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

/** A `.ts` followed at once by another character means two file names were run together (a missing space). */
function gluedFileNames(script: string): string[] {
  return script.match(/\S*\.ts(?=\S)\S*/gu) ?? [];
}

describe("package script test:gates", () => {
  const tokens = (scripts["test:gates"] ?? "").trim().split(/\s+/u);

  it("never runs two test file names together", () => {
    expect(gluedFileNames(scripts["test:gates"] ?? "")).toEqual([]);
  });

  it("recognizes a missing space between two file names", () => {
    const glued = "vitest run test/workflow/a.test.tstest/workflow/b.test.ts test/workflow/c.test.ts";

    expect(gluedFileNames(glued)).toEqual(["test/workflow/a.test.tstest/workflow/b.test.ts"]);
    expect(gluedFileNames("vitest run test/workflow/a.test.ts test/workflow/b.test.ts")).toEqual([]);
  });

  it("keeps this guard in the gate it protects", () => {
    expect(tokens).toContain("test/workflow/test-gates-script.test.ts");
  });

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
