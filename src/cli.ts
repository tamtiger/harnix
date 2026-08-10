#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { realpathSync } from "node:fs";
import { stat } from "node:fs/promises";
import { isAbsolute, win32 } from "node:path";
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
import { packageVersion } from "./version.js";

export interface ProgramOptions { interactive?: boolean | undefined; hookEventInput?: (() => Promise<string>) | undefined; }

export function createProgram(programOptions: ProgramOptions = {}): Command {
  const program = new Command();
  const interactive = programOptions.interactive ?? process.stdin.isTTY === true;
  program.name("harnix").description("Project-local coding-agent harness for Kiro, Antigravity, and Codex.").version(packageVersion).showSuggestionAfterError().exitOverride();
  program.command("init").option("--yes", "Run without interactive prompts").option("--user <name>", "Developer workspace ID").option("--languages <csv>", "Comma-separated language IDs").option("--dry-run", "Preview without writing").action(async (options: { yes?: boolean; user?: string; languages?: string; dryRun?: boolean }) => {
    const defaults = { developer: options.user ?? process.env.USERNAME ?? process.env.USER ?? "developer", languages: options.languages };
    const answers = options.yes || !interactive ? defaults : await inquirer.prompt<{ developer: string; languages?: string }>([
      { default: defaults.developer, message: "Developer workspace ID", name: "developer", type: "input" },
      { default: defaults.languages ?? "", message: "Languages (comma-separated, optional)", name: "languages", type: "input" },
    ]);
    const languages = answers.languages === undefined || answers.languages.trim() === "" ? undefined : answers.languages.split(",").map((language) => language.trim()).filter(Boolean);
    const result = await initializeProject({ developer: answers.developer, dryRun: options.dryRun, languages: languages as never, root: await resolveProjectRoot(process.cwd()), yes: options.yes ?? !interactive });
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
    const result = await upgradeHarnix({ installedVersion: packageVersion, apply: options.apply }); process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("uninstall").option("--purge", "Also remove .harnix project data").option("--yes", "Confirm purge").action(async (options: { purge?: boolean; yes?: boolean }) => {
    const result = await uninstallProject({ root: await resolveProjectRoot(process.cwd()), purge: options.purge, yes: options.yes }); process.stdout.write(`${JSON.stringify(result)}\n`); if (result.confirmationRequired) process.exitCode = 2;
  });
  program.command("mem").argument("[query]").option("--query <query>").option("--user <id>").option("--limit <count>").option("--json", "Output stable JSON").action(async (query: string | undefined, options: { query?: string; user?: string; limit?: string }) => {
    const limit = options.limit === undefined ? undefined : /^\d+$/u.test(options.limit) ? Number(options.limit) : Number.NaN; if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error("--limit must be a positive integer."); const result = await searchMemory({ root: await resolveProjectRoot(process.cwd()), query: options.query ?? query, user: options.user, limit }); process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("doctor").option("--fix", "Repair safe, unchanged managed files").option("--json", "Output stable JSON").action(async (options: { fix?: boolean; json?: boolean }) => {
    const result = await diagnoseProject({ root: await resolveProjectRoot(process.cwd()), fix: options.fix }); process.stdout.write(`${JSON.stringify(result)}\n`); if (!result.ok) process.exitCode = result.findings.some((item) => item.code === "config-invalid" || item.code === "manifest-invalid" || item.code === "unsafe-managed-path" || item.code === "unsafe-path") ? 2 : 1;
  });
  const internal = new Command("internal");
  internal.command("context").option("--platform <platform>").action(async (options: { platform: "kiro" | "antigravity" | "codex" }) => {
    if (!options.platform || !["kiro", "antigravity", "codex"].includes(options.platform)) throw new Error("--platform must be kiro, antigravity, or codex.");
    const hookInput = programOptions.hookEventInput ? await programOptions.hookEventInput() : process.stdin.isTTY === true ? "" : await readBoundedStdin();
    const hookCwd = await validatedHookCwd(hookInput, process.cwd());
    const output = await renderInternalContext(await resolveProjectRoot(hookCwd), options.platform);
    if (output) process.stdout.write(`${output}\n`);
  });
  program.addCommand(internal, { hidden: true });
  return program;
}

export async function runCli(argv = process.argv): Promise<number> {
  process.exitCode = undefined;
  try {
    await createProgram().parseAsync(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error: unknown) {
    const commanderExit = typeof error === "object" && error !== null && "code" in error && String(error.code).startsWith("commander.");
    if (commanderExit) return "exitCode" in error && error.exitCode === 0 ? 0 : 2;
    process.stderr.write(`${publicErrorMessage(error)}\n`);
    return 2;
  }
}

function publicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Harnix operation failed.";
  return message
    .replaceAll(process.cwd(), "[PROJECT]")
    .replace(/(['"])(?:[A-Za-z]:\\|\/)[^'"\r\n]+\1/gu, "'[PROJECT]'")
    .replace(/((?:token|secret|password|api[_-]?key)\s*[=:]\s*)[^\s,]+/giu, "$1[REDACTED]");
}

async function validatedHookCwd(source: string, fallback: string): Promise<string> {
  if (source.trim().length === 0) return fallback;
  let event: unknown;
  try { event = JSON.parse(source); }
  catch { throw new Error("Hook input must be valid JSON."); }
  if (typeof event !== "object" || event === null || Array.isArray(event)) throw new Error("Hook input must be a JSON object.");
  const cwd = (event as { cwd?: unknown }).cwd;
  if (cwd === undefined) return fallback;
  if (typeof cwd !== "string" || cwd.length === 0 || cwd.length > 32_768 || cwd.includes("\0") || (!isAbsolute(cwd) && !win32.isAbsolute(cwd))) throw new Error("Hook cwd must be a valid absolute directory.");
  try { if (!(await stat(cwd)).isDirectory()) throw new Error("not-directory"); }
  catch { throw new Error("Hook cwd must be an existing directory."); }
  return cwd;
}

async function readBoundedStdin(): Promise<string> {
  const chunks: Buffer[] = []; let length = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += buffer.length;
    if (length > 65_536) throw new Error("Hook input exceeds 65536 bytes.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

if (isCliEntryPoint()) process.exitCode = await runCli();

function isCliEntryPoint(): boolean {
  const entryPath = process.argv[1];
  if (entryPath === undefined) return false;
  try { return realpathSync(entryPath) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
