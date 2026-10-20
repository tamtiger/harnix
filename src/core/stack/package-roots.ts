import { posix } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";
import { isDotnetProjectFile, isSolutionFile, solutionProjectPaths } from "./dotnet-projects.js";

const MANIFESTS = new Set([
  "package.json",
  "composer.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "go.mod",
  "Cargo.toml",
  "pyproject.toml",
]);

/**
 * The directories that are one package each, as repository-relative POSIX paths (`.` is the root): the directory of
 * every package manifest, of every solution and of every .NET project, minus the directories of the projects that a
 * solution references (a solution runs and describes them as one unit).
 */
export async function findPackageRoots(
  files: readonly { path: string }[],
  readText: (path: string) => Promise<string | undefined>,
): Promise<string[]> {
  const roots = new Set<string>();
  const solutionDirs = new Set<string>();
  const covered = new Set<string>();
  const projectDirs = new Set<string>();
  for (const { path } of files) {
    const name = posix.basename(path);
    const dir = posix.dirname(path);
    if (MANIFESTS.has(name)) roots.add(dir);
    else if (isDotnetProjectFile(name)) projectDirs.add(dir);
    else if (isSolutionFile(name)) {
      solutionDirs.add(dir);
      for (const project of solutionProjectPaths((await readText(path)) ?? "")) {
        const projectDir = posix.normalize(posix.join(dir, posix.dirname(project)));
        const escapes = projectDir === ".." || projectDir.startsWith("../");
        if (!escapes && projectDir !== dir) covered.add(projectDir);
      }
    }
  }
  for (const dir of solutionDirs) roots.add(dir);
  // Only a .NET project is folded into its solution; a manifest in the same directory still makes a package.
  for (const dir of projectDirs) if (!covered.has(dir) || solutionDirs.has(dir)) roots.add(dir);
  return [...roots].sort(compareCodeUnits);
}
