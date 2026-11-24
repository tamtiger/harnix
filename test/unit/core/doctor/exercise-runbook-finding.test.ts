import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectExerciseRunbook } from "src/core/doctor/exercise-runbook-finding.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";
import { DOCTOR_FINDING_CODES } from "src/core/doctor/finding-codes.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function project(packageJson: object | undefined, runbook?: string): Promise<string> {
  const root = await temporaryRepository();
  if (packageJson !== undefined) await writeFile(join(root, "package.json"), JSON.stringify(packageJson));
  if (runbook !== undefined) {
    await mkdir(join(root, ".harnix", "spec"), { recursive: true });
    await writeFile(join(root, ".harnix", "spec", "exercise.md"), runbook);
  }
  return root;
}

async function run(root: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  await inspectExerciseRunbook(root, findings);
  return findings;
}

describe("inspectExerciseRunbook", () => {
  it("advises at info level, without fixing, when a runnable entry point has no exercise runbook", async () => {
    for (const manifest of [
      { scripts: { start: "node a.js" } },
      { scripts: { dev: "vite" } },
      { bin: { tool: "a.js" } },
    ]) {
      const findings = await run(await project(manifest));
      expect(findings).toEqual([
        expect.objectContaining({
          code: "exercise-runbook-missing",
          severity: "info",
          path: ".harnix/spec/exercise.md",
          fixable: false,
        }),
      ]);
      expect(findings[0]?.message).toContain("harnix skill harnix-exercise --reference runbook");
    }
    expect(DOCTOR_FINDING_CODES).toContain("exercise-runbook-missing");
  });

  it("stays silent with a non-empty runbook, no runnable entry point or no manifest, and never writes the file", async () => {
    expect(await run(await project({ scripts: { start: "node a.js" } }, "# Run\n"))).toEqual([]);
    expect(await run(await project({ scripts: { test: "vitest" } }))).toEqual([]);
    expect(await run(await project(undefined))).toEqual([]);
    const empty = await project({ scripts: { start: "x" } }, "  \n");
    expect(await run(empty)).toHaveLength(1);
  });

  it("stays silent when package.json is not valid JSON", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "package.json"), "{ not json");
    expect(await run(root)).toEqual([]);
  });
});
