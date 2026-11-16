import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";

const SOURCE_TREE = "src";
const TEST_TREES = ["test", "tests", "spec", "__tests__"];
/** Root files that change what the tests do without living in a source or test tree. */
const MANIFESTS = [
  "package.json",
  "tsconfig.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
];
/** Root files that configure the test runner, the linter, the dependency set or the .NET build, matched by file name. */
const CONFIG_FILES = [
  /^(?:vitest|vite|jest|eslint|prettier|tsup|playwright)\.config\.[cm]?[jt]s$/u,
  /^\.eslintrc(?:\.[a-z]+)?$/u,
  /^\.prettierrc(?:\.[a-z]+)?$/u,
  /^(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock|Cargo\.lock|go\.sum|poetry\.lock|uv\.lock)$/u,
  /^(?:pytest\.ini|tox\.ini|setup\.cfg|global\.json|nuget\.config)$/iu,
  /^Directory\.(?:Build|Packages)\.(?:props|targets)$/u,
  /\.sln$/u,
];

async function entries(directory: string): Promise<{ directories: Set<string>; files: Set<string> }> {
  const found = { directories: new Set<string>(), files: new Set<string>() };
  try {
    for (const entry of await readdir(directory, { withFileTypes: true }))
      (entry.isDirectory() ? found.directories : found.files).add(entry.name);
  } catch {
    // An unreadable directory is the same as an unknown layout: the caller falls back to the wildcard.
  }
  return found;
}

/**
 * The inputs of the default check `--init` creates: `**` (or `<cwd>/**`), narrowed to the source tree, the test tree
 * and the root manifests, config, lock and solution files only when the directory has both trees, so an edit to documentation or the changelog does not
 * make the passing suite stale. Any other layout keeps the wildcard, and `--input` always overrides this.
 */
export async function defaultCheckInputs(root: string, cwd: string | undefined): Promise<string[]> {
  const prefix = cwd === undefined ? "" : `${cwd}/`;
  const { directories, files } = await entries(cwd === undefined ? root : join(root, cwd));
  const tests = TEST_TREES.filter((name) => directories.has(name));
  if (!directories.has(SOURCE_TREE) || tests.length === 0) return [`${prefix}**`];
  const trees = [SOURCE_TREE, ...tests].map((name) => `${name}/**`);
  const manifests = [...files].filter((name) => MANIFESTS.includes(name) || CONFIG_FILES.some((rx) => rx.test(name)));
  return [...trees, ...manifests].map((input) => `${prefix}${input}`).sort(compareCodeUnits);
}
