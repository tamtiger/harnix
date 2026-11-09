import { readdir, stat } from "node:fs/promises";
import { win32 } from "node:path";

import { inspectDotnetDirectory, isSolutionFile } from "src/core/stack/dotnet-projects.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";
import { equivalentCommand, splitCommand } from "./command-match.js";

// A solution path becomes an argument of a spawned command, so anything a shell or an option parser reads is refused.
const UNSAFE_CHARACTERS = /[;&|<>`$()^%!*?{}\r\n\0\\]/u;

function joinedPath(argument: string, cwd: string | undefined): string {
  return cwd === undefined || cwd === "." ? argument : `${cwd}/${argument}`;
}

/**
 * True when `argument` names an existing `.sln` file inside the repository: a relative POSIX path (relative to the
 * check's cwd when it declares one) with no parent segment, no absolute, drive or UNC form, no shell character and no
 * leading option dash, whose real location stays below the project root (a symlink or junction that leaves it fails).
 */
export async function isSafeSolutionArgument(
  projectRoot: string,
  argument: string,
  cwd: string | undefined,
): Promise<boolean> {
  if (argument.startsWith("-") || !isSolutionFile(argument) || UNSAFE_CHARACTERS.test(argument)) return false;
  if (argument.startsWith("/") || win32.isAbsolute(argument) || /^[A-Za-z]:/u.test(argument)) return false;
  const path = joinedPath(argument, cwd);
  if (path.split("/").some((segment) => segment === ".." || segment === "")) return false;
  try {
    // The file itself is resolved, so a link that leaves the repository fails even when its directory is inside.
    return (await stat(await resolveSafeProjectPath(projectRoot, path))).isFile();
  } catch {
    return false;
  }
}

/** True when the directory holds a solution or project that has a test project, so a bare `dotnet test` there tests something. */
async function isDotnetTestDirectory(projectRoot: string, cwd: string): Promise<boolean> {
  try {
    const directory = await resolveSafeProjectPath(projectRoot, cwd);
    return (await inspectDotnetDirectory(directory, await readdir(directory))).hasTests;
  } catch {
    return false;
  }
}

const unquote = (word: string): string => word.replace(/["']/gu, "");

/**
 * Whether a suite check's command proves the whole suite: the detected project test command, or in a .NET repository
 * `dotnet test <solution.sln>` with a safe path, or a bare `dotnet test` whose check declares the `cwd` of a solution
 * or project. Without a detected test command only the inputs are judged.
 */
export async function acceptsSuiteCommand(
  projectRoot: string,
  command: string | undefined,
  cwd: string | undefined,
  known: readonly string[],
): Promise<boolean> {
  if (known.length === 0) return true;
  if (command === undefined) return false;
  if (known.some((candidate) => equivalentCommand(candidate, command))) return true;
  const [executable, verb, ...rest] = splitCommand(command).map(unquote);
  if (executable?.replace(/\.(?:exe|cmd|bat)$/iu, "").toLowerCase() !== "dotnet" || verb !== "test") return false;
  if (rest.length === 0) return cwd !== undefined && cwd !== "." && (await isDotnetTestDirectory(projectRoot, cwd));
  return rest.length === 1 && (await isSafeSolutionArgument(projectRoot, rest[0] ?? "", cwd));
}
