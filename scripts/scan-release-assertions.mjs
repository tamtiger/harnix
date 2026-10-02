import { access, readFile, readdir } from "node:fs/promises";
import { builtinModules } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const runtimeDependencyFields = ["dependencies", "optionalDependencies", "peerDependencies"];
const packageImportExtensions = ["", ".js", ".mjs", ".cjs", ".json"];
const executableExtensions = new Set([".cjs", ".js", ".mjs"]);
const builtinSpecifiers = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

export async function assertTarballListing(listing) {
  if (listing.some(isUnsafeTarballPath)) throw new Error("Tarball contains an unsafe path.");
  if (listing.filter((path) => path === "package/package.json").length !== 1)
    throw new Error("Release must contain exactly one package.");
  if (listing.some((path) => /(?:^|[/\\])pnpm-workspace\.yaml$/u.test(path)))
    throw new Error("Release must not contain a workspace file.");
}

export function assertSingleHarnixExecutable(packageJson) {
  const bin = packageJson.bin ?? {};
  if (Object.keys(bin).length !== 1 || bin.harnix !== "./dist/cli.js")
    throw new Error("Release must expose exactly one harnix executable.");
}

export function assertAttribution(notice) {
  for (const attribution of ["Trellis", "ECC", "Superpowers"]) {
    if (!notice.includes(attribution)) throw new Error(`NOTICE is missing ${attribution} attribution.`);
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
  const kiroCount = (Array.isArray(kiro.hooks) ? kiro.hooks.map((hook) => hook?.action?.command) : []).filter(
    (command) => command === "harnix context --platform kiro",
  ).length;
  if (kiroCount !== 1) throw new Error(`Expected one Kiro Harnix hook, found ${kiroCount}.`);

  for (const pluginRoot of [".gemini/config/plugins/harnix", ".gemini/antigravity-cli/plugins/harnix"]) {
    const pluginHooks = JSON.parse(await readFile(join(home, ...pluginRoot.split("/"), "hooks.json"), "utf8"));
    const entries = pluginHooks?.["harnix-context"]?.PreInvocation;
    const count = (Array.isArray(entries) ? entries : []).filter(
      (entry) => entry?.command === "harnix context --platform antigravity",
    ).length;
    if (count !== 1) throw new Error(`Expected one Antigravity Harnix hook in ${pluginRoot}, found ${count}.`);
  }
}

export function measureNonHarnixContextFastPath(cli, workspace, environment) {
  const input = JSON.stringify({
    cwd: workspace,
    invocationNum: 0,
    workspacePaths: [workspace],
  });
  const samples = [];
  for (let index = 0; index < 15; index += 1) {
    const started = performance.now();
    const result = run(
      process.execPath,
      [cli, ...contextFastPathArguments("antigravity")],
      workspace,
      environment,
      input,
    );
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
    throw new Error(
      `Non-Harnix context hook startup exceeds release thresholds: median=${median.toFixed(1)}ms p95=${p95.toFixed(1)}ms max=${max?.toFixed(1) ?? "unknown"}ms.`,
    );
  }
  return { max, median, p95, repetitions: samples.length, samples };
}

function percentile(sorted, ratio) {
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] ?? Number.NaN;
}

export function isUnsafeTarballPath(path) {
  return path.startsWith("/") || /^[A-Za-z]:[/\\]/u.test(path) || path.split(/[\\/]+/u).includes("..");
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

async function assertLivePackagedImport(specifier, importer, packageRoot, packageJson, resolveBareSpecifier) {
  if (builtinSpecifiers.has(specifier) || specifier.startsWith("data:")) return;
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const candidates = packageImportExtensions.map((extension) =>
      resolve(dirname(importer), `${specifier}${extension}`),
    );
    if (specifier.startsWith("/") || !(await anyPackagedFile(candidates, packageRoot))) {
      throw new Error(
        `Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}.`,
      );
    }
    return;
  }
  if (specifier.startsWith("#")) {
    if (!hasPackageImport(packageJson.imports, specifier))
      throw new Error(
        `Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}: package import is not declared.`,
      );
    return;
  }

  const dependency = packageNameFromSpecifier(specifier);
  if (dependency === packageJson.name) return;
  if (!runtimeDependencyFields.some((field) => typeof packageJson[field]?.[dependency] === "string")) {
    throw new Error(
      `Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}: ${JSON.stringify(dependency)} is not declared as a runtime dependency.`,
    );
  }
  if (resolveBareSpecifier !== undefined) {
    try {
      resolveBareSpecifier(specifier);
    } catch {
      throw new Error(
        `Dead packaged import ${JSON.stringify(specifier)} from ${relativePackagePath(packageRoot, importer)}: runtime target cannot be resolved.`,
      );
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
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}\\`) ||
    normalizedCandidate.startsWith(`${normalizedRoot}/`)
  );
}

function hasPackageImport(imports, specifier) {
  if (typeof imports !== "object" || imports === null) return false;
  return Object.keys(imports).some(
    (key) => key === specifier || (key.includes("*") && matchesImportPattern(key, specifier)),
  );
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
  const add = (value) => {
    if (value !== undefined && ts.isStringLiteralLike(value)) specifiers.add(value.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier);
    else if (ts.isCallExpression(node)) {
      const [argument] = node.arguments;
      if (
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
        argument
      )
        add(argument);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(file, visit);
  return [...specifiers];
}

export function toTarArgumentPath(path) {
  return path.replaceAll("\\", "/");
}

export function run(executable, args, cwd, env, input, expectedStatuses = [0]) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    env,
    ...(input === undefined ? {} : { input }),
    windowsHide: true,
  });
  if (!expectedStatuses.includes(result.status))
    throw new Error(
      `${executable} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr ?? result.stdout ?? "unknown"}`,
    );
  return result;
}

export function assertSetupExitContract({ status, stderr, stdout }) {
  let result;
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new Error(`setup did not return valid JSON: ${stdout}`);
  }
  if (result?.scope !== "user" || !Array.isArray(result.platforms))
    throw new Error(`setup returned an unexpected global result: ${stdout}`);
  const actionable = result.platforms.some(
    (platform) =>
      platform?.readiness !== "installed" || !Array.isArray(platform?.warnings) || platform.warnings.length > 0,
  );
  const expectedStatus = actionable ? 1 : 0;
  if (status !== expectedStatus)
    throw new Error(`setup returned exit ${status}; expected ${expectedStatus} for its readiness result.`);
  if (actionable !== stderr.trim().length > 0)
    throw new Error("setup stderr did not match its actionable readiness result.");
}

export async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}
