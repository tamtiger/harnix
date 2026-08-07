#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { fileURLToPath } from "node:url";

import { initializeProject } from "./commands/init.js";
import { setupPlatforms } from "./commands/setup.js";
import { resolveProjectRoot } from "./utils/paths.js";
import { renderInternalContext } from "./commands/internal-context.js";

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
