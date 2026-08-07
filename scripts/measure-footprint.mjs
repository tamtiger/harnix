import { lstat, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)); const fixture = await mkdtemp(join(tmpdir(), "harnix-footprint-"));
try {
  const result = spawnSync(process.execPath, [join(root, "dist", "cli.js"), "init", "--yes", "--user", "measure", "--languages", "vue"], { cwd: fixture, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const setup = spawnSync(process.execPath, [join(root, "dist", "cli.js"), "setup", "--kiro", "--antigravity", "--codex"], { cwd: fixture, encoding: "utf8" });
  if (setup.status !== 0) throw new Error(setup.stderr || setup.stdout);
  const paths = [".harnix", ".kiro", ".gemini", ".agents", ".codex", "AGENTS.md", "GEMINI.md"].map((name) => join(fixture, name)); const measurement = await measure(paths);
  const baselineBytes = 1_343_579; const baselineFiles = 236; const reduction = 1 - measurement.bytes / baselineBytes;
  process.stdout.write(`${JSON.stringify({ files: measurement.files, bytes: measurement.bytes, baselineFiles, baselineBytes, reduction })}\n`);
  if (reduction < 0.5) throw new Error("Harnix generated footprint is not at least 50% smaller than the frozen template baseline.");
} finally { await rm(fixture, { force: true, recursive: true }); }
async function measure(paths) { let files = 0, bytes = 0; for (const path of paths) { try { const item = await lstat(path); if (item.isFile()) { files += 1; bytes += item.size; } else if (item.isDirectory()) { const nested = await measure((await readdir(path)).map((name) => join(path, name))); files += nested.files; bytes += nested.bytes; } } catch (error) { if (error?.code !== "ENOENT") throw error; } } return { files, bytes }; }
