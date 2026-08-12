import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { createIsolatedUserEnvironment } from "./isolated-user-home.mjs";

const repository = resolve(fileURLToPath(new URL("..", import.meta.url)));
const artifacts = join(repository, ".artifacts");
const tarball = (await readdir(artifacts)).find((name) => name.endsWith(".tgz"));
if (!tarball) throw new Error("Run pnpm pack:check before smoke:tarball.");

for (const platforms of [["--kiro"], ["--antigravity"], ["--codex"], ["--kiro", "--antigravity", "--codex"]]) {
  const home = await mkdtemp(join(tmpdir(), "harnix-smoke-home-"));
  const packageManagerHome = await mkdtemp(join(tmpdir(), "harnix-smoke-package-manager-home-"));
  const project = await mkdtemp(join(tmpdir(), "harnix-smoke-project-"));
  try {
    const npmEntrypoint = process.env.npm_execpath;
    if (!npmEntrypoint) throw new Error("smoke:tarball must run through pnpm or npm.");
    const install = run(process.execPath, [npmEntrypoint, "add", "--ignore-scripts", "--no-lockfile", join(artifacts, tarball)], project, createIsolatedUserEnvironment(packageManagerHome));
    if (install.status !== 0) throw new Error(`tarball install failed: ${install.error?.message ?? install.stderr ?? install.stdout ?? "unknown"}`);

    const cli = join(project, "node_modules", "@tamtiger", "harnix", "dist", "cli.js");
    const environment = createIsolatedUserEnvironment(home, {
      pathPrefix: join(project, "node_modules", ".bin"),
    });
    run(process.execPath, [cli, "init", "--user", "smoke", "--languages", "vue"], project, environment);
    const setup = run(process.execPath, [cli, "setup", ...platforms, "--json"], project, environment);
    assertGlobalSetupResult(setup.stdout, platforms, home);
    await assertNoProjectLocalPlatformSurfaces(project);
    await assertExpectedGlobalSurfaces(home, platforms);
    process.stdout.write(`${JSON.stringify({ platforms, ok: true })}\n`);
  } finally {
    await Promise.all([
      rm(home, { force: true, recursive: true }),
      rm(packageManagerHome, { force: true, recursive: true }),
      rm(project, { force: true, recursive: true }),
    ]);
  }
}

function run(executable, args, cwd, env) {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8", env, windowsHide: true });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed: ${result.error?.message ?? result.stderr ?? result.stdout ?? "unknown"}`);
  }
  return result;
}

function assertGlobalSetupResult(output, platforms, home) {
  let result;
  try {
    result = JSON.parse(output);
  } catch {
    throw new Error(`setup --json did not return valid JSON: ${output}`);
  }
  const selected = platforms.map((flag) => flag.slice(2)).sort();
  const actual = Array.isArray(result.platforms) ? result.platforms.map((platform) => platform?.platform).sort() : [];
  if (result.scope !== "user" || JSON.stringify(actual) !== JSON.stringify(selected)) {
    throw new Error(`setup returned an unexpected global result: ${output}`);
  }
  if (output.includes(home)) throw new Error("setup JSON exposed the physical disposable home path.");
}

async function assertNoProjectLocalPlatformSurfaces(project) {
  const forbidden = [".agents", ".codex", ".gemini", ".kiro", "GEMINI.md"];
  const present = [];
  for (const name of forbidden) {
    try {
      await access(join(project, name));
      present.push(name);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  if (present.length > 0) throw new Error(`setup created project-local platform surfaces: ${present.join(", ")}`);
}

async function assertExpectedGlobalSurfaces(home, platforms) {
  const expected = [];
  if (platforms.includes("--kiro")) {
    expected.push(".kiro/harnix/managed.json", ".kiro/hooks/harnix-context.json", ".kiro/steering/harnix.md");
  }
  if (platforms.includes("--antigravity")) {
    for (const pluginRoot of [".gemini/config/plugins/harnix", ".gemini/antigravity-cli/plugins/harnix"]) {
      expected.push(`${pluginRoot}/.managed.json`, `${pluginRoot}/hooks.json`, `${pluginRoot}/plugin.json`, `${pluginRoot}/rules/harnix.md`);
    }
  }
  if (platforms.includes("--codex")) {
    expected.push(".agents/harnix/managed.json", ".agents/skills", ".codex/AGENTS.md", ".codex/harnix/managed.json", ".codex/hooks.json");
  }
  for (const relativePath of expected) {
    try {
      await access(join(home, ...relativePath.split("/")));
    } catch (error) {
      if (error?.code === "ENOENT") throw new Error(`missing expected global integration surface: ${relativePath}`);
      throw error;
    }
  }
}
