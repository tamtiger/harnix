#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { fileURLToPath } from "node:url";

import { initializeProject } from "./commands/init.js";
import { setupPlatforms } from "./commands/setup.js";
import { resolveProjectRoot } from "./utils/paths.js";
import { renderInternalContext } from "./commands/internal-context.js";
import { updateProject } from "./commands/update.js";
import { upgradeHarnix } from "./commands/upgrade.js";
import { uninstallProject } from "./commands/uninstall.js";
import { searchMemory } from "./commands/mem.js";
import { diagnoseProject } from "./commands/doctor.js";

export function createProgram(): Command {
  const program = new Command();
  program.name("harnix").description("Project-local coding-agent harness for Kiro, Antigravity, and Codex.").version("0.1.0").showSuggestionAfterError();
  program.command("init").option("--yes", "Run without interactive prompts").option("--user <name>", "Developer workspace ID").option("--languages <csv>", "Comma-separated language IDs").option("--migrate", "Allow explicit legacy migration").option("--dry-run", "Preview without writing").action(async (options: { yes?: boolean; user?: string; languages?: string; migrate?: boolean; dryRun?: boolean }) => {
    const defaults = { developer: options.user ?? process.env.USERNAME ?? process.env.USER ?? "developer", languages: options.languages ?? "" };
    const answers = options.yes ? defaults : await inquirer.prompt<{ developer: string; languages: string }>([
      { default: defaults.developer, message: "Developer workspace ID", name: "developer", type: "input" },
      { default: defaults.languages, message: "Languages (comma-separated, optional)", name: "languages", type: "input" },
    ]);
    const languages = answers.languages.split(",").map((language) => language.trim()).filter(Boolean);
    const result = await initializeProject({ developer: answers.developer, dryRun: options.dryRun, languages: languages as never, migrate: options.migrate, root: await resolveProjectRoot(process.cwd()), yes: options.yes ?? false });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("setup").option("--kiro", "Configure Kiro").option("--antigravity", "Recognize Antigravity setup").option("--codex", "Configure Codex").action(async (options: { kiro?: boolean; antigravity?: boolean; codex?: boolean }) => {
    const platforms = (["kiro", "antigravity", "codex"] as const).filter((platform) => options[platform]);
    const result = await setupPlatforms({ platforms, root: await resolveProjectRoot(process.cwd()) });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("update").option("--restore", "Restore explicitly deleted managed files").action(async (options: { restore?: boolean }) => {
    const result = await updateProject({ root: await resolveProjectRoot(process.cwd()), restoreDeleted: options.restore });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("upgrade").option("--apply", "Run the displayed npm upgrade command").action(async (options: { apply?: boolean }) => {
    const result = await upgradeHarnix({ installedVersion: "0.1.0", apply: options.apply }); process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("uninstall").option("--purge", "Also remove .harnix project data").option("--yes", "Confirm purge").action(async (options: { purge?: boolean; yes?: boolean }) => {
    const result = await uninstallProject({ root: await resolveProjectRoot(process.cwd()), purge: options.purge, yes: options.yes }); process.stdout.write(`${JSON.stringify(result)}\n`); if (result.confirmationRequired) process.exitCode = 2;
  });
  program.command("mem").option("--query <query>").option("--user <id>").option("--limit <count>").option("--json", "Output stable JSON").action(async (options: { query?: string; user?: string; limit?: string }) => {
    const limit = options.limit === undefined ? undefined : Number.parseInt(options.limit, 10); if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error("--limit must be a positive integer."); const result = await searchMemory({ root: await resolveProjectRoot(process.cwd()), query: options.query, user: options.user, limit }); process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("doctor").option("--fix", "Repair safe, unchanged managed files").action(async (options: { fix?: boolean }) => {
    const result = await diagnoseProject({ root: await resolveProjectRoot(process.cwd()), fix: options.fix }); process.stdout.write(`${JSON.stringify(result)}\n`); if (!result.ok) process.exitCode = 1;
  });
  const internal = new Command("internal");
  internal.command("context").option("--platform <platform>").action(async (options: { platform: "kiro" | "antigravity" | "codex" }) => {
    if (!options.platform || !["kiro", "antigravity", "codex"].includes(options.platform)) throw new Error("--platform must be kiro, antigravity, or codex.");
    const output = await renderInternalContext(await resolveProjectRoot(process.cwd()), options.platform);
    if (output) process.stdout.write(`${output}\n`);
  });
  program.addCommand(internal, { hidden: true });
  return program;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await createProgram().parseAsync();
