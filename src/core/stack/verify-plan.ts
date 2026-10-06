import { join, resolve } from "node:path";
import { readConfig } from "src/core/config/config.js";
import type { HarnixConfigV2, VerifyCommandConfig } from "src/core/config/config-schema.js";
import { compareCodeUnits } from "src/utils/order.js";
import { detectEcosystemVerify } from "./verify-detection.js";
import { detectWorkspaces, type WorkspacePackage } from "./workspace-detection.js";

export interface PackageVerifyPlan {
  path: string;
  ecosystem?: string | undefined;
  hasTests: boolean;
  commands: VerifyCommandConfig;
  warning?: string | undefined;
}

export interface VerifyPlan {
  generator: "harnix";
  schemaVersion: 1;
  hasTests: boolean;
  commands: VerifyCommandConfig;
  packages: PackageVerifyPlan[];
  warnings: string[];
}

export async function buildVerifyPlan(projectRoot: string, options?: { recursive?: boolean }): Promise<VerifyPlan> {
  const root = resolve(projectRoot);
  let config: HarnixConfigV2 | undefined;
  try {
    config = await readConfig(join(root, ".harnix", "config.yaml"));
  } catch {
    /* ignore unreadable config */
  }

  const rootDetected = await detectEcosystemVerify(root, ".");
  const workspacePackages = await detectWorkspaces(root, options);

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

  return {
    generator: "harnix",
    schemaVersion: 1,
    hasTests,
    commands,
    packages,
    warnings,
  };
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
