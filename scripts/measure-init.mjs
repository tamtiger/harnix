import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const runs = [];
for (let index = 0; index < 3; index += 1) {
  const fixture = await mkdtemp(join(tmpdir(), "harnix-measure-init-"));
  try {
    const started = performance.now();
    const result = spawnSync(process.execPath, [join(root, "dist", "cli.js"), "init", "--yes", "--user", "measure", "--languages", "vue"], { cwd: fixture, encoding: "utf8" });
    if (result.status !== 0) throw new Error(`init run failed: ${result.stderr || result.stdout}`);
    runs.push(performance.now() - started);
  } finally { await rm(fixture, { force: true, recursive: true }); }
}
const ordered = [...runs].sort((left, right) => left - right); const median = ordered[1]; const worst = ordered.at(-1);
process.stdout.write(`${JSON.stringify({ command: "harnix init --yes", runs, median, worst })}\n`);
if (worst >= 5000) throw new Error(`init worst run ${worst.toFixed(1)}ms exceeds 5 seconds.`);
