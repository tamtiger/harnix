import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

/**
 * Each case runs on a throwaway task in a temporary project with the built CLI and reads `workflow --preflight`:
 * `include` and `exclude` are the technique skills that must and must not be suggested, `hint` says whether the one
 * fixed `techniqueHint` line must be there.
 */
export const CASES = [
  {
    name: "a plain Full task is not told to use sequential thinking",
    title: "Rename a helper",
    slug: "rename-helper",
    mode: "full",
    text: "Tên hàm trợ giúp thống nhất",
    include: ["harnix-verification-gap"],
    exclude: ["harnix-sequential-thinking"],
    hint: true,
  },
  {
    name: "a task that asks for sequential thinking by its wording",
    title: "Refactor the loader",
    slug: "refactor-loader",
    mode: "full",
    text: "Bộ nạp tách thành hai lớp",
    include: ["harnix-sequential-thinking"],
    hint: true,
  },
  {
    name: "a migration is pointed at the migration skill",
    title: "Schema migration of the store",
    slug: "schema-migration",
    mode: "lite",
    text: "Dữ liệu cũ vẫn đọc được",
    include: ["harnix-migration-safety"],
    hint: true,
  },
  {
    name: "a quiet task in progress has no suggestion and no hint",
    title: "Fix a typo",
    slug: "fix-typo",
    mode: "lite",
    text: "Tên biến đúng chính tả",
    advance: ["ready/ready", "in_progress/implementing"],
    exclude: ["harnix-sequential-thinking", "harnix-verification-gap"],
    hint: false,
  },
];

/** Returns a failure message when the preflight does not match the case, otherwise `undefined`. */
export function evaluate(scenario, preflight) {
  if (preflight === undefined) return `${scenario.name}: no preflight JSON printed`;
  const suggested = preflight.suggestedTechniques ?? [];
  const missing = (scenario.include ?? []).filter((name) => !suggested.includes(name));
  const unexpected = (scenario.exclude ?? []).filter((name) => suggested.includes(name));
  if (missing.length > 0) return `${scenario.name}: ${missing.join(", ")} should be suggested`;
  if (unexpected.length > 0) return `${scenario.name}: ${unexpected.join(", ")} should not be suggested`;
  if ((preflight.techniqueHint !== undefined) !== scenario.hint) {
    return `${scenario.name}: techniqueHint should be ${scenario.hint ? "present" : "absent"}`;
  }
  return undefined;
}

function runCli(root, cwd, args) {
  const result = spawnSync(process.execPath, [join(root, "dist", "cli.js"), ...args], { cwd, encoding: "utf8" });
  const line = String(result.stdout ?? "")
    .split("\n")
    .reverse()
    .find((entry) => entry.startsWith("{"));
  return {
    status: result.status,
    json: line === undefined ? undefined : JSON.parse(line),
    stderr: String(result.stderr ?? ""),
  };
}

function prepareProject(root) {
  const project = mkdtempSync(join(tmpdir(), "harnix-exercise-technique-hint-"));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "t", scripts: { test: "node -e 0" } }));
  const init = runCli(root, project, ["init", "--user", "tester"]);
  if (init.status !== 0) throw new Error(`harnix init failed: ${init.stderr.split("\n")[0]}`);
  return project;
}

/** Runs one case with the built CLI and returns a failure message, or `undefined` when the preflight matches. */
export function exerciseCase(root, project, scenario) {
  const cli = (...args) => runCli(root, project, args);
  cli(
    "workflow",
    "--init",
    "--title",
    scenario.title,
    "--slug",
    scenario.slug,
    "--mode",
    scenario.mode,
    "--text",
    scenario.text,
  );
  for (const target of scenario.advance ?? []) cli("workflow", "--transition", target);
  const preflight = cli("workflow", "--preflight").json;
  cli("workflow", "--cancel", "--reason", "xong ca kiểm chạy thật");
  return evaluate(scenario, preflight);
}

export function main(root = resolve(fileURLToPath(new URL("..", import.meta.url)))) {
  assertBuilt(root);
  const project = prepareProject(root);
  try {
    const failures = CASES.flatMap((scenario) => exerciseCase(root, project, scenario) ?? []);
    process.stdout.write(
      `exercised ${String(CASES.length)} technique-hint cases with dist/cli.js in a temporary project, ${String(failures.length)} failed\n`,
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
