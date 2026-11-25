import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

const OBSERVABLE = "API trả 200 cho GET /orders";
const PLAIN = "Hàm tính phí làm tròn đến đồng";
const EARLY = /already changed while the task is/u;
const STALE = /commit\(s\) touched relevantPaths/u;
const CODE_ONLY = /partial or code-only run/u;

/**
 * Each case runs on a throwaway task in a temporary Git project with the built CLI. `look` says where to read the
 * advisory (`dry`: the `advisories` of a dry run, `real`: the stderr of the real transition) and `match` is the text
 * that must (`expect: true`) or must not (`expect: false`) be there.
 */
export const CASES = [
  {
    name: "a file in relevantPaths changed while planning",
    text: PLAIN,
    dirty: "src/a.js",
    match: EARLY,
    expect: true,
  },
  { name: "a clean tree stays silent", text: PLAIN, match: EARLY, expect: false },
  { name: "a change outside relevantPaths stays silent", text: PLAIN, dirty: "test/a.js", match: EARLY, expect: false },
  {
    name: "the real ready transition prints a notice on stderr",
    text: PLAIN,
    dirty: "src/a.js",
    look: "real",
    match: /notice: .*already changed/u,
    expect: true,
  },
  {
    name: "a commit on relevantPaths since the task was created",
    text: PLAIN,
    commit: true,
    match: STALE,
    expect: true,
  },
  { name: "a fresh draft with no commit stays silent", text: PLAIN, match: STALE, expect: false },
  { name: "code-only evidence with no risk", text: OBSERVABLE, evidence: "code-only", match: CODE_ONLY, expect: true },
  {
    name: "code-only evidence with a recorded risk",
    text: OBSERVABLE,
    evidence: "code-only",
    risk: true,
    match: CODE_ONLY,
    expect: false,
  },
  { name: "full evidence stays silent", text: OBSERVABLE, evidence: "full", match: CODE_ONLY, expect: false },
  {
    name: "the ready checklist carries the premortem line",
    text: PLAIN,
    look: "checklist",
    match: /^Premortem:/u,
    expect: true,
  },
];

/** Returns a failure message when what the CLI showed does not match the case, otherwise `undefined`. */
export function evaluate(scenario, observed) {
  const found = observed.some((entry) => scenario.match.test(String(entry)));
  return found === scenario.expect
    ? undefined
    : `${scenario.name}: expected ${scenario.match} to be ${scenario.expect ? "present" : "absent"}, got ${found ? "present" : "absent"}`;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function git(project, ...args) {
  return spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
    cwd: project,
    encoding: "utf8",
  });
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
  const project = mkdtempSync(join(tmpdir(), "harnix-exercise-advisories-"));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "t", scripts: { test: "node -e 0" } }));
  for (const dir of ["src", "test"]) {
    mkdirSync(join(project, dir));
    writeFileSync(join(project, dir, "a.js"), "x\n");
  }
  git(project, "init", "-q");
  const init = runCli(root, project, ["init", "--user", "tester"]);
  if (init.status !== 0) throw new Error(`harnix init failed: ${init.stderr.split("\n")[0]}`);
  git(project, "add", "-A");
  git(project, "commit", "-q", "-m", "base");
  return project;
}

function evidenceSteps(cli, scenario) {
  for (const target of ["ready/ready", "in_progress/implementing", "verifying/verifying"]) {
    cli("workflow", "--transition", target);
  }
  cli(
    "workflow",
    "--evidence",
    "--check",
    "check-suite",
    "--result",
    "pass",
    "--exit-code",
    "0",
    "--summary",
    `mode: ${scenario.evidence}; kiểm bằng CLI thật`,
  );
  cli("workflow", "--criterion", "ac-1", "--met");
  if (scenario.risk === true) cli("workflow", "--add-risk", "risk-1", "--text", "Chưa chạy thật trong môi trường đích");
}

/** Runs one case with the built CLI and returns a failure message, or `undefined` when the advisory matches. */
export function exerciseCase(root, project, scenario, index) {
  const cli = (...args) => runCli(root, project, args);
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
  cli("workflow", "--set-paths", "--relevant-path", "src/**");
  if (scenario.commit === true) {
    sleep(1200);
    writeFileSync(join(project, "src", "b.js"), "y\n");
    git(project, "add", "-A");
    git(project, "commit", "-q", "-m", "touch src");
  }
  if (scenario.dirty !== undefined) writeFileSync(join(project, scenario.dirty), `${String(index)}\n`);
  let observed;
  if (scenario.evidence !== undefined) {
    evidenceSteps(cli, scenario);
    observed = cli("workflow", "--transition", "verifying/finishing", "--dry-run").json?.advisories;
  } else if (scenario.look === "real") {
    observed = cli("workflow", "--transition", "ready/ready").stderr.split("\n");
  } else if (scenario.look === "checklist") {
    observed = cli("workflow", "--transition", "ready/ready", "--dry-run", "--checklist").json?.reviewChecklist;
  } else {
    observed = cli("workflow", "--transition", "ready/ready", "--dry-run").json?.advisories;
  }
  cli("workflow", "--cancel", "--reason", "xong ca kiểm chạy thật");
  git(project, "checkout", "--", "src", "test");
  git(project, "clean", "-fdq", "src", "test");
  if (!Array.isArray(observed)) return `${scenario.name}: the CLI printed no list to check`;
  return evaluate(scenario, observed);
}

export function main(root = resolve(fileURLToPath(new URL("..", import.meta.url)))) {
  assertBuilt(root);
  const project = prepareProject(root);
  try {
    const failures = CASES.flatMap((scenario, index) => exerciseCase(root, project, scenario, index + 1) ?? []);
    process.stdout.write(
      `exercised ${String(CASES.length)} advisory cases with dist/cli.js in a temporary Git project, ${String(failures.length)} failed\n`,
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
