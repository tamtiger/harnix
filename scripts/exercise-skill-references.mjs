import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

/** Pairs `harnix skill <name> --reference <topic>` named in the skill sources (placeholders such as `<topic>` never match). */
export const REFERENCE_MENTION = /harnix skill (harnix-[a-z0-9-]+) --reference ([a-z0-9]+(?:-[a-z0-9]+)*)/gu;

export function markdownFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return path.endsWith(".md") ? [path] : [];
  });
}

export function mentionedReferences(skillsDirectory) {
  const pairs = new Set();
  for (const file of markdownFiles(skillsDirectory)) {
    for (const match of readFileSync(file, "utf8").matchAll(REFERENCE_MENTION)) pairs.add(`${match[1]} ${match[2]}`);
  }
  return [...pairs].sort().map((pair) => pair.split(" "));
}

/** Runs the built CLI for one pair; a failure names the pair, the exit code and the first output line. */
export function exerciseReference(root, skill, topic, run = spawnSync) {
  const result = run(process.execPath, [join(root, "dist", "cli.js"), "skill", skill, "--reference", topic], {
    cwd: root,
    encoding: "utf8",
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const content = result.status === 0 ? String(JSON.parse(result.stdout).content ?? "").trim() : "";
  if (result.status === 0 && content !== "") return undefined;
  return `${skill} --reference ${topic}: exit ${String(result.status)}${result.status === 0 ? ", empty content" : ""}: ${out.split("\n")[0]}`;
}

export function main(root = resolve(fileURLToPath(new URL("..", import.meta.url)))) {
  assertBuilt(root);
  const pairs = mentionedReferences(join(root, "src", "skills"));
  const failures = pairs.flatMap(([skill, topic]) => exerciseReference(root, skill, topic) ?? []);
  process.stdout.write(
    `exercised ${String(pairs.length)} skill references with dist/cli.js, ${String(failures.length)} failed\n`,
  );
  for (const failure of failures) process.stderr.write(`${failure}\n`);
  return failures.length === 0 ? 0 : 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
