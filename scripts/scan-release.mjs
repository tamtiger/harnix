import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const artifacts = join(root, ".artifacts");
const tarballs = (await readdir(artifacts)).filter((name) => name.endsWith(".tgz"));
if (tarballs.length !== 1) throw new Error(`Expected one checked tarball, found ${tarballs.length}. Run pack:check first.`);

const temporary = await mkdtemp(join(tmpdir(), "harnix-release-scan-"));
try {
  const tarball = join(artifacts, tarballs[0]);
  const listing = run("tar", ["-tzf", tarball], root).stdout.split(/\r?\n/u).filter(Boolean);
  if (listing.some((path) => path.startsWith("/") || path.split("/").includes(".."))) throw new Error("Tarball contains an unsafe path.");
  if (listing.filter((path) => path === "package/package.json").length !== 1 || listing.some((path) => /pnpm-workspace\.yaml$/u.test(path))) throw new Error("Release must contain exactly one package and no workspace file.");
  run("tar", ["-xzf", tarball, "-C", temporary], root);

  const unpacked = join(temporary, "package");
  const notice = await readFile(join(unpacked, "NOTICE"), "utf8");
  for (const attribution of ["Trellis", "ECC", "Superpowers"]) if (!notice.includes(attribution)) throw new Error(`NOTICE is missing ${attribution} attribution.`);
  await readFile(join(unpacked, "LICENSE"), "utf8");

  const packagedFiles = await walk(unpacked);
  await scanTextFiles(packagedFiles, "tarball", false);
  const installRoot = join(temporary, "installed");
  await mkdir(installRoot);
  await writeFile(join(installRoot, "package.json"), '{"private":true}\n');
  const packageManagerEntrypoint = process.env.npm_execpath;
  if (!packageManagerEntrypoint) throw new Error("scan:release must run through pnpm or npm.");
  run(process.execPath, [packageManagerEntrypoint, "add", "--ignore-scripts", "--no-lockfile", tarball], installRoot);
  const installedCli = await realpath(join(installRoot, "node_modules", "@tamtiger", "harnix", "dist", "cli.js"));
  run(process.execPath, [installedCli, "--help"], installRoot);

  const fixture = join(temporary, "fixture");
  await mkdir(fixture);
  run(process.execPath, [installedCli, "init", "--yes", "--user", "scan", "--languages", "vue"], fixture);
  run(process.execPath, [installedCli, "setup", "--kiro", "--antigravity", "--codex"], fixture);
  const generatedFiles = await walk(fixture);
  await scanTextFiles(generatedFiles, "generated fixture", true);
  await assertSingleHooks(fixture);

  process.stdout.write(`${JSON.stringify({ package: packageJson.name, tarball: tarballs[0], packagedFiles: packagedFiles.length, generatedFiles: generatedFiles.length, scanned: ["secrets", "machine-paths", "required-todos", "forbidden-surfaces", "one-package", "one-bin", "dead-imports", "duplicate-hooks", "attribution"] })}\n`);
} finally {
  await rm(temporary, { force: true, recursive: true });
}

if (Object.keys(packageJson.bin ?? {}).join(",") !== "harnix") throw new Error("Release must expose exactly one harnix executable.");

async function scanTextFiles(files, scope, generated) {
  for (const file of files) {
    const text = await readFile(file, "utf8");
    if (/C:\\Users\\|\/home\/[^/]+\//u.test(text)) throw new Error(`Machine path found in ${scope}: ${file}.`);
    if (/(?:api[_-]?key|password|secret|token)\s*[=:]\s*['"][^'"]{8,}/iu.test(text)) throw new Error(`Potential secret found in ${scope}: ${file}.`);
    if (/(?:REQUIRED\s+TODO|TODO\s*\(required\))/iu.test(text)) throw new Error(`Required TODO found in ${scope}: ${file}.`);
    if (generated && /gemini-cli|claude|cursor|windsurf/iu.test(text)) throw new Error(`Forbidden platform surface found in generated output: ${file}.`);
    if (generated && /@mindfoldhq\/trellis|@tamtiger\/trellis/iu.test(text)) throw new Error(`Forbidden legacy product reference found in generated output: ${file}.`);
  }
}

async function assertSingleHooks(fixture) {
  const codex = JSON.parse(await readFile(join(fixture, ".codex", "hooks.json"), "utf8"));
  const codexCount = codex.hooks?.UserPromptSubmit?.filter((hook) => hook.command === "harnix internal context --platform codex").length ?? 0;
  if (codexCount !== 1) throw new Error(`Expected one Codex Harnix hook, found ${codexCount}.`);
  const kiro = JSON.parse(await readFile(join(fixture, ".kiro", "hooks", "harnix-context.kiro.hook"), "utf8"));
  if (kiro.then?.command !== "harnix internal context --platform kiro") throw new Error("Kiro Harnix hook command is missing or invalid.");
}

function run(executable, args, cwd) {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`${executable} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr ?? result.stdout ?? "unknown"}`);
  return result;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) { const path = join(directory, entry.name); if (entry.isDirectory()) result.push(...await walk(path)); else if (entry.isFile()) result.push(path); }
  return result;
}
