import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

type Run = (
  command: string,
  args: string[],
  options: { cwd: string },
) => { status: number; stdout: string; stderr: string };

const { exerciseRunCheck } = (await import(new URL("../../scripts/exercise-run-check.mjs", import.meta.url).href)) as {
  exerciseRunCheck(root: string, project: string, run: Run): string[];
};

const root = fileURLToPath(new URL("../..", import.meta.url));
const directories: string[] = [];
const LOG = ".harnix/tmp/check-logs/chk-focused.log";

function project(): string {
  const directory = mkdtempSync(join(tmpdir(), "harnix-run-check-exercise-test-"));
  mkdirSync(join(directory, ".harnix", "tmp", "check-logs"), { recursive: true });
  mkdirSync(join(directory, "src"));
  directories.push(directory);
  return directory;
}

const reply = (json: object, status = 0) => ({ status, stdout: `${JSON.stringify(json)}\n`, stderr: "" });

/** A stand-in for the built CLI that behaves as the scenario expects; `broken` drops the failure log and the skipped list. */
function fakeCli(directory: string, broken = false): Run {
  let runChecks = 0;
  let green = false;
  const logFile = join(directory, ...LOG.split("/"));
  return (_command, args) => {
    const action = args.slice(2);
    if (action.includes("--run-checks")) {
      runChecks += 1;
      if (runChecks === 1)
        return reply({
          ran: [{ id: "chk-focused", result: "fail", exitCode: 1 }],
          remaining: [],
          ...(broken ? {} : { skipped: ["criterion", "transition", "finish"] }),
        });
      return reply({ status: "completed" });
    }
    if (action.includes("--run-check")) {
      if (action.includes("--")) return { status: 1, stdout: "", stderr: "differs from the declared command" };
      if (!green) {
        green = true;
        if (!broken) writeFileSync(logFile, "line 0\nline 59\nassertion: flag is not ok\n");
        return reply({ result: "fail", ...(broken ? {} : { logPath: LOG }) });
      }
      rmSync(logFile, { force: true });
      return reply({ result: "pass" });
    }
    return reply({});
  };
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("scripts/exercise-run-check.mjs", () => {
  it("passes when the CLI runs the declared command, keeps the log, stops the batch and finishes it", () => {
    const directory = project();

    expect(exerciseRunCheck(root, directory, fakeCli(directory))).toEqual([]);
  });

  it("reports a missing log path, a missing skipped list and a log that is not there", () => {
    const directory = project();

    const failures = exerciseRunCheck(root, directory, fakeCli(directory, true));

    expect(failures.some((line) => line.includes("returns logPath"))).toBe(true);
    expect(failures.some((line) => line.includes("whole output"))).toBe(true);
    expect(failures.some((line) => line.includes("skipped"))).toBe(true);
  });
});
