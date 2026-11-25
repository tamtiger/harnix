import { rm } from "node:fs/promises";

import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

import { scrubCheckOutput } from "./check-output.js";
import { redactCheckOutput } from "./output-redaction.js";

/** Where the full output of the last failing run of each check is kept; git-ignored and outside every input digest. */
export const CHECK_LOG_DIRECTORY = ".harnix/tmp/check-logs";
const LOG_LIMIT = 64 * 1024;
const TRUNCATED = "[truncated]\n";

/** A file name that cannot leave the log directory, whatever the check id looks like. */
function logName(checkId: string): string {
  return `${checkId.replace(/[^A-Za-z0-9._-]/gu, "_")}.log`;
}

async function logFile(harnixRoot: string, checkId: string): Promise<string> {
  return resolveSafeProjectPath(harnixRoot, `tmp/check-logs/${logName(checkId)}`);
}

/**
 * Keeps the output of a failing check so the agent can read the exact error without running the check again: the
 * last 64 KiB, with terminal colors and machine paths removed and the values the heuristic rules of
 * `redactCheckOutput` recognize as credentials replaced (a rule can miss a secret, so the log is local data to treat as
 * untrusted and sensitive). It replaces the previous log of the same check and returns the repository-relative POSIX
 * path. Never part of the task record.
 */
export async function writeCheckLog(harnixRoot: string, checkId: string, output: string): Promise<string> {
  const cleaned = scrubCheckOutput(redactCheckOutput(output));
  const body = cleaned.length > LOG_LIMIT ? `${TRUNCATED}${cleaned.slice(-LOG_LIMIT)}` : cleaned;
  await atomicWriteFile(await logFile(harnixRoot, checkId), `${body}\n`);
  return `${CHECK_LOG_DIRECTORY}/${logName(checkId)}`;
}

/** Drops the log of an earlier failure once the check passes, so nobody reads a stale error. */
export async function removeCheckLog(harnixRoot: string, checkId: string): Promise<void> {
  await rm(await logFile(harnixRoot, checkId), { force: true });
}
