import { lstat, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { createIsolatedUserEnvironment } from "./isolated-user-home.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const project = await mkdtemp(join(tmpdir(), "harnix-footprint-project-"));
const home = await mkdtemp(join(tmpdir(), "harnix-footprint-home-"));

try {
  const environment = createIsolatedUserEnvironment(home);
  run(process.execPath, [join(root, "dist", "cli.js"), "init", "--user", "measure", "--languages", "vue"], project, environment);
  const setup = run(process.execPath, [join(root, "dist", "cli.js"), "setup", "--kiro", "--antigravity", "--codex"], project, environment, [0, 1]);
  assertSetupExitContract(setup);
  await assertNoProjectLocalPlatformSurfaces(project);
  await assertExpectedGlobalSurfaces(home);

  const projectMeasurement = await measure([".harnix", "AGENTS.md"].map((name) => join(project, name)));
  const globalMeasurement = await measure([
    ".agents",
    ".codex",
    ".gemini/config/plugins/harnix",
    ".gemini/antigravity-cli/plugins/harnix",
    ".kiro",
  ].map((name) => join(home, ...name.split("/"))));
  const measurement = {
    bytes: projectMeasurement.bytes + globalMeasurement.bytes,
    files: projectMeasurement.files + globalMeasurement.files,
  };
  const baselineBytes = 1_343_579;
  const baselineFiles = 236;
  const reduction = 1 - measurement.bytes / baselineBytes;
  process.stdout.write(`${JSON.stringify({
    ...measurement,
    baselineFiles,
    baselineBytes,
    global: globalMeasurement,
    project: projectMeasurement,
    reduction,
  })}\n`);
  if (reduction < 0.5) throw new Error("Harnix generated footprint is not at least 50% smaller than the frozen template baseline.");
} finally {
  await Promise.all([
    rm(home, { force: true, recursive: true }),
    rm(project, { force: true, recursive: true }),
  ]);
}

function run(executable, args, cwd, env, expectedStatuses = [0]) {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8", env, windowsHide: true });
  if (!expectedStatuses.includes(result.status)) throw new Error(result.error?.message || result.stderr || result.stdout || "unknown command failure");
  return result;
}

function assertSetupExitContract({ status, stderr, stdout }) {
  let result;
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new Error(`setup did not return valid JSON: ${stdout}`);
  }
  if (result?.scope !== "user" || !Array.isArray(result.platforms)) throw new Error(`setup returned an unexpected global result: ${stdout}`);
  const actionable = result.platforms.some((platform) => platform?.readiness !== "installed" || !Array.isArray(platform?.warnings) || platform.warnings.length > 0);
  const expectedStatus = actionable ? 1 : 0;
  if (status !== expectedStatus) throw new Error(`setup returned exit ${status}; expected ${expectedStatus} for its readiness result.`);
  if (actionable !== (stderr.trim().length > 0)) throw new Error("setup stderr did not match its actionable readiness result.");
}

async function assertNoProjectLocalPlatformSurfaces(projectRoot) {
  const forbidden = [".agents", ".codex", ".gemini", ".kiro", "GEMINI.md"];
  const present = [];
  for (const name of forbidden) {
    try {
      await lstat(join(projectRoot, name));
      present.push(name);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  if (present.length > 0) throw new Error(`setup created project-local platform surfaces: ${present.join(", ")}`);
}

async function assertExpectedGlobalSurfaces(homeRoot) {
  const required = [
    ".agents/harnix/managed.json",
    ".agents/skills",
    ".codex/AGENTS.md",
    ".codex/harnix/managed.json",
    ".codex/config.toml",
    ".gemini/antigravity-cli/plugins/harnix/.managed.json",
    ".gemini/config/plugins/harnix/.managed.json",
    ".kiro/harnix/managed.json",
    ".kiro/hooks/harnix-context.json",
  ];
  for (const relativePath of required) {
    try {
      await lstat(join(homeRoot, ...relativePath.split("/")));
    } catch (error) {
      if (error?.code === "ENOENT") throw new Error(`missing expected global integration surface: ${relativePath}`);
      throw error;
    }
  }
}

async function measure(paths) {
  let files = 0;
  let bytes = 0;
  for (const path of paths) {
    try {
      const item = await lstat(path);
      if (item.isFile()) {
        files += 1;
        bytes += item.size;
      } else if (item.isDirectory()) {
        const nested = await measure((await readdir(path)).map((name) => join(path, name)));
        files += nested.files;
        bytes += nested.bytes;
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return { files, bytes };
}
