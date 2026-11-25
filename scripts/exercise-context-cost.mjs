import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

const NOTE = "Pool database connections per request scope";

function runCli(root, cwd, args, input) {
  const result = spawnSync(process.execPath, [join(root, "dist", "cli.js"), ...args], {
    cwd,
    encoding: "utf8",
    ...(input === undefined ? {} : { input }),
  });
  const line = String(result.stdout ?? "")
    .split("\n")
    .reverse()
    .find((entry) => entry.startsWith("{"));
  return {
    status: result.status,
    stdout: String(result.stdout ?? ""),
    json: line === undefined ? undefined : safeParse(line),
    stderr: String(result.stderr ?? ""),
  };
}

function safeParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
}

function prepareProject(root) {
  const project = mkdtempSync(join(tmpdir(), "harnix-exercise-context-cost-"));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "t", scripts: { test: "node -e 0" } }));
  const init = runCli(root, project, ["init", "--user", "tester"]);
  if (init.status !== 0) throw new Error(`harnix init failed: ${init.stderr.split("\n")[0]}`);
  const task = runCli(root, project, [
    "workflow",
    "--init",
    "--title",
    "Giảm chi phí context",
    "--slug",
    "context-cost",
    "--text",
    "Khối hook không chèn lại khi chỉ đổi trạng thái",
  ]);
  if (task.status !== 0) throw new Error(`workflow --init failed: ${task.stderr.split("\n")[0]}`);
  return project;
}

/** One hook turn: what `harnix context --platform claude` prints for this session. */
function printed(root, project, sessionId) {
  const event = JSON.stringify({ hook_event_name: "UserPromptSubmit", cwd: project, session_id: sessionId });
  return runCli(root, project, ["context", "--platform", "claude"], event).stdout;
}

/** The number of characters one hook turn prints. */
function turn(root, project, sessionId) {
  return printed(root, project, sessionId).length;
}

function writeNote(project) {
  const directory = join(project, ".harnix", "workspace", "tester", "journal");
  mkdirSync(directory, { recursive: true });
  const learning = {
    id: "obs-0000000000000001",
    statement: NOTE,
    sourceTaskIds: ["20260101-000000-a", "20260101-000001-b"],
    evidenceIds: ["ev-one", "ev-two"],
    occurrences: 2,
    confidence: 0.8,
    status: "candidate",
  };
  const entry = {
    generator: "harnix",
    schemaVersion: 1,
    id: "obs-0000000000000001-entry",
    recordedAt: new Date().toISOString(),
    developer: "tester",
    kind: "learning",
    summary: "Learning candidate: obs-0000000000000001",
    evidenceIds: learning.evidenceIds,
    learning,
  };
  writeFileSync(join(directory, "2026-01-01.jsonl"), `${JSON.stringify(entry)}\n`);
}

function setLearningMax(project, value) {
  const path = join(project, ".harnix", "config.yaml");
  const text = readFileSync(path, "utf8");
  const next = text.replace(/^context:\n/mu, `context:\n  learningMax: ${String(value)}\n`);
  if (next === text) throw new Error("config.yaml has no context block to edit");
  writeFileSync(path, next);
}

/** What the hook printed: characters per turn, and whether the learning note showed up. */
export function judge(sizes) {
  const failures = [];
  if (sizes.first === 0) failures.push("the first turn printed nothing");
  if (sizes.sameState !== 0) failures.push(`an unchanged second turn printed ${String(sizes.sameState)} characters`);
  if (sizes.afterTransition !== 0) {
    failures.push(`a turn after only a status change printed ${String(sizes.afterTransition)} characters`);
  }
  if (sizes.afterTitle === 0) failures.push("a changed title did not print the block again");
  if (!sizes.noteByDefault) failures.push("the learning note did not show by default while planning");
  if (sizes.noteWhenZero) failures.push("learningMax 0 still showed the learning note");
  return failures;
}

/** Runs every scenario with the built CLI and returns the failure messages plus the measured sizes. */
export function exercise(root, project) {
  const sizes = {};
  const cli = (...args) => runCli(root, project, args);
  const hasNote = (sessionId) => printed(root, project, sessionId).includes(NOTE);

  sizes.first = turn(root, project, "sess-a");
  sizes.sameState = turn(root, project, "sess-a");

  cli("workflow", "--transition", "ready/ready");
  sizes.afterTransition = turn(root, project, "sess-a");

  cli("workflow", "--set-title", "Giảm chi phí context mỗi lượt", "--reason", "đổi tiêu đề để kiểm in lại");
  sizes.afterTitle = turn(root, project, "sess-a");

  // Learning notes show only while planning, so continue on a fresh planning task.
  cli("workflow", "--cancel", "--reason", "chuyển sang kiểm ghi chú học");
  cli("workflow", "--init", "--title", "Ghi chú học", "--slug", "learning-notes", "--text", "Ghi chú học hiện đúng");
  writeNote(project);
  sizes.withNote = turn(root, project, "sess-b");
  sizes.noteByDefault = hasNote("sess-c");

  setLearningMax(project, 0);
  sizes.noteWhenZero = hasNote("sess-d");
  sizes.withoutNote = turn(root, project, "sess-e");
  return { failures: judge(sizes), sizes };
}

export function main(root = resolve(fileURLToPath(new URL("..", import.meta.url)))) {
  assertBuilt(root);
  const project = prepareProject(root);
  try {
    const { failures, sizes } = exercise(root, project);
    process.stdout.write(
      `exercised the hook context with dist/cli.js in a temporary project: ${JSON.stringify(sizes)}, ${String(failures.length)} failed\n`,
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
