import { Option, type Command } from "commander";

import { initializeProject, parseInitProfile } from "./commands/init.js";
import { setupPlatforms, type SetupPlatformsResult } from "./commands/setup.js";
import { resolveProjectRoot } from "./utils/paths.js";
import { updateProject } from "./commands/update.js";
import { updateGlobalPlatforms } from "./commands/global-update.js";
import { upgradeHarnix } from "./commands/upgrade.js";
import { uninstallProject } from "./commands/uninstall.js";
import { uninstallGlobalIntegrations } from "./commands/global-uninstall.js";
import { cleanupLegacyProjectSurfaces } from "./commands/legacy-project-surfaces.js";
import { packageVersion } from "./version.js";
import {
  addPlatformFlags,
  defaultDeveloperId,
  platformFlagList,
  reportActionableSetupReadiness,
  selectedPlatforms,
  type PlatformFlagOptions,
  type ProgramOptions,
} from "./cli-helpers.js";

export function registerProjectCommands(program: Command, programOptions: ProgramOptions): void {
  program
    .command("init")
    .option("--user <name>", "Override the detected developer journal ID")
    .option("--languages <csv>", "Override auto-detected language IDs")
    .option("--technologies <csv>", "Override auto-detected technology IDs")
    .option("--dry-run", "Preview without writing")
    .addOption(new Option("--yes", "Deprecated compatibility option; init no longer prompts").hideHelp())
    .action(
      async (options: {
        yes?: boolean;
        user?: string;
        languages?: string;
        technologies?: string;
        dryRun?: boolean;
      }) => {
        const environment = { ...process.env, ...(programOptions.environment ?? {}) };
        const developer = options.user ?? defaultDeveloperId(environment);
        const profile = parseInitProfile(options.languages, options.technologies);
        const result = await initializeProject({
          developer,
          dryRun: options.dryRun,
          languages: profile.languages,
          technologies: profile.technologies,
          warnings: profile.warnings,
          root: await resolveProjectRoot(process.cwd()),
          yes: options.yes,
        });
        process.stdout.write(`${JSON.stringify(result)}\n`);
      },
    );

  addPlatformFlags(program.command("setup"), (label) => `Install ${label} user-global integration`)
    .option("--dry-run", "Preview user-global changes without writing")
    .action(async (options: PlatformFlagOptions & { dryRun?: boolean }) => {
      const platforms = selectedPlatforms(options);
      const result = await setupPlatforms({
        ...(programOptions.commandLookup === undefined ? {} : { commandLookup: programOptions.commandLookup }),
        ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
        ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
        dryRun: options.dryRun,
        platforms,
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
      reportActionableSetupReadiness(result);
    });

  addPlatformFlags(
    program
      .command("update")
      .option("--restore", "Restore explicitly deleted managed files")
      .option("--global", "Reconcile user-global platform integrations"),
    (label) => `Select ${label} for --global`,
  )
    .option("--dry-run", "Preview changes without writing")
    .action(async (options: PlatformFlagOptions & { restore?: boolean; global?: boolean; dryRun?: boolean }) => {
      const platforms = selectedPlatforms(options);
      if (!options.global && platforms.length > 0) throw new Error(`${platformFlagList()} require update --global.`);
      const result = options.global
        ? await updateGlobalPlatforms({
            ...(programOptions.commandLookup === undefined ? {} : { commandLookup: programOptions.commandLookup }),
            ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
            ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
            dryRun: options.dryRun,
            restoreDeleted: options.restore,
            ...(platforms.length === 0 ? {} : { platforms }),
          })
        : await updateProject({
            root: await resolveProjectRoot(process.cwd()),
            restoreDeleted: options.restore,
            dryRun: options.dryRun,
          });
      process.stdout.write(`${JSON.stringify(result)}\n`);
      if (options.global) reportActionableSetupReadiness(result as SetupPlatformsResult);
    });

  program
    .command("upgrade")
    .option("--apply", "Run the displayed npm upgrade command")
    .action(async (options: { apply?: boolean }) => {
      const result = await upgradeHarnix({
        installedVersion: packageVersion,
        ...(programOptions.availableVersionLookup === undefined
          ? {}
          : { availableVersion: programOptions.availableVersionLookup }),
        apply: options.apply,
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });

  addPlatformFlags(
    program
      .command("uninstall")
      .option("--purge", "Remove only this project's .harnix data")
      .option("--global", "Uninstall selected user-global platform integrations")
      .option("--legacy-project-surfaces", "Remove manifest-proven legacy project-local integration files"),
    (label) => `Select ${label} for --global`,
  )
    .option("--yes", "Confirm the selected destructive action")
    .action(
      async (
        options: PlatformFlagOptions & {
          purge?: boolean;
          global?: boolean;
          legacyProjectSurfaces?: boolean;
          yes?: boolean;
        },
      ) => {
        const platforms = selectedPlatforms(options);
        const projectModeCount = Number(options.purge === true) + Number(options.legacyProjectSurfaces === true);
        if (projectModeCount > 1 || (options.global === true && projectModeCount > 0))
          throw new Error("--global, --purge, and --legacy-project-surfaces are mutually exclusive.");
        if (!options.global && platforms.length > 0)
          throw new Error(`${platformFlagList()} require uninstall --global.`);
        if (options.global && platforms.length === 0)
          throw new Error("uninstall --global requires at least one platform flag.");
        if (!options.global && projectModeCount === 0)
          throw new Error("Specify one of --purge, --global, or --legacy-project-surfaces.");

        const result = options.global
          ? await uninstallGlobalIntegrations({
              ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
              ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
              platforms,
              yes: options.yes,
            })
          : options.legacyProjectSurfaces
            ? await cleanupLegacyProjectSurfaces({ root: await resolveProjectRoot(process.cwd()), yes: options.yes })
            : await uninstallProject({ root: await resolveProjectRoot(process.cwd()), purge: true, yes: options.yes });
        process.stdout.write(`${JSON.stringify(result)}\n`);
        const confirmationRequired =
          "confirmationRequired" in result
            ? result.confirmationRequired
            : result.platforms.some((platform) => platform.confirmationRequired);
        if (confirmationRequired) process.exitCode = 2;
      },
    );
}
