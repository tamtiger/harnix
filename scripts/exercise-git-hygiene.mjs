import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

const IGNORE = ".harnix/.gitignore";
const ATTRIBUTES = ".harnix/.gitattributes";
const PROJECT_FACTS = ".harnix/spec/project-facts.md";
const ROOT_IGNORE = "node_modules/\n";
const ROOT_ATTRIBUTES = "* text=auto\n";

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
  return { status: result.status, json: line === undefined ? undefined : JSON.parse(line) };
}

const porcelain = (project) => git(project, "status", "--porcelain").stdout.trim();
const tracked = (project, path) => git(project, "ls-files", "--", path).stdout.trim();
const read = (project, path) => readFileSync(join(project, path), "utf8");

/** Each check returns an error message or `undefined`; every check runs on the same throwaway Git project. */
const CHECKS = [
  {
    name: "init writes both files inside .harnix and leaves the root .gitignore and .gitattributes alone",
    run: ({ project }) => {
      if (!existsSync(join(project, IGNORE)) || !existsSync(join(project, ATTRIBUTES))) return "a git file is missing";
      if (read(project, ".gitignore") !== ROOT_IGNORE) return "the root .gitignore changed";
      if (read(project, ".gitattributes") !== ROOT_ATTRIBUTES) return "the root .gitattributes changed";
      return undefined;
    },
  },
  {
    name: "after repo-map rewrites the cache git status shows nothing and the cache is not tracked",
    run: ({ root, project }) => {
      git(project, "add", "-A");
      git(project, "commit", "-q", "-m", "base");
      runCli(root, project, ["repo-map", "--query", "a"]);
      if (!existsSync(join(project, ".harnix", "cache", "repo-map-v1.json"))) return "the cache was not written";
      if (tracked(project, ".harnix/cache") !== "") return "the cache is tracked by git";
      const dirty = porcelain(project);
      return dirty === "" ? undefined : `git status is not clean: ${dirty.split("\n")[0]}`;
    },
  },
  {
    name: "the active pointer is ignored and the project data is checked out with LF",
    run: ({ root, project }) => {
      const task = runCli(root, project, ["workflow", "--init", "--title", "Case", "--slug", "case", "--text", "ok"]);
      if (task.status !== 0) return "workflow --init failed";
      if (!existsSync(join(project, ".harnix", "tasks", ".active"))) return "the active pointer was not written";
      if (git(project, "check-ignore", "-q", ".harnix/tasks/.active").status !== 0) return "the pointer is not ignored";
      const attribute = git(project, "check-attr", "eol", "--", ".harnix/config.yaml").stdout;
      return /eol: lf/u.test(attribute) ? undefined : `eol attribute is ${attribute.trim()}`;
    },
  },
  {
    name: "the ignore patterns are anchored: nested cache and tmp folders stay tracked",
    run: ({ project }) => {
      const ignored = (path) => git(project, "check-ignore", "-q", path).status === 0;
      for (const path of [".harnix/cache/x", ".harnix/tmp/x"]) {
        if (!ignored(path)) return `${path} is not ignored`;
      }
      for (const path of [
        ".harnix/spec/skills/foo/cache/x.md",
        ".harnix/workspace/u/tmp/y",
        ".harnix/tasks/2026-11/a/tmp/z",
      ]) {
        if (ignored(path)) return `${path} is ignored by a pattern that is not anchored`;
      }
      return undefined;
    },
  },
  {
    name: "a second update changes no file and reports both files as preserved",
    run: ({ root, project }) => {
      git(project, "add", "-A");
      git(project, "commit", "-q", "-m", "task");
      const result = runCli(root, project, ["update"]);
      if (result.status !== 0) return "update failed";
      const touched = [...result.json.created, ...result.json.updated].filter((path) => path !== PROJECT_FACTS);
      if (touched.length > 0) return `update changed ${touched.join(", ")}`;
      if (!result.json.preserved.includes(IGNORE) || !result.json.preserved.includes(ATTRIBUTES)) {
        return "a git file is not reported as preserved";
      }
      // project-facts.md records the Git HEAD, so it is the one derived file a new commit legitimately rewrites.
      const dirty = porcelain(project)
        .split("\n")
        .filter((line) => line !== "" && !line.endsWith(PROJECT_FACTS));
      return dirty.length === 0 ? undefined : `git status is not clean after update: ${dirty[0]}`;
    },
  },
  {
    name: "a user-edited .harnix/.gitignore survives update",
    run: ({ root, project }) => {
      writeFileSync(join(project, IGNORE), `${read(project, IGNORE)}workspace/\n`);
      const result = runCli(root, project, ["update"]);
      if (result.status !== 0) return "update failed";
      if (!read(project, IGNORE).includes("workspace/")) return "the user edit was overwritten";
      return result.json.preserved.includes(IGNORE) ? undefined : "the edited file is not reported as preserved";
    },
  },
  {
    name: "doctor prints the exact git command for a tracked cache and never changes the index",
    run: ({ root, project }) => {
      git(project, "add", "-f", ".harnix/cache");
      git(project, "commit", "-q", "-m", "oops");
      const before = git(project, "status", "--porcelain=v1", "--untracked-files=no").stdout;
      const doctor = runCli(root, project, ["doctor"]);
      const message = JSON.stringify(doctor.json ?? {});
      if (!message.includes("git rm -r --cached .harnix/cache")) return "doctor did not print the git command";
      if (tracked(project, ".harnix/cache") === "") return "doctor changed the git index";
      const after = git(project, "status", "--porcelain=v1", "--untracked-files=no").stdout;
      return before === after ? undefined : "doctor changed the working tree";
    },
  },
  {
    name: "uninstall --purge removes the git files with the rest of .harnix",
    run: ({ root, project }) => {
      const result = runCli(root, project, ["uninstall", "--purge", "--yes"]);
      if (result.status !== 0) return "uninstall failed";
      return existsSync(join(project, IGNORE)) || existsSync(join(project, ATTRIBUTES))
        ? "a git file survived the purge"
        : undefined;
    },
  },
];

export const CHECK_NAMES = CHECKS.map((check) => check.name);

/** Runs every check against the built CLI and returns the list of failures. */
export function exerciseGitHygiene(root) {
  const project = mkdtempSync(join(tmpdir(), "harnix-exercise-git-hygiene-"));
  const failures = [];
  try {
    writeFileSync(join(project, "package.json"), JSON.stringify({ name: "t", scripts: { test: "node -e 0" } }));
    writeFileSync(join(project, ".gitignore"), ROOT_IGNORE);
    writeFileSync(join(project, ".gitattributes"), ROOT_ATTRIBUTES);
    git(project, "init", "-q");
    const init = runCli(root, project, ["init", "--user", "tester"]);
    if (init.status !== 0) throw new Error("harnix init failed");
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
  const failures = exerciseGitHygiene(root);
  process.stdout.write(`${JSON.stringify({ checks: CHECKS.length, failed: failures.length, failures })}\n`);
  process.exitCode = failures.length === 0 ? 0 : 1;
}
