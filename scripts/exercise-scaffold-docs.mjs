import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

function runCli(root, cwd, args) {
  const result = spawnSync(process.execPath, [join(root, "dist", "cli.js"), ...args], { cwd, encoding: "utf8" });
  const line = String(result.stdout ?? "")
    .split("\n")
    .reverse()
    .find((entry) => entry.startsWith("{"));
  return { status: result.status, json: line === undefined ? {} : JSON.parse(line) };
}

const workflow = (root, project, ...args) => runCli(root, project, ["workflow", ...args]);
const errorText = (result) => `${result.json.error?.message ?? ""}\n${result.json.error?.hint ?? ""}`;

/** Finds the directory of the one task whose id ends with `slug`, wherever the month bucket puts it. */
function taskDirectory(project, slug) {
  const tasks = join(project, ".harnix", "tasks");
  for (const month of readdirSync(tasks, { withFileTypes: true })) {
    if (!month.isDirectory()) continue;
    for (const entry of readdirSync(join(tasks, month.name))) {
      if (entry.endsWith(`-${slug}`)) return join(tasks, month.name, entry);
    }
  }
  throw new Error(`no task directory for ${slug}`);
}

const FULL_SLUG = "scaffold-case";
const read = (project, name) => readFileSync(join(taskDirectory(project, FULL_SLUG), name), "utf8");
const BOM = "﻿";
const VIETNAMESE_PRD = "# PRD viết tay\n\nTiếng Việt có dấu: đường dẫn, kiểm chứng, nạp tệp.\n";

/** Each check returns an error message or `undefined`; every check runs on the same throwaway project. */
const CHECKS = [
  {
    name: "scaffold-docs leaves the unedited scaffold of a Full task alone and writes nothing",
    run: ({ root, project }) => {
      const before = [read(project, "prd.md"), read(project, "plan.md")];
      const result = workflow(root, project, "--scaffold-docs");
      if (result.status !== 0) return `scaffold-docs failed: ${errorText(result)}`;
      if (JSON.stringify(result.json.written) !== "[]") return `it wrote ${JSON.stringify(result.json.written)}`;
      return before[0] === read(project, "prd.md") && before[1] === read(project, "plan.md")
        ? undefined
        : "a document changed";
    },
  },
  {
    name: "after a criterion is added scaffold-docs is refused with --force in the hint and changes nothing",
    run: ({ root, project }) => {
      const added = workflow(
        root,
        project,
        "--add-criterion",
        "ac-2",
        "--text",
        "Tiêu chí thêm sau",
        "--check",
        "check-suite",
      );
      if (added.status !== 0) return `--add-criterion failed: ${errorText(added)}`;
      const before = read(project, "plan.md");
      const result = workflow(root, project, "--scaffold-docs");
      if (result.status === 0) return "the stale scaffold was replaced without --force";
      if (!errorText(result).includes("--force")) return `the refusal does not name --force: ${errorText(result)}`;
      return before === read(project, "plan.md") ? undefined : "plan.md changed despite the refusal";
    },
  },
  {
    name: "scaffold-docs --force regenerates both files from the criteria and checks and ready finds no placeholder",
    run: ({ root, project }) => {
      const result = workflow(root, project, "--scaffold-docs", "--force");
      if (result.status !== 0) return `scaffold-docs --force failed: ${errorText(result)}`;
      if (JSON.stringify(result.json.written) !== JSON.stringify(["prd.md", "plan.md"])) return "it did not write both";
      const plan = read(project, "plan.md");
      if (!plan.includes("ac-2") || !plan.includes("[check-suite]")) return "plan.md misses ac-2 or the check line";
      if (!read(project, "prd.md").includes("**ac-2**: Tiêu chí thêm sau")) return "prd.md misses the new criterion";
      const dry = workflow(root, project, "--transition", "ready/ready", "--dry-run");
      const issues = (dry.json.issues ?? []).filter((issue) => /placeholder|plan\.md|prd\.md/u.test(issue));
      return issues.length === 0 ? undefined : `ready reports ${issues[0]}`;
    },
  },
  {
    name: "scaffold-docs --prd-file loads Vietnamese UTF-8 text byte for byte and drops the BOM",
    run: ({ root, project }) => {
      writeFileSync(join(project, "prd-input.md"), `${BOM}${VIETNAMESE_PRD}`, "utf8");
      const result = workflow(root, project, "--scaffold-docs", "--prd-file", "prd-input.md");
      if (result.status !== 0) return `scaffold-docs --prd-file failed: ${errorText(result)}`;
      const written = readFileSync(join(taskDirectory(project, FULL_SLUG), "prd.md"));
      return Buffer.compare(written, Buffer.from(VIETNAMESE_PRD, "utf8")) === 0
        ? undefined
        : "prd.md is not the file content without the BOM";
    },
  },
  {
    name: "a document with content of its own is kept: scaffold-docs is refused and the text survives",
    run: ({ root, project }) => {
      const result = workflow(root, project, "--scaffold-docs");
      if (result.status === 0) return "the edited prd.md was replaced without --force";
      if (!errorText(result).includes("--force")) return "the refusal does not name --force";
      return read(project, "prd.md") === VIETNAMESE_PRD ? undefined : "the edited prd.md changed";
    },
  },
  {
    name: "a text read with the wrong encoding is refused even with --force",
    run: ({ root, project }) => {
      writeFileSync(join(project, "broken.md"), "# Sai m�a\n", "utf8");
      const result = workflow(root, project, "--scaffold-docs", "--prd-file", "broken.md", "--force");
      if (result.status === 0) return "a text with U+FFFD was saved";
      return read(project, "prd.md") === VIETNAMESE_PRD ? undefined : "prd.md changed after the refusal";
    },
  },
  {
    name: "a Lite task is refused and the hint gives the command for a Full task",
    run: ({ root, project }) => {
      const lite = workflow(
        root,
        project,
        "--init",
        "--title",
        "Lite",
        "--slug",
        "lite-case",
        "--text",
        "ok",
        "--no-activate",
      );
      if (lite.status !== 0) return `creating the Lite task failed: ${errorText(lite)}`;
      const result = workflow(root, project, "--scaffold-docs", "--task", String(lite.json.id));
      if (result.status === 0) return "a Lite task was scaffolded";
      return errorText(result).includes("--init --mode full") ? undefined : `the hint is ${errorText(result)}`;
    },
  },
  {
    name: "--task scaffolds a Full task that is planning but not active, leaves the active pointer alone, and a cancelled task is refused",
    run: ({ root, project }) => {
      const pointer = () => readFileSync(join(project, ".harnix", "tasks", ".active"), "utf8");
      const full = workflow(
        root,
        project,
        "--init",
        "--mode",
        "full",
        "--title",
        "Task phụ",
        "--slug",
        "second-full",
        "--text",
        "Tiêu chí đầu",
        "--no-activate",
      );
      if (full.status !== 0) return `creating the second Full task failed: ${errorText(full)}`;
      const id = String(full.json.id);
      const added = workflow(
        root,
        project,
        "--task",
        id,
        "--add-criterion",
        "ac-2",
        "--text",
        "Tiêu chí thêm sau",
        "--check",
        "check-suite",
      );
      if (added.status !== 0) return `adding a criterion to the second task failed: ${errorText(added)}`;
      const activeBefore = pointer();
      const refused = workflow(root, project, "--scaffold-docs", "--task", id);
      if (refused.status === 0) return "a scaffold that lags the new criterion was written without --force";
      const forced = workflow(root, project, "--scaffold-docs", "--task", id, "--force");
      if (forced.status !== 0) return `scaffold-docs --task --force failed: ${errorText(forced)}`;
      if (!readFileSync(join(taskDirectory(project, "second-full"), "plan.md"), "utf8").includes("ac-2")) {
        return "the regenerated plan.md does not mention the criterion added later";
      }
      if (pointer() !== activeBefore) return "the active pointer moved";
      const cancelled = workflow(root, project, "--cancel", "--task", id, "--reason", "Task phụ không còn cần thiết");
      if (cancelled.status !== 0) return `cancelling the second task failed: ${errorText(cancelled)}`;
      const after = workflow(root, project, "--scaffold-docs", "--task", id, "--force");
      return after.status === 0 ? "a cancelled task was scaffolded" : undefined;
    },
  },
  {
    name: "--force is refused without --scaffold-docs and names the action that owns it",
    run: ({ root, project }) => {
      const result = workflow(root, project, "--inspect", "--force");
      if (result.status === 0) return "--force was accepted with --inspect";
      return errorText(result).includes("--scaffold-docs") ? undefined : `the hint is ${errorText(result)}`;
    },
  },
];

export const CHECK_NAMES = CHECKS.map((check) => check.name);

/** Runs every check against the built CLI and returns the list of failures. */
export function exerciseScaffoldDocs(root) {
  const project = mkdtempSync(join(tmpdir(), "harnix-exercise-scaffold-docs-"));
  const failures = [];
  try {
    writeFileSync(join(project, "package.json"), JSON.stringify({ name: "t", scripts: { test: "node -e 0" } }));
    spawnSync("git", ["init", "-q"], { cwd: project });
    const init = runCli(root, project, ["init", "--user", "tester"]);
    if (init.status !== 0) throw new Error("harnix init failed");
    const task = workflow(
      root,
      project,
      "--init",
      "--mode",
      "full",
      "--title",
      "Khung tài liệu",
      "--slug",
      FULL_SLUG,
      "--goal",
      "Sinh khung prd và plan",
      "--text",
      "Khung phản ánh tiêu chí",
    );
    if (task.status !== 0) throw new Error(`creating the Full task failed: ${errorText(task)}`);
    for (const check of CHECKS) {
      const failure = check.run({ root, project });
      if (failure !== undefined) failures.push(`${check.name}: ${failure}`);
    }
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
  return failures;
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
  assertBuilt(root);
  const failures = exerciseScaffoldDocs(root);
  process.stdout.write(`${JSON.stringify({ checks: CHECKS.length, failed: failures.length, failures })}\n`);
  process.exitCode = failures.length === 0 ? 0 : 1;
}
