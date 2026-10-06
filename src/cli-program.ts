#!/usr/bin/env node

import { Command } from "commander";

import { registerProjectCommands } from "./cli-project-commands.js";
import { registerWorkflowCliCommands } from "./cli-workflow-commands.js";
import {
  isHiddenProtocolInvocation,
  publicCliError,
  redactPublicErrorMessage,
  type ProgramOptions,
} from "./cli-helpers.js";
import { registerWorkflowCommand } from "./commands/workflow-command.js";
import { packageVersion } from "./version.js";

export type { ProgramOptions, PublicCliErrorV1 } from "./cli-helpers.js";
export { defaultDeveloperId, publicCliError, redactPublicErrorMessage } from "./cli-helpers.js";

export function createProgram(programOptions: ProgramOptions = {}): Command {
  const program = new Command();
  program
    .name("harnix")
    .description(
      "Coding-agent harness with project-local workflow data and user-global Kiro, Antigravity, Codex, Claude Code, OpenCode, and Cursor integrations.",
    )
    .version(packageVersion)
    .showSuggestionAfterError()
    .exitOverride();

  registerProjectCommands(program, programOptions);
  registerWorkflowCliCommands(program, programOptions);
  registerWorkflowCommand(program, programOptions);

  return program;
}

export async function runCli(argv = process.argv, programOptions: ProgramOptions = {}): Promise<number> {
  process.exitCode = undefined;
  const hiddenProtocol = isHiddenProtocolInvocation(argv);
  const program = createProgram(programOptions);
  if (!hiddenProtocol) program.configureOutput({ writeErr: () => undefined });
  try {
    await program.parseAsync(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error: unknown) {
    const commanderExit =
      typeof error === "object" && error !== null && "code" in error && String(error.code).startsWith("commander.");
    if (commanderExit && "exitCode" in error && error.exitCode === 0) return 0;
    const exitCode = 2;
    const message = redactPublicErrorMessage(error);
    if (!commanderExit || !hiddenProtocol) process.stderr.write(`${message}\n`);
    if (!hiddenProtocol) process.stdout.write(`${JSON.stringify(publicCliError(message, exitCode))}\n`);
    return exitCode;
  }
}
