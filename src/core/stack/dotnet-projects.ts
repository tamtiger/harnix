import { readFile, stat } from "node:fs/promises";
import { join, resolve, win32 } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";

const MAX_PROJECTS = 200;
const MAX_FILE_BYTES = 256 * 1024;
const PROJECT_FILE = /\.(?:csproj|fsproj|vbproj)$/iu;
const SOLUTION_FILE = /\.sln$/iu;
const TEST_PROJECT =
  /Microsoft\.NET\.Test\.Sdk|<IsTestProject>\s*true\s*<\/IsTestProject>|<PackageReference\s+Include="(?:xunit|nunit|mstest)[\w.]*"/iu;
// Every part is bounded and stops at a line end, so a hostile file cannot make the scan quadratic.
const SOLUTION_PROJECT =
  /Project\s{0,8}\([^)\r\n]{0,100}\)\s{0,8}=\s{0,8}"[^"\r\n]{0,260}"\s{0,8},\s{0,8}"([^"\r\n]{1,520}\.(?:csproj|fsproj|vbproj))"/giu;

export interface DotnetDirectory {
  hasTests: boolean;
  testCommand: string;
}

/** A .NET project file by name, whatever its case; Visual Basic and F# projects count too. */
export function isDotnetProjectFile(name: string): boolean {
  return PROJECT_FILE.test(name);
}

/** A solution file by name, whatever its case. */
export function isSolutionFile(name: string): boolean {
  return SOLUTION_FILE.test(name);
}

/** True when the project file references the test sdk, flags itself as a test project, or references a test framework. */
export function isDotnetTestProject(projectText: string): boolean {
  return TEST_PROJECT.test(projectText);
}

/** Project paths of a solution file, relative to the solution and with forward slashes; solution folders are skipped. */
export function solutionProjectPaths(solutionText: string): string[] {
  return [...solutionText.matchAll(SOLUTION_PROJECT)]
    .map((match) => match[1] ?? "")
    .filter((raw) => !leavesTheRepository(raw))
    .map((raw) => raw.replaceAll("\\", "/"));
}

/** An absolute, drive or UNC path in a solution file would be read from outside the repository (or over the network). */
function leavesTheRepository(path: string): boolean {
  return win32.isAbsolute(path) || /^[A-Za-z]:/u.test(path);
}

/**
 * Whether a .NET directory has tests and the command that runs them: with a solution the projects it references are
 * inspected and the command targets the (first) solution file; without one the project files of the directory are.
 */
export async function inspectDotnetDirectory(dir: string, entries: readonly string[]): Promise<DotnetDirectory> {
  const solutions = entries.filter(isSolutionFile).sort(compareCodeUnits);
  const solution = solutions[0];
  const projectFiles =
    solution === undefined
      ? entries.filter((name) => PROJECT_FILE.test(name)).map((name) => join(dir, name))
      : solutionProjectPaths((await readBoundedText(join(dir, solution))) ?? "").map((path) => resolve(dir, path));
  let hasTests = false;
  for (const file of projectFiles.slice(0, MAX_PROJECTS)) {
    if (isDotnetTestProject((await readBoundedText(file)) ?? "")) {
      hasTests = true;
      break;
    }
  }
  const target = solution === undefined ? "" : ` ${/\s/u.test(solution) ? `"${solution}"` : solution}`;
  return { hasTests, testCommand: `dotnet test${target}` };
}

async function readBoundedText(path: string): Promise<string | undefined> {
  try {
    if ((await stat(path)).size > MAX_FILE_BYTES) return undefined;
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}
