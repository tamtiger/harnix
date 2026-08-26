import { access, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { builtinModules, createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { createIsolatedUserEnvironment } from "./isolated-user-home.mjs";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const runtimeDependencyFields = ["dependencies", "optionalDependencies", "peerDependencies"];
const packageImportExtensions = ["", ".js", ".mjs", ".cjs", ".json"];
const executableExtensions = new Set([".cjs", ".js", ".mjs"]);
const builtinSpecifiers = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const potentialSecretPattern = /(?:api[_-]?key|password|secret|token)\s*([=:])\s*(?:['"][^'"]{8,}|([A-Za-z0-9][A-Za-z0-9._~+/-]{7,}))/giu;

export async function runReleaseScan(options = {}) {
  const root = options.root ?? repositoryRoot;
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const artifacts = join(root, ".artifacts");
  const tarballs = (await readdir(artifacts)).filter((name) => name.endsWith(".tgz"));
  if (tarballs.length !== 1) throw new Error(`Expected one checked tarball, found ${tarballs.length}. Run pack:check first.`);

  const temporary = await mkdtemp(join(options.temporaryDirectory ?? tmpdir(), "harnix-release-scan-"));
  try {
    const packageManagerHome = join(temporary, "package-manager-home");
    const userHome = join(temporary, "user-home");
    await mkdir(packageManagerHome);
    await mkdir(userHome);
    const tarball = join(artifacts, tarballs[0]);
    const listing = run("tar", ["-tzf", tarball], root).stdout.split(/\r?\n/u).filter(Boolean);
    await assertTarballListing(listing);
    run("tar", ["-xzf", tarball, "-C", temporary], root);

    const unpacked = join(temporary, "package");
    const packedPackageJson = JSON.parse(await readFile(join(unpacked, "package.json"), "utf8"));
    assertSingleHarnixExecutable(packedPackageJson);
    assertAttribution(await readFile(join(unpacked, "NOTICE"), "utf8"));
    await readFile(join(unpacked, "LICENSE"), "utf8");

    const packagedFiles = await walk(unpacked);
    await scanTextFiles(packagedFiles, "tarball", false);
    await assertNoDeadPackagedImports(unpacked, packedPackageJson);

    const installRoot = join(temporary, "installed");
    await mkdir(installRoot);
    await writeFile(join(installRoot, "package.json"), '{"private":true}\n');
    const packageManagerEntrypoint = process.env.npm_execpath;
    if (!packageManagerEntrypoint) throw new Error("scan:release must run through pnpm or npm.");
    run(process.execPath, [packageManagerEntrypoint, "add", "--ignore-scripts", "--no-lockfile", tarball], installRoot, createIsolatedUserEnvironment(packageManagerHome));
    const installedCli = await realpath(join(installRoot, "node_modules", "@tamtiger", "harnix", "dist", "cli.js"));
    const installedPackage = resolve(installedCli, "..", "..");
    const installedRequire = createRequire(join(installedPackage, "package.json"));
    await assertNoDeadPackagedImports(installedPackage, packedPackageJson, {
      resolveBareSpecifier: (specifier) => installedRequire.resolve(specifier),
    });
    const integrationEnvironment = createIsolatedUserEnvironment(userHome, {
      pathPrefix: join(installRoot, "node_modules", ".bin"),
    });
    run(process.execPath, [installedCli, "--help"], installRoot, integrationEnvironment);

    const fixture = join(temporary, "fixture");
    await mkdir(fixture);
    run(process.execPath, [installedCli, "init", "--user", "scan", "--languages", "vue"], fixture, integrationEnvironment);
    const setup = run(process.execPath, [installedCli, "setup", "--kiro", "--antigravity", "--codex"], fixture, integrationEnvironment, undefined, [0, 1]);
    assertSetupExitContract(setup);
    const generatedFiles = [...await walk(fixture), ...await walk(userHome)];
    await scanTextFiles(generatedFiles, "generated fixture", true);
    await assertExpectedGlobalSurfaces(userHome);
    await assertNoProjectLocalPlatformSurfaces(fixture);
    await assertSingleHooks(userHome);
    const ordinaryWorkspace = join(temporary, "ordinary-workspace");
    await mkdir(ordinaryWorkspace);
    const nonHarnixContextPerformance = measureNonHarnixContextFastPath(installedCli, ordinaryWorkspace, integrationEnvironment);
    if ((await readdir(ordinaryWorkspace)).length !== 0) {
      throw new Error("Non-Harnix context hook must not write to the workspace.");
    }

    process.stdout.write(`${JSON.stringify({ package: packageJson.name, tarball: tarballs[0], packagedFiles: packagedFiles.length, generatedFiles: generatedFiles.length, nonHarnixContextPerformance, scanned: ["secrets", "machine-paths", "required-todos", "forbidden-surfaces", "one-package", "one-bin", "dead-imports", "duplicate-hooks", "attribution", "non-harnix-context-performance"] })}\n`);
  } finally {
    await rm(temporary, { force: true, recursive: true });
  }
}

export async function assertTarballListing(listing) {
  if (listing.some(isUnsafeTarballPath)) throw new Error("Tarball contains an unsafe path.");
  if (listing.filter((path) => path === "package/package.json").length !== 1) throw new Error("Release must contain exactly one package.");
  if (listing.some((path) => /(?:^|[/\\])pnpm-workspace\.yaml$/u.test(path))) throw new Error("Release must not contain a workspace file.");
}

export function assertSingleHarnixExecutable(packageJson) {
  const bin = packageJson.bin ?? {};
  if (Object.keys(bin).length !== 1 || bin.harnix !== "./dist/cli.js") throw new Error("Release must expose exactly one harnix executable.");
}

export function assertAttribution(notice) {
  for (const attribution of ["Trellis", "ECC", "Superpowers"]) {
    if (!notice.includes(attribution)) throw new Error(`NOTICE is missing ${attribution} attribution.`);
  }
}

export async function scanTextFiles(files, scope, generated) {
  for (const file of files) {
    const content = await readFile(file);
    if (content.includes(0)) continue;
    const text = content.toString("utf8");
    if (/(?:[A-Za-z]:[\\/]Users[\\/]|\/(?:home|Users)\/[^/]+\/|\\\\(?:\?\\[A-Za-z]:\\|[A-Za-z0-9._-]+\\[A-Za-z0-9$._-]+\\))/u.test(text)) throw new Error(`Machine path found in ${scope}: ${file}.`);
    if (containsPotentialSecret(text, file)) throw new Error(`Potential secret found in ${scope}: ${file}.`);
    if (/(?:REQUIRED\s+TODO|TODO\s*\(required\))/iu.test(text)) throw new Error(`Required TODO found in ${scope}: ${file}.`);
    if (generated && /gemini-cli|claude|cursor|windsurf/iu.test(text)) throw new Error(`Forbidden platform surface found in generated output: ${file}.`);
    if (generated && /@mindfoldhq\/trellis|@tamtiger\/trellis/iu.test(text)) throw new Error(`Forbidden legacy product reference found in generated output: ${file}.`);
  }
}

function containsPotentialSecret(text, file) {
  if (extname(file) === ".map") {
    const sourceMap = parseSourceMap(text);
    if (sourceMap !== undefined) {
      const metadata = JSON.stringify({ ...sourceMap, sourcesContent: [] });
      if (containsPotentialSecretText(metadata, [])) return true;
      return sourceMap.sourcesContent.some((source, index) => {
        if (typeof source !== "string") return false;
        const sourceName = typeof sourceMap.sources[index] === "string" ? sourceMap.sources[index] : "source.ts";
        return containsPotentialSecretText(source, typeReferenceRanges(source, sourceName));
      });
    }
  }
  return containsPotentialSecretText(text, []);
}

function containsPotentialSecretText(text, ignoredTypeReferenceRanges) {
  for (const match of text.matchAll(potentialSecretPattern)) {
    const [, separator, unquotedValue] = match;
    const valueStart = unquotedValue === undefined || match.index === undefined
      ? -1
      : match.index + match[0].lastIndexOf(unquotedValue);
    const isTypeReference = valueStart >= 0 && ignoredTypeReferenceRanges.some(
      ([start, end]) => valueStart >= start && valueStart + unquotedValue.length <= end,
    );
    if (separator === ":" && unquotedValue !== undefined && isTypeReference) continue;
    return true;
  }
  return false;
}

function parseSourceMap(text) {
  try {
    const value = JSON.parse(text);
    if (typeof value !== "object" || value === null || !Array.isArray(value.sources) || !Array.isArray(value.sourcesContent)) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

function typeReferenceRanges(source, fileName) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const ranges = [];
  const visit = (node) => {
    if (ts.isTypeReferenceNode(node)) ranges.push([node.getStart(sourceFile), node.getEnd()]);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return ranges;
}

export async function assertNoDeadPackagedImports(packageRoot, packageJson, options = {}) {
  const files = await walk(packageRoot);
  const modules = files.filter((file) => executableExtensions.has(extname(file)));
  for (const modulePath of modules) {
    const source = await readFile(modulePath, "utf8");
    for (const specifier of importSpecifiers(source)) {
      await assertLivePackagedImport(specifier, modulePath, packageRoot, packageJson, options.resolveBareSpecifier);
    }
  }
}

export async function assertExpectedGlobalSurfaces(home) {
  const required = [
    ".agents/harnix/managed.json",
    ".agents/skills",
    ".codex/AGENTS.md",
    ".codex/harnix/managed.json",
    ".codex/config.toml",
    ".gemini/antigravity-cli/plugins/harnix/.managed.json",
    ".gemini/antigravity-cli/plugins/harnix/hooks.json",
    ".gemini/antigravity-cli/plugins/harnix/plugin.json",
    ".gemini/config/plugins/harnix/.managed.json",
    ".gemini/config/plugins/harnix/hooks.json",
    ".gemini/config/plugins/harnix/plugin.json",
    ".kiro/harnix/managed.json",
    ".kiro/hooks/harnix-context.json",
    ".kiro/steering/harnix.md",
  ];
  for (const relativePath of required) {
    try {
      await access(join(home, ...relativePath.split("/")));
    } catch (error) {
      if (error?.code === "ENOENT") throw new Error(`Expected global integration surface is missing: ${relativePath}.`);
      throw error;
    }
  }
}

export async function assertNoProjectLocalPlatformSurfaces(project) {
  const forbidden = [".agents", ".codex", ".gemini", ".kiro", "GEMINI.md"];
  const present = [];
  for (const relativePath of forbidden) {
    try {
      await access(join(project, relativePath));
      present.push(relativePath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  if (present.length > 0) throw new Error(`Project-local platform surfaces are not allowed: ${present.join(", ")}.`);
}

export async function assertSingleHooks(home) {
  const codex = await readFile(join(home, ".codex", "config.toml"), "utf8");
  const codexCount = codex.split("harnix context --platform codex").length - 1;
  if (codexCount !== 1) throw new Error(`Expected one Codex Harnix hook, found ${codexCount}.`);

  const kiro = JSON.parse(await readFile(join(home, ".kiro", "hooks", "harnix-context.json"), "utf8"));
  const kiroCount = (Array.isArray(kiro.hooks) ? kiro.hooks.map((hook) => hook?.action?.command) : [])
    .filter((command) => command === "harnix context --platform kiro").length;
  if (kiroCount !== 1) throw new Error(`Expected one Kiro Harnix hook, found ${kiroCount}.`);

  for (const pluginRoot of [
    ".gemini/config/plugins/harnix",
    ".gemini/antigravity-cli/plugins/harnix",
  ]) {
    const pluginHooks = JSON.parse(await readFile(join(home, ...pluginRoot.split("/"), "hooks.json"), "utf8"));
    const entries = pluginHooks?.["harnix-context"]?.PreInvocation;
    const count = (Array.isArray(entries) ? entries : [])
      .filter((entry) => entry?.command === "harnix context --platform antigravity").length;
    if (count !== 1) throw new Error(`Expected one Antigravity Harnix hook in ${pluginRoot}, found ${count}.`);
  }
}

/**
 * Measures a cold Node process on the non-Harnix hook path from the packed
 * artifact. It intentionally provides an Antigravity event so event parsing
 * is part of the release measurement while the empty workspace must still be
 * a fast, output-free no-op.
 */
export function measureNonHarnixContextFastPath(cli, workspace, environment) {
  const input = JSON.stringify({
    cwd: workspace,
    invocationNum: 0,
    workspacePaths: [workspace],
  });
  const samples = [];
  for (let index = 0; index < 15; index += 1) {
    const started = performance.now();
    const result = run(process.execPath, [cli, ...contextFastPathArguments("antigravity")], workspace, environment, input);
    const duration = performance.now() - started;
    assertNonHarnixContextNoOutput(result.stdout, result.stderr);
    samples.push(duration);
  }
  return assertNonHarnixContextPerformance(samples);
}

export function contextFastPathArguments(platform) {
  return ["context", "--platform", platform];
}

export function assertNonHarnixContextNoOutput(stdout, stderr = "") {
  if (stdout.trim().length !== 0 || stderr.trim().length !== 0) {
    throw new Error("Non-Harnix context hook must not emit output.");
  }
}

export function assertNonHarnixContextPerformance(samples) {
  const sorted = [...samples].sort((left, right) => left - right);
  const median = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  const max = sorted.at(-1);
  if (median >= 300 || p95 >= 750 || max === undefined || max >= 1000) {
    throw new Error(`Non-Harnix context hook startup exceeds release thresholds: median=${median.toFixed(1)}ms p95=${p95.toFixed(1)}ms max=${max?.toFixed(1) ?? "unknown"}ms.`);
  }
  return { max, median, p95, repetitions: samples.length, samples };
}

function percentile(sorted, ratio) {
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] ?? Number.NaN;
}

function isUnsafeTarballPath(path) {
  return path.startsWith("/") || /^[A-Za-z]:[/\\]/u.test(path) || path.split(/[\\/]+/u).includes("..");
}

async function assertLivePackagedImport(specifier, importer, packageRoot, packageJson, resolveBareSpecifier) {
  if (builtinSpecifiers.has(specifier) || specifier.startsWith("data:")) return;
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const candidates = packageImportExtensions.map((extension) => resolve(dirname(importer), `${specifier}${extension}`));
    if (specifier.startsWith("/") || !await anyPackagedFile(candidates, packageRoot)) {
      throw new Error(`Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}.`);
    }
    return;
  }
  if (specifier.startsWith("#")) {
    if (!hasPackageImport(packageJson.imports, specifier)) throw new Error(`Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}: package import is not declared.`);
    return;
  }

  const dependency = packageNameFromSpecifier(specifier);
  if (dependency === packageJson.name) return;
  if (!runtimeDependencyFields.some((field) => typeof packageJson[field]?.[dependency] === "string")) {
    throw new Error(`Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}: ${JSON.stringify(dependency)} is not declared as a runtime dependency.`);
  }
  if (resolveBareSpecifier !== undefined) {
    try {
      resolveBareSpecifier(specifier);
    } catch {
      throw new Error(`Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}: runtime target cannot be resolved.`);
    }
  }
}

async function anyPackagedFile(candidates, packageRoot) {
  for (const candidate of candidates) {
    try {
      const resolvedCandidate = resolve(candidate);
      if (!isContainedPath(packageRoot, resolvedCandidate)) continue;
      const content = await readFile(resolvedCandidate);
      if (content !== undefined) return true;
    } catch {
      // Try the next Node-compatible extension.
    }
  }
  return false;
}

function isContainedPath(root, candidate) {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}\\`) || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}

function hasPackageImport(imports, specifier) {
  if (typeof imports !== "object" || imports === null) return false;
  return Object.keys(imports).some((key) => key === specifier || key.includes("*") && matchesImportPattern(key, specifier));
}

function matchesImportPattern(pattern, specifier) {
  const [prefix = "", suffix = ""] = pattern.split("*");
  return specifier.startsWith(prefix) && specifier.endsWith(suffix);
}

function packageNameFromSpecifier(specifier) {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}

function relativePackagePath(packageRoot, file) {
  return file.slice(resolve(packageRoot).length + 1).replaceAll("\\", "/");
}

function importSpecifiers(source) {
  const specifiers = new Set();
  const file = ts.createSourceFile("packed-module.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const add = (value) => { if (value !== undefined && ts.isStringLiteralLike(value)) specifiers.add(value.text); };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier);
    else if (ts.isCallExpression(node)) {
      const [argument] = node.arguments;
      if ((node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require") && argument) add(argument);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(file, visit);
  return [...specifiers];
}

function run(executable, args, cwd, env, input, expectedStatuses = [0]) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    env,
    ...(input === undefined ? {} : { input }),
    windowsHide: true,
  });
  if (!expectedStatuses.includes(result.status)) throw new Error(`${executable} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr ?? result.stdout ?? "unknown"}`);
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

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

const isDirectExecution = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) await runReleaseScan();
