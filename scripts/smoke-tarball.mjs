import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repository = resolve(fileURLToPath(new URL("..", import.meta.url))); const artifacts = join(repository, ".artifacts");
const tarball = (await readdir(artifacts)).find((name) => name.endsWith(".tgz")); if (!tarball) throw new Error("Run pnpm pack:check before smoke:tarball.");
for (const platforms of [["--kiro"], ["--antigravity"], ["--codex"], ["--kiro", "--antigravity", "--codex"]]) {
  const fixture = await mkdtemp(join(tmpdir(), "harnix-smoke-"));
  try {
    const npmEntrypoint = process.env.npm_execpath;
    if (!npmEntrypoint) throw new Error("smoke:tarball must run through pnpm or npm.");
    const install = spawnSync(process.execPath, [npmEntrypoint, "add", "--ignore-scripts", "--no-lockfile", join(artifacts, tarball)], { cwd: fixture, encoding: "utf8" });
    if (install.status !== 0) throw new Error(`tarball install failed: ${install.error?.message ?? install.stderr ?? install.stdout ?? "unknown"}`);
    const cli = join(fixture, "node_modules", "@tamtiger", "harnix", "dist", "cli.js");
    for (const args of [["init", "--yes", "--user", "smoke", "--languages", "vue"], ["setup", ...platforms]]) { const run = spawnSync(process.execPath, [cli, ...args], { cwd: fixture, encoding: "utf8" }); if (run.status !== 0) throw new Error(`smoke ${args.join(" ")} failed: ${run.stderr || run.stdout}`); }
    process.stdout.write(`${JSON.stringify({ platforms, ok: true })}\n`);
  } finally { await rm(fixture, { force: true, recursive: true }); }
}
