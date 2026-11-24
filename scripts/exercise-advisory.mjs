import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

const HINT = /harnix-exercise/u;
const OBSERVABLE_TEXT = "API trả 200 cho GET /orders";
const PLAIN_TEXT = "Hàm tính phí làm tròn đến đồng";

/** Each case runs on a throwaway task in an isolated project; `expect` says whether an exercise advisory must appear. */
export const CASES = [
  { name: "observable criterion without an exercise check", text: OBSERVABLE_TEXT, expect: true },
  { name: "id chk-exercise-api covers it", text: OBSERVABLE_TEXT, check: "chk-exercise-api", expect: false },
  { name: "id chk-exercises is not an exercise check", text: OBSERVABLE_TEXT, check: "chk-exercises", expect: true },
  { name: "CLI path without an exercise check", text: PLAIN_TEXT, path: "src/commands/status.ts", expect: true },
  { name: "skill path without an exercise check", text: PLAIN_TEXT, path: "src/skills/x/SKILL.md", expect: true },
  {
    name: "CLI path with exercise-cli",
    text: PLAIN_TEXT,
    path: "src/commands/status.ts",
    check: "exercise-cli",
    expect: false,
  },
  { name: "core path only", text: PLAIN_TEXT, path: "src/core/x.ts", expect: false },
];

function runCli(root, cwd, args, run = spawnSync) {
  const result = run(process.execPath, [join(root, "dist", "cli.js"), ...args], { cwd, encoding: "utf8" });
  const line = String(result.stdout ?? "")
    .split("\n")
    .reverse()
    .find((entry) => entry.startsWith("{"));
  return { status: result.status, json: line === undefined ? undefined : JSON.parse(line), stderr: result.stderr };
}

function prepareProject() {
  const project = mkdtempSync(join(tmpdir(), "harnix-exercise-advisory-"));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "t", scripts: { test: "node -e 0" } }));
  for (const dir of ["src", "test"]) {
    mkdirSync(join(project, dir));
    writeFileSync(join(project, dir, "a.js"), "x\n");
  }
  spawnSync("git", ["init", "-q"], { cwd: project });
  return project;
}

/** Runs one case with the built CLI and returns a failure message, or `undefined` when the advisory matches. */
export function exerciseCase(root, project, scenario, index, run = spawnSync) {
  const cli = (...args) => runCli(root, project, args, run);
  cli(
    "workflow",
    "--init",
    "--title",
    `Case ${String(index)}`,
    "--slug",
    `case-${String(index)}`,
    "--mode",
    "lite",
    "--text",
    scenario.text,
  );
  if (scenario.check !== undefined) {
    cli(
      "workflow",
      "--set-check",
      scenario.check,
      "--command",
      "node -e 0",
      "--scope",
      "focused",
      "--input",
      "src/**",
      "--criteria",
      "ac-1",
      "--description",
      "kiểm chạy thật",
    );
  }
  if (scenario.path !== undefined) cli("workflow", "--set-paths", "--relevant-path", scenario.path);
  const dry = cli("workflow", "--transition", "ready/ready", "--dry-run");
  cli("workflow", "--cancel", "--reason", "xong ca kiểm chạy thật");
  const advisories = dry.json?.advisories;
  if (!Array.isArray(advisories))
    return `${scenario.name}: no advisories array (exit ${String(dry.status)}): ${String(dry.stderr).split("\n")[0]}`;
  const found = advisories.some((entry) => HINT.test(String(entry)));
  return found === scenario.expect
    ? undefined
    : `${scenario.name}: expected exercise advisory ${String(scenario.expect)}, got ${String(found)}`;
}

export function main(root = resolve(fileURLToPath(new URL("..", import.meta.url)))) {
  assertBuilt(root);
  const project = prepareProject();
  try {
    const init = runCli(root, project, ["init", "--user", "tester"]);
    if (init.status !== 0)
      throw new Error(`harnix init failed in the temporary project: ${String(init.stderr).split("\n")[0]}`);
    const failures = CASES.flatMap((scenario, index) => exerciseCase(root, project, scenario, index + 1) ?? []);
    process.stdout.write(
      `exercised ${String(CASES.length)} ready dry-run cases with dist/cli.js, ${String(failures.length)} failed\n`,
    );
    for (const failure of failures) process.stderr.write(`${failure}\n`);
    return failures.length === 0 ? 0 : 1;
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
