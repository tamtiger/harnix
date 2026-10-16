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
    packages,
    warnings,
    ...(impact ? { impact } : {}),
  };
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

function formatTestCommand(
  rootDetected: EcosystemVerifyResult | undefined,
  baseTestCommand: string | undefined,
  tests: readonly string[],
): string {
  const testList = tests.join(" ");
  if (rootDetected?.ecosystem === "node") {
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
  if (rootDetected?.ecosystem === "python") return `pytest ${testList}`;
  if (rootDetected?.ecosystem === "go") return `go test ${testList}`;
  if (rootDetected?.ecosystem === "rust") return `cargo test ${testList}`;
  if (baseTestCommand) return `${baseTestCommand} ${testList}`;
  return `test ${testList}`;
}

async function detectChangedFiles(projectRoot: string): Promise<string[]> {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
      cwd: projectRoot,
      windowsHide: true,
    });
    const files: string[] = [];
    for (const raw of stdout.split("\n")) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const part = trimmed.slice(2).trim();
      const file = part.includes(" -> ") ? part.split(" -> ")[1]! : part;
      files.push(file.replaceAll("\\", "/"));
    }
    return files;
  } catch {
    return [];
  }
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
