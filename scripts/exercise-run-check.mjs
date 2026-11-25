import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

const LOG = ".harnix/tmp/check-logs/chk-focused.log";

function runCli(root, cwd, args, run = spawnSync) {
  const result = run(process.execPath, [join(root, "dist", "cli.js"), ...args], { cwd, encoding: "utf8" });
  const line = String(result.stdout ?? "")
    .split("\n")
    .reverse()
    .find((entry) => entry.startsWith("{"));
  return {
    status: result.status,
    json: line === undefined ? undefined : JSON.parse(line),
    stderr: String(result.stderr),
  };
}

/** A project whose only test is `node check.js`: red until `src/flag.txt` says `ok`, then green. */
function prepareProject() {
  const project = mkdtempSync(join(tmpdir(), "harnix-exercise-run-check-"));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "t", scripts: { test: "node check.js" } }));
  writeFileSync(
    join(project, "check.js"),
    [
      "const fs = require('node:fs');",
      "if (fs.readFileSync('src/flag.txt', 'utf8').trim() === 'ok') { console.log('ok'); process.exit(0); }",
      "for (let i = 0; i < 60; i += 1) console.log('line ' + i + ' ' + process.cwd());",
      "console.error('assertion: flag is not ok');",
      "process.exit(1);",
      "",
    ].join("\n"),
  );
  for (const dir of ["src", "test"]) mkdirSync(join(project, dir));
  writeFileSync(join(project, "src", "flag.txt"), "bad\n");
  writeFileSync(join(project, "test", "a.js"), "x\n");
  spawnSync("git", ["init", "-q"], { cwd: project });
  return project;
}

/** Runs the whole scenario with the built CLI and returns the failure messages (empty when everything held). */
export function exerciseRunCheck(root, project, run = spawnSync) {
  const cli = (...args) => runCli(root, project, ["workflow", ...args], run);
  const failures = [];
  const expect = (label, condition, detail = "") => {
    if (!condition) failures.push(`${label}${detail === "" ? "" : `: ${detail}`}`);
  };

  cli(
    "--init",
    "--title",
    "Exercise run-check",
    "--slug",
    "exercise-run-check",
    "--mode",
    "lite",
    "--text",
    "Test xanh",
  );
  cli(
    "--set-check",
    "chk-focused",
    "--command",
    "npm test",
    "--scope",
    "focused",
    "--input",
    "src/**",
    "--criteria",
    "ac-1",
    "--description",
    "Chay thu nghiem",
  );
  expect("ready", cli("--transition", "ready/ready", "--brief").status === 0);
  expect("in_progress", cli("--transition", "in_progress/implementing", "--brief").status === 0);

  const failed = cli("--run-check", "chk-focused", "--brief");
  expect(
    "run-check without a command runs the declared one",
    failed.json?.result === "fail",
    failed.stderr.split("\n")[0],
  );
  expect("a failure returns logPath", failed.json?.logPath === LOG, JSON.stringify(failed.json));
  const logFile = join(project, ...LOG.split("/"));
  const log = existsSync(logFile) ? readFileSync(logFile, "utf8") : "";
  expect("the log holds the whole output", log.includes("line 59") && log.includes("flag is not ok"));
  expect("the log hides the machine path", !log.includes(project));
  expect(
    "an explicit command that differs is refused",
    cli("--run-check", "chk-focused", "--brief", "--", "node", "-e", "0").status !== 0,
  );

  const stopped = cli(
    "--run-checks",
    "--criterion",
    "ac-1",
    "--met",
    "--transition",
    "verifying/finishing",
    "--finish",
    "--brief",
  );
  expect(
    "a failing batch stops with the skipped steps",
    stopped.json?.ran?.[0]?.result === "fail",
    JSON.stringify(stopped.json),
  );
  expect(
    "the skipped steps are listed",
    JSON.stringify(stopped.json?.skipped) === JSON.stringify(["criterion", "transition", "finish"]),
  );

  writeFileSync(join(project, "src", "flag.txt"), "ok\n");
  const passed = cli("--run-check", "chk-focused", "--brief");
  expect(
    "a fixed check passes without repeating the command",
    passed.json?.result === "pass",
    passed.stderr.split("\n")[0],
  );
  expect("a pass removes the older log", !existsSync(logFile));

  const done = cli(
    "--run-checks",
    "--criterion",
    "ac-1",
    "--met",
    "--transition",
    "verifying/finishing",
    "--finish",
    "--brief",
  );
  expect(
    "the batch finishes the task in one command",
    done.json?.status === "completed",
    `${done.stderr.split("\n")[0]} ${JSON.stringify(done.json)}`,
  );
  return failures;
}

export function main(root = resolve(fileURLToPath(new URL("..", import.meta.url)))) {
  assertBuilt(root);
  const project = prepareProject();
  try {
    const init = runCli(root, project, ["init", "--user", "tester"]);
    if (init.status !== 0)
      throw new Error(`harnix init failed in the temporary project: ${init.stderr.split("\n")[0]}`);
    const failures = exerciseRunCheck(root, project);
    process.stdout.write(
      `exercised run-check, its failure log and the finish batch with dist/cli.js, ${String(failures.length)} failed\n`,
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
