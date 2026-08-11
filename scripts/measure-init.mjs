import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { createIsolatedUserEnvironment } from "./isolated-user-home.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const runs = [];
for (let index = 0; index < 3; index += 1) {
  const fixture = await mkdtemp(join(tmpdir(), "harnix-measure-init-project-"));
  const home = await mkdtemp(join(tmpdir(), "harnix-measure-init-home-"));
  try {
    await createRepresentativeFixture(fixture);
    const started = performance.now();
    const result = spawnSync(process.execPath, [join(root, "dist", "cli.js"), "init", "--yes", "--user", "measure"], {
      cwd: fixture,
      encoding: "utf8",
      env: createIsolatedUserEnvironment(home),
      windowsHide: true,
    });
    if (result.status !== 0) throw new Error(`init run failed: ${result.error?.message || result.stderr || result.stdout || "unknown command failure"}`);
    runs.push(performance.now() - started);
  } finally {
    await Promise.all([
      rm(fixture, { force: true, recursive: true }),
      rm(home, { force: true, recursive: true }),
    ]);
  }
}
const ordered = [...runs].sort((left, right) => left - right); const median = ordered[1]; const worst = ordered.at(-1);
process.stdout.write(`${JSON.stringify({ command: "harnix init --yes", fixture: "representative-vue-nest-monorepo-with-ignored-trees", repetitions: runs.length, runs, median, worst })}\n`);
if (worst >= 5000) throw new Error(`init worst run ${worst.toFixed(1)}ms exceeds 5 seconds.`);

async function createRepresentativeFixture(directory) {
  await mkdir(join(directory, "apps", "api", "src"), { recursive: true });
  await mkdir(join(directory, "coverage", "nested", "reports"), { recursive: true });
  await mkdir(join(directory, ".cache", "bundler"), { recursive: true });
  await writeFile(join(directory, "package.json"), JSON.stringify({ private: true, dependencies: { vue: "latest" } }));
  await writeFile(join(directory, "apps", "api", "package.json"), JSON.stringify({ dependencies: { "@nestjs/core": "latest" } }));
  await writeFile(join(directory, "apps", "api", "src", "main.ts"), "export const app = true;\n");
  await writeFile(join(directory, "coverage", "nested", "reports", "package.json"), JSON.stringify({ dependencies: { react: "latest", "react-dom": "latest" } }));
  await writeFile(join(directory, ".cache", "bundler", "pom.xml"), "<project><artifactId>ignored</artifactId></project>\n");
}
