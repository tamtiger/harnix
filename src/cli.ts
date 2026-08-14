#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { runInternalContextCommand } from "./commands/internal-context-cli.js";
import type { InternalContextPlatform } from "./commands/internal-context.js";
import { readBoundedInput } from "./utils/bounded-input.js";

/**
 * Returns a platform only for the fixed command shape emitted by Harnix's
 * global hooks. Other spellings keep using Commander in the regular CLI so
 * user-facing parsing and diagnostics remain unchanged.
 */
export function canonicalInternalContextPlatform(argv: readonly string[]): InternalContextPlatform | undefined {
  const args = argv.slice(2);
  if (args.length !== 4 || args[0] !== "internal" || args[1] !== "context" || args[2] !== "--platform") return undefined;
  const platform = args[3];
  return platform === "kiro" || platform === "antigravity" || platform === "codex" ? platform : undefined;
}

export async function runEntrypoint(argv = process.argv): Promise<number> {
  const platform = canonicalInternalContextPlatform(argv);
  if (platform !== undefined) {
    try {
      const hookInput = process.stdin.isTTY === true ? "" : await readBoundedInput(process.stdin);
      await runInternalContextCommand({ hookInput, platform });
    } catch {
      // The fixed command shape is emitted only by global hooks. A broken
      // stream or inaccessible cwd must not block a prompt in every workspace.
    }
    return 0;
  }

  const { runCli } = await import("./cli-program.js");
  return runCli(argv);
}

if (isCliEntryPoint()) process.exitCode = await runEntrypoint();

function isCliEntryPoint(): boolean {
  const entryPath = process.argv[1];
  if (entryPath === undefined) return false;
  try { return realpathSync(entryPath) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
