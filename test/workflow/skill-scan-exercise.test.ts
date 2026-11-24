import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

interface Finding {
  code: string;
  severity: string;
  path: string;
  message: string;
  fixable: boolean;
}

type Run = (command: string, args: string[], options: object) => { status: number; stdout: string; stderr: string };

const { exerciseSkillScan, FLAGGED } = (await import(
  new URL("../../scripts/exercise-skill-scan.mjs", import.meta.url).href
)) as {
  exerciseSkillScan(root: string, project: string, home: string, run: Run): string[];
  FLAGGED: string[];
};

const root = fileURLToPath(new URL("../..", import.meta.url));
const directories: string[] = [];

function temporary(): string {
  const directory = mkdtempSync(join(tmpdir(), "harnix-skill-scan-test-"));
  mkdirSync(join(directory, ".harnix", "spec"), { recursive: true });
  directories.push(directory);
  return directory;
}

function doctor(status: number, findings: Finding[]): ReturnType<Run> {
  return { status, stdout: `${JSON.stringify({ project: { findings } })}\n`, stderr: "" };
}

const hit = (path: string, overrides: Partial<Finding> = {}): Finding => ({
  code: "skill-suspicious-content",
  severity: "warning",
  path,
  message: "Skill or guide text matches suspicious pattern(s): instruction-override.",
  fixable: false,
  ...overrides,
});

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("scripts/exercise-skill-scan.mjs", () => {
  it("passes when the doctor flags both hostile files, leaves the clean one and then reports nothing", () => {
    const calls: number[] = [];
    const run: Run = () => {
      calls.push(1);
      return calls.length === 1
        ? doctor(
            1,
            FLAGGED.map((path) => hit(path)),
          )
        : doctor(0, []);
    };

    expect(exerciseSkillScan(root, temporary(), temporary(), run)).toEqual([]);
  });

  it("reports a missed file, a wrong severity, a leaked message and a wrong exit code", () => {
    const leaked = hit(FLAGGED[1]!, { severity: "info", message: "text from https://example.test/x" });
    const run: Run = () => doctor(0, [leaked]);

    const failures = exerciseSkillScan(root, temporary(), temporary(), run);

    expect(failures.some((line) => line.includes("did not flag"))).toBe(true);
    expect(failures.some((line) => line.includes("expected a non-fixable warning"))).toBe(true);
    expect(failures.some((line) => line.includes("message repeats the text"))).toBe(true);
    expect(failures.some((line) => line.includes("exit code"))).toBe(true);
  });
});
