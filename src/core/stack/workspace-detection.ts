import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { parse } from "yaml";
import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import { matchesSafeGlob } from "src/utils/safe-glob.js";
import { isDotnetProjectFile, isSolutionFile, solutionProjectPaths } from "./dotnet-projects.js";
import { detectEcosystemVerify, type EcosystemVerifyResult } from "./verify-detection.js";

export interface WorkspacePackage extends EcosystemVerifyResult {
  path: string;
}

export async function detectWorkspaces(
  projectRoot: string,
  options?: { recursive?: boolean },
): Promise<WorkspacePackage[]> {
  const root = resolve(projectRoot);
  const packagePaths = new Set<string>();

  // 1. pnpm-workspace.yaml
  await collectPnpmWorkspaces(root, packagePaths);

  // 2. npm/yarn workspaces in root package.json
  await collectNpmWorkspaces(root, packagePaths);

  // 3. Cargo workspace
  await collectCargoWorkspaces(root, packagePaths);

  // 4. Go workspace (go.work)
  await collectGoWorkspaces(root, packagePaths);

  // 5. Maven multi-module
  await collectMavenWorkspaces(root, packagePaths);

  // 6. .NET solution workspaces (*.sln)
  const solutionProjectDirs = await collectDotNetWorkspaces(root, packagePaths);

  // If no explicit workspace config found or recursive requested, discover all nested manifests
  if (packagePaths.size === 0 || options?.recursive === true) {
    await discoverNestedManifests(root, root, 0, packagePaths, solutionProjectDirs);
  }

  const results: WorkspacePackage[] = [];
  for (const relPath of [...packagePaths].sort(compareCodeUnits)) {
    if (relPath === ".") continue;
    const detected = await detectEcosystemVerify(root, relPath);
    if (detected !== undefined) {
      results.push({
        path: relPath,
        ecosystem: detected.ecosystem,
        hasTests: detected.hasTests,
        commands: detected.commands,
      });
    }
  }

  return results;
}

async function collectPnpmWorkspaces(root: string, packagePaths: Set<string>): Promise<void> {
  const text = await readSafeText(join(root, "pnpm-workspace.yaml"));
  if (text === undefined) return;
  try {
    const parsed = parse(text) as { packages?: string[] };
    if (Array.isArray(parsed?.packages)) {
      await expandGlobs(root, parsed.packages, packagePaths);
    }
  } catch {
    /* ignore invalid pnpm-workspace.yaml */
  }
}

async function collectNpmWorkspaces(root: string, packagePaths: Set<string>): Promise<void> {
  const text = await readSafeText(join(root, "package.json"));
  if (text === undefined) return;
  try {
    const parsed = JSON.parse(text) as { workspaces?: string[] | { packages?: string[] } };
    const patterns = Array.isArray(parsed?.workspaces)
      ? parsed.workspaces
      : Array.isArray(parsed?.workspaces?.packages)
        ? parsed.workspaces.packages
        : [];
    if (patterns.length > 0) {
      await expandGlobs(root, patterns, packagePaths);
    }
  } catch {
    /* ignore invalid package.json */
  }
}

async function collectCargoWorkspaces(root: string, packagePaths: Set<string>): Promise<void> {
  const text = await readSafeText(join(root, "Cargo.toml"));
  if (text === undefined || !text.includes("[workspace]")) return;
  const match = /members\s*=\s*\[([\s\S]*?)\]/u.exec(text);
  if (match) {
    const rawMembers = match[1]!
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/gu, ""))
      .filter((s) => s.length > 0);
    await expandGlobs(root, rawMembers, packagePaths);
  }
}

async function collectGoWorkspaces(root: string, packagePaths: Set<string>): Promise<void> {
  const text = await readSafeText(join(root, "go.work"));
  if (text === undefined) return;
  const match = /use\s*\(([\s\S]*?)\)/u.exec(text);
  if (match) {
    const lines = match[1]!
      .split("\n")
      .map((line) => line.trim().replace(/^\.\//u, ""))
      .filter((line) => line.length > 0 && !line.startsWith("//"));
    for (const line of lines) {
      packagePaths.add(normalizeRepositoryPath(line, { allowRoot: false }));
    }
  }
}

async function collectMavenWorkspaces(root: string, packagePaths: Set<string>): Promise<void> {
  const text = await readSafeText(join(root, "pom.xml"));
  if (text === undefined || !text.includes("<modules>")) return;
  const moduleRegex = /<module>\s*([^<\s]+)\s*<\/module>/gu;
  let match: RegExpExecArray | null;
  while ((match = moduleRegex.exec(text)) !== null) {
    const mod = match[1]!;
    packagePaths.add(normalizeRepositoryPath(mod, { allowRoot: false }));
  }
}

async function expandGlobs(root: string, patterns: string[], packagePaths: Set<string>): Promise<void> {
  const allDirs = await collectDirectories(root, root, 0);
  for (const dir of allDirs) {
    for (const pattern of patterns) {
      if (matchesSafeGlob(dir, pattern)) {
        packagePaths.add(normalizeRepositoryPath(dir, { allowRoot: false }));
      }
    }
  }
}

const ignoredDirs = new Set(["node_modules", ".git", "dist", "build", "target", "vendor", ".harnix", "bin", "obj"]);

/**
 * Each directory holding a solution is one package; the directories of the projects a solution references are
 * returned as `covered` so they are not listed again (a solution runs all of its projects at once).
 */
async function collectDotNetWorkspaces(root: string, packagePaths: Set<string>): Promise<Set<string>> {
  const covered = new Set<string>();
  const solutionDirs = new Set<string>();
  for (const slnPath of await findSolutionFiles(root, root, 0)) {
    const text = await readSafeText(slnPath);
    if (!text) continue;
    const slnDir = dirname(slnPath);
    const slnRel = relative(root, slnDir).replaceAll("\\", "/");
    if (isInsideRoot(slnRel) && slnRel !== "") {
      solutionDirs.add(slnRel);
      packagePaths.add(normalizeRepositoryPath(slnRel, { allowRoot: false }));
    }
    for (const projectPath of solutionProjectPaths(text)) {
      const relToRoot = relative(root, resolve(slnDir, dirname(projectPath))).replaceAll("\\", "/");
      if (relToRoot !== slnRel && isInsideRoot(relToRoot) && relToRoot !== "") covered.add(relToRoot);
    }
  }
  for (const dir of solutionDirs) covered.delete(dir);
  return covered;
}

function isInsideRoot(relativePath: string): boolean {
  return relativePath !== ".." && !relativePath.startsWith("../") && !relativePath.startsWith("/");
}

async function findSolutionFiles(root: string, current: string, depth: number): Promise<string[]> {
  if (depth > 3) return [];
  const results: string[] = [];
  try {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && isSolutionFile(entry.name)) {
        results.push(join(current, entry.name));
      } else if (entry.isDirectory() && !ignoredDirs.has(entry.name) && !entry.name.startsWith(".")) {
        results.push(...(await findSolutionFiles(root, join(current, entry.name), depth + 1)));
      }
    }
  } catch {
    /* ignore directory read error */
  }
  return results;
}

async function collectDirectories(root: string, current: string, depth: number): Promise<string[]> {
  if (depth > 6) return [];
  const results: string[] = [];
  try {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !ignoredDirs.has(entry.name) && !entry.name.startsWith(".")) {
        const full = join(current, entry.name);
        const rel = relative(root, full).replaceAll("\\", "/");
        results.push(rel);
        results.push(...(await collectDirectories(root, full, depth + 1)));
      }
    }
  } catch {
    /* ignore directory read error */
  }
  return results;
}

async function discoverNestedManifests(
  root: string,
  current: string,
  depth: number,
  packagePaths: Set<string>,
  covered: ReadonlySet<string>,
): Promise<void> {
  if (depth > 6) return;
  try {
    const entries = await readdir(current, { withFileTypes: true });
    const fileNames = new Set(entries.filter((e) => e.isFile()).map((e) => e.name));
    const rel = relative(root, current).replaceAll("\\", "/");
    // A directory that a solution already covers is a package only through a manifest of its own, not through its project file.
    const hasManifest =
      fileNames.has("package.json") ||
      fileNames.has("Cargo.toml") ||
      fileNames.has("go.mod") ||
      fileNames.has("pom.xml") ||
      fileNames.has("pyproject.toml") ||
      fileNames.has("requirements.txt") ||
      entries.some((e) => e.isFile() && isSolutionFile(e.name));
    const hasDotnetProject = entries.some((e) => e.isFile() && isDotnetProjectFile(e.name));
    if (rel !== "" && (hasManifest || (hasDotnetProject && !covered.has(rel)))) {
      packagePaths.add(normalizeRepositoryPath(rel, { allowRoot: false }));
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !ignoredDirs.has(entry.name) && !entry.name.startsWith(".")) {
        await discoverNestedManifests(root, join(current, entry.name), depth + 1, packagePaths, covered);
      }
    }
  } catch {
    /* ignore directory read error */
  }
}

async function readSafeText(filePath: string): Promise<string | undefined> {
  try {
    const s = await stat(filePath);
    if (s.size > 256 * 1024) return undefined;
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}
