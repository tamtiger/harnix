import { join, resolve } from "node:path";
import { readConfig } from "src/core/config/config.js";
import type { HarnixConfigV2, VerifyCommandConfig } from "src/core/config/config-schema.js";
import { readRepoMap } from "src/core/repo-map/store.js";
import { findAffectedTests } from "src/core/repo-map/tests.js";
import { refreshRepoMap } from "src/core/repo-map/service.js";
import { normalizeRepositoryPath, resolveSafeHarnixPath } from "src/utils/paths.js";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { compareCodeUnits } from "src/utils/order.js";
import { detectEcosystemVerify, type EcosystemVerifyResult } from "./verify-detection.js";
import { detectWorkspaces, type WorkspacePackage } from "./workspace-detection.js";

export interface PackageVerifyPlan {
  path: string;
  ecosystem?: string | undefined;
  hasTests: boolean;
  commands: VerifyCommandConfig;
  warning?: string | undefined;
}

export interface ImpactVerification {
  readonly files: readonly string[];
  readonly tests: readonly string[];
  readonly command?: string | undefined;
  readonly cwd?: string | undefined;
}

export interface VerifyPlanOptions {
  recursive?: boolean | undefined;
  impact?: string | boolean | undefined;
  /** Keep the packages inside or containing this repository-relative directory. */
  path?: string | undefined;
  /** Keep the packages that hold a file Git reports as changed. */
  changed?: boolean | undefined;
  /** Keep only packages with tests and, for each, only its path, `hasTests` and test command. */
  brief?: boolean | undefined;
}

export interface VerifyPlan {
  generator: "harnix";
  schemaVersion: 1;
  hasTests: boolean;
  commands: VerifyCommandConfig;
  packages: PackageVerifyPlan[];
  warnings: string[];
  impact?: ImpactVerification | undefined;
}

export async function buildVerifyPlan(projectRoot: string, options?: VerifyPlanOptions): Promise<VerifyPlan> {
  const root = resolve(projectRoot);
  let config: HarnixConfigV2 | undefined;
  try {
    config = await readConfig(join(root, ".harnix", "config.yaml"));
  } catch {
    /* ignore unreadable config */
  }

  const rootDetected = await detectEcosystemVerify(root, ".");
  const workspacePackages = await detectWorkspaces(
    root,
    options?.recursive !== undefined ? { recursive: options.recursive } : undefined,
  );

  const commands: VerifyCommandConfig = {
    ...(rootDetected?.commands ?? {}),
    ...(config?.verify ?? {}),
  };
  delete (commands as { packages?: unknown }).packages;

  const { packages, hasAnyTests } = mergePackages(workspacePackages, config);
  const hasTests = (rootDetected?.hasTests ?? false) || hasAnyTests || Boolean(commands.test?.trim());

  const warnings: string[] = [];
  if (!hasTests) {
    warnings.push(
      "No tests detected in repository. A replacement check with documented rationale is required; cannot pass without tests.",
    );
  }

  let impact: ImpactVerification | undefined;
  if (options?.impact !== undefined) {
    impact = await computeImpactVerification(root, options.impact, rootDetected, commands.test);
  }

  return {
    generator: "harnix",
    schemaVersion: 1,
    hasTests,
    commands,
    packages: await scopePackages(root, packages, options),
    warnings,
    ...(impact ? { impact } : {}),
  };
}

async function scopePackages(
  root: string,
  packages: PackageVerifyPlan[],
  options: VerifyPlanOptions | undefined,
): Promise<PackageVerifyPlan[]> {
  let scoped = packages;
  const scope = scopePath(options?.path);
  if (scope !== undefined) {
    scoped = scoped.filter(
      (pkg) => pkg.path === scope || pkg.path.startsWith(`${scope}/`) || scope.startsWith(`${pkg.path}/`),
    );
  }
  if (options?.changed === true) {
    const reported = await changedFiles(root);
    // A clean tree changes nothing; only when Git cannot answer is the list left whole.
    if (reported !== undefined) {
      const files = reported.map((file) => file.replace(/\/+$/u, ""));
      scoped = scoped.filter((pkg) =>
        files.some(
          (file) =>
            file === "." || file === pkg.path || file.startsWith(`${pkg.path}/`) || pkg.path.startsWith(`${file}/`),
        ),
      );
    }
  }
  if (options?.brief === true) {
    scoped = scoped
      .filter((pkg) => pkg.hasTests)
      .map((pkg) => ({
        path: pkg.path,
        hasTests: true,
        commands: pkg.commands.test === undefined ? {} : { test: pkg.commands.test },
      }));
  }
  return scoped;
}

function scopePath(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/u, "");
  if (trimmed === undefined || trimmed === "" || trimmed === ".") return undefined;
  try {
    return normalizeRepositoryPath(trimmed);
  } catch {
    throw new Error("--path must be a repository-relative directory inside the project.");
  }
}

async function computeImpactVerification(
  root: string,
  impactOption: string | boolean,
  rootDetected: EcosystemVerifyResult | undefined,
  baseTestCommand: string | undefined,
): Promise<ImpactVerification> {
  let targetFiles: string[] = [];
  if (typeof impactOption === "string" && impactOption.trim().length > 0) {
    targetFiles = [normalizeRepositoryPath(impactOption.trim())];
  } else {
    targetFiles = await detectChangedFiles(root);
    if (targetFiles.length === 0) {
      try {
        const harnixRoot = await resolveSafeHarnixPath(root);
        const active = await resolveActiveTask(harnixRoot);
        if (active) {
          targetFiles = active.relevantPaths.filter((p) => !p.includes("*"));
        }
      } catch {
        // Best effort
      }
    }
  }

  const validFiles: string[] = [];
  for (const file of targetFiles) {
    try {
      const normalized = normalizeRepositoryPath(file.replace(/\/+$/u, ""));
      validFiles.push(normalized);
    } catch {
      // Skip non-normalizable paths
    }
  }

  const affectedTestsSet = new Set<string>();
  let map;
  try {
    map = await readRepoMap(root);
  } catch {
    try {
      const refreshed = await refreshRepoMap({ root });
      map = refreshed.map;
    } catch {
      // Best effort
    }
  }

  if (map) {
    for (const target of validFiles) {
      try {
        const result = findAffectedTests(map, { target, limit: 20 });
        for (const test of result.tests) affectedTestsSet.add(test);
      } catch {
        // Best effort
      }
    }
  }

  const affectedTests = [...affectedTestsSet].sort(compareCodeUnits);
  const command =
    affectedTests.length > 0 ? formatTestCommand(rootDetected, baseTestCommand, affectedTests) : undefined;

  return {
    files: validFiles,
    tests: affectedTests,
    ...(command !== undefined ? { command } : {}),
    cwd: ".",
  };
}

function formatNodeTestCommand(baseTestCommand: string | undefined, testList: string): string {
  const pm = baseTestCommand?.startsWith("pnpm")
    ? "pnpm"
    : baseTestCommand?.startsWith("yarn")
      ? "yarn"
      : baseTestCommand?.startsWith("bun")
        ? "bun"
        : "npx";
  if (baseTestCommand?.includes("vitest") || baseTestCommand?.includes("test")) {
    return `${pm} vitest run ${testList}`;
  }
  return `${pm} test -- ${testList}`;
}

function formatTestCommand(
  rootDetected: EcosystemVerifyResult | undefined,
  baseTestCommand: string | undefined,
  tests: readonly string[],
): string {
  const testList = tests.join(" ");
  if (rootDetected?.ecosystem === "node") return formatNodeTestCommand(baseTestCommand, testList);
  if (rootDetected?.ecosystem === "python") return `pytest ${testList}`;
  if (rootDetected?.ecosystem === "go") return `go test ${testList}`;
  if (rootDetected?.ecosystem === "rust") return `cargo test ${testList}`;
  if (baseTestCommand) return `${baseTestCommand} ${testList}`;
  return `test ${testList}`;
}

/**
 * Paths Git reports as changed, relative to `projectRoot` (Git prints them from its top level, so the part of the
 * path above `projectRoot` is cut and files outside it are dropped); NUL-separated, so a space or quote in a name
 * survives. Undefined when Git cannot say.
 */
async function changedFiles(projectRoot: string): Promise<string[] | undefined> {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const options = { cwd: projectRoot, windowsHide: true };
    const prefix = (await execFileAsync("git", ["rev-parse", "--show-prefix"], options)).stdout.trim();
    const { stdout } = await execFileAsync("git", ["status", "--porcelain", "-z"], options);
    const entries = stdout.split("\0").filter((entry) => entry !== "");
    const files: string[] = [];
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index] as string;
      const path = entry.slice(3);
      // An untracked directory that is the whole Harnix root reports as the prefix itself.
      if (path.startsWith(prefix)) files.push(path.slice(prefix.length) || ".");
      // A rename or copy is followed by its original path, which is not a changed file of its own.
      if (/[RC]/u.test(entry.slice(0, 2))) index += 1;
    }
    return files;
  } catch {
    return undefined;
  }
}

async function detectChangedFiles(projectRoot: string): Promise<string[]> {
  return (await changedFiles(projectRoot)) ?? [];
}

function mergePackages(
  workspaces: WorkspacePackage[],
  config: HarnixConfigV2 | undefined,
): { packages: PackageVerifyPlan[]; hasAnyTests: boolean } {
  const packagesMap = new Map<string, PackageVerifyPlan>();
  let hasAnyTests = false;

  for (const wsp of workspaces) {
    packagesMap.set(wsp.path, {
      path: wsp.path,
      ecosystem: wsp.ecosystem,
      hasTests: wsp.hasTests,
      commands: wsp.commands,
    });
    if (wsp.hasTests) hasAnyTests = true;
  }

  for (const pkgConfig of config?.verify?.packages ?? []) {
    const existing = packagesMap.get(pkgConfig.path);
    const mergedCommands: VerifyCommandConfig = {
      ...(existing?.commands ?? {}),
      ...pkgConfig,
    };
    delete (mergedCommands as { path?: unknown }).path;
    const pkgHasTests = (existing?.hasTests ?? false) || Boolean(mergedCommands.test?.trim());
    packagesMap.set(pkgConfig.path, {
      path: pkgConfig.path,
      ecosystem: existing?.ecosystem,
      hasTests: pkgHasTests,
      commands: mergedCommands,
    });
    if (pkgHasTests) hasAnyTests = true;
  }

  const solutionPackages = [...packagesMap.values()].filter(
    (pkg) => pkg.ecosystem === "dotnet" && /\.sln(?:\s|"|$)/iu.test(pkg.commands.test ?? ""),
  );
  if (solutionPackages.length > 0) {
    for (const [path, pkg] of packagesMap) {
      if (pkg.ecosystem === "dotnet" && !solutionPackages.some((sol) => sol.path === path)) {
        if (solutionPackages.some((sol) => path.startsWith(`${sol.path}/`))) {
          packagesMap.delete(path);
        }
      }
    }
  }

  const packages = [...packagesMap.values()]
    .map((pkg) => {
      if (!pkg.hasTests) {
        return {
          ...pkg,
          warning: `No tests detected for package ${pkg.path}. A replacement check is required if verifying this package.`,
        };
      }
      return pkg;
    })
    .sort((left, right) => compareCodeUnits(left.path, right.path));

  return { packages, hasAnyTests };
}
