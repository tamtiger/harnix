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
 * and the root manifests only when the directory has both trees, so an edit to documentation or the changelog does not
 * make the passing suite stale. Any other layout keeps the wildcard, and `--input` always overrides this.
 */
export async function defaultCheckInputs(root: string, cwd: string | undefined): Promise<string[]> {
  const prefix = cwd === undefined ? "" : `${cwd}/`;
  const { directories, files } = await entries(cwd === undefined ? root : join(root, cwd));
  const tests = TEST_TREES.filter((name) => directories.has(name));
  if (!directories.has(SOURCE_TREE) || tests.length === 0) return [`${prefix}**`];
  const trees = [SOURCE_TREE, ...tests].map((name) => `${name}/**`);
  const manifests = MANIFESTS.filter((name) => files.has(name));
  return [...trees, ...manifests].map((input) => `${prefix}${input}`).sort(compareCodeUnits);
}
