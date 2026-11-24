import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertBuilt } from "./assert-built.mjs";

const CASES = "test/workflow/skill-routing-cases.json";

/** Runs the built CLI `skill --suggest` from a directory with no Harnix project, so only the shipped skills answer. */
export function suggestWithCli(root, cwd, query, run = spawnSync) {
  const result = run(process.execPath, [join(root, "dist", "cli.js"), "skill", "--suggest", query], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(`skill --suggest "${query}": exit ${String(result.status)}: ${result.stderr}`);
  return JSON.parse(result.stdout).suggestions.map((suggestion) => suggestion.name);
}

const ratio = (hits, total) => (total === 0 ? 0 : hits / total);

/** Measures the routing cases against the built CLI and returns the failures against the stored floors. */
export function exerciseRouting(root, cwd, suggest = suggestWithCli) {
  const fixture = JSON.parse(readFileSync(join(root, CASES), "utf8"));
  const top = (query) => suggest(root, cwd, query);
  const triggers = fixture.cases.filter((entry) => entry.shouldTrigger);
  const nearMisses = fixture.cases.filter((entry) => !entry.shouldTrigger);
  const hit1 = ratio(triggers.filter((entry) => top(entry.query)[0] === entry.expect).length, triggers.length);
  const hit3 = ratio(
    triggers.filter((entry) => top(entry.query).slice(0, 3).includes(entry.expect)).length,
    triggers.length,
  );
  const falseTrigger = ratio(
    nearMisses.filter((entry) => top(entry.query)[0] === entry.expect).length,
    nearMisses.length,
  );
  const failures = [];
  if (hit1 < fixture.floors.hit1) failures.push(`hit@1 ${hit1.toFixed(2)} is below the floor ${fixture.floors.hit1}`);
  if (hit3 < fixture.floors.hit3) failures.push(`hit@3 ${hit3.toFixed(2)} is below the floor ${fixture.floors.hit3}`);
  if (falseTrigger > fixture.floors.falseTrigger)
    failures.push(`false trigger ${falseTrigger.toFixed(2)} is above the ceiling ${fixture.floors.falseTrigger}`);
  for (const query of fixture.noMatch) {
    const names = top(query);
    if (names.length > 0) failures.push(`"${query}" should suggest nothing, got ${names.slice(0, 3).join(", ")}`);
  }
  return { hit1, hit3, falseTrigger, failures };
}

export function main(root = resolve(fileURLToPath(new URL("..", import.meta.url)))) {
  assertBuilt(root);
  const cwd = mkdtempSync(join(tmpdir(), "harnix-routing-"));
  try {
    const { hit1, hit3, falseTrigger, failures } = exerciseRouting(root, cwd);
    process.stdout.write(
      `exercised skill routing with dist/cli.js: hit@1 ${hit1.toFixed(2)}, hit@3 ${hit3.toFixed(2)}, false trigger ${falseTrigger.toFixed(2)}, ${String(failures.length)} failed\n`,
    );
    for (const failure of failures) process.stderr.write(`${failure}\n`);
    return failures.length === 0 ? 0 : 1;
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
