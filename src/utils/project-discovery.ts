import { access, readdir, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, win32 } from "node:path";

import { compareCodeUnits } from "./order.js";
import { UnsafeProjectPathError, resolveSafeHarnixPath } from "./paths.js";

const CHILD_LISTING_LIMIT = 10;
/** Only plain names reach a message: a directory name is untrusted text and must not carry control or markup characters. */
const SAFE_CHILD_NAME = /^[\p{L}\p{N} ._-]{1,64}$/u;
const MISSING_PROJECT_MESSAGE = "No initialized Harnix project found from the current directory.";

export type InitializedProjectResolution =
  { kind: "ready"; root: string } | { kind: "none" } | { kind: "ambiguous" } | { kind: "invalid" };

export interface FindInitializedProjectOptions {
  cwd?: string | undefined;
  workspacePaths?: string[] | undefined;
}

/**
 * Finds the nearest safe Harnix root from a hook working directory, then falls
 * back to a single realpath-distinct workspace root. It deliberately does not
 * use Git discovery: hooks can run in ordinary folders as well as repositories.
 */
export async function findInitializedProject(
  options: FindInitializedProjectOptions,
): Promise<InitializedProjectResolution> {
  let invalid = false;
  if (await isUsableAbsoluteDirectory(options.cwd)) {
    const fromCwd = await nearestInitializedRoot(options.cwd!);
    if (fromCwd.kind !== "none") return fromCwd;
  }

  const roots = new Map<string, string>();
  for (const workspace of options.workspacePaths ?? []) {
    if (!(await isUsableAbsoluteDirectory(workspace))) continue;
    const discovered = await nearestInitializedRoot(workspace);
    if (discovered.kind === "invalid") {
      invalid = true;
      continue;
    }
    if (discovered.kind === "ready") roots.set(discovered.root, discovered.root);
  }

  if (roots.size === 1) return { kind: "ready", root: roots.values().next().value! };
  if (roots.size > 1) return { kind: "ambiguous" };
  return invalid ? { kind: "invalid" } : { kind: "none" };
}

/**
 * Names of the first-level directories of `cwd` that hold a valid `.harnix/config.yaml`, for a message that helps the
 * user pick a project; read-only, skips links and hidden directories, never throws.
 */
export async function listInitializedChildren(cwd: string, limit = CHILD_LISTING_LIMIT): Promise<string[]> {
  let names: string[];
  try {
    const entries = await readdir(cwd, { withFileTypes: true });
    names = entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules" &&
          SAFE_CHILD_NAME.test(entry.name),
      )
      .map((entry) => entry.name)
      .sort(compareCodeUnits);
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const name of names) {
    if (found.length >= limit) break;
    try {
      await access(await resolveSafeHarnixPath(join(cwd, name), "config.yaml"));
      found.push(name);
    } catch {
      // Not initialized, or its state escapes the directory: not offered as a choice.
    }
  }
  return found;
}

/** A sentence naming initialized child projects, or an empty string when there are none. */
export async function initializedChildrenHint(cwd: string): Promise<string> {
  const children = await listInitializedChildren(cwd);
  return children.length === 0
    ? ""
    : ` Initialized projects below this directory: ${children.join(", ")}. Run the command from inside one of them.`;
}

/** The nearest initialized Harnix root of `cwd`, or an error that says why there is none; never creates state. */
export async function requireInitializedProject(cwd: string): Promise<string> {
  const project = await findInitializedProject({ cwd });
  if (project.kind === "ready") return project.root;
  if (project.kind === "invalid") throw new Error("The Harnix project state is invalid.");
  throw new Error(`${MISSING_PROJECT_MESSAGE}${await initializedChildrenHint(cwd)}`);
}

async function nearestInitializedRoot(start: string): Promise<InitializedProjectResolution> {
  let current = resolve(start);
  while (true) {
    try {
      const config = await resolveSafeHarnixPath(current, "config.yaml");
      await access(config);
      return { kind: "ready", root: await realpath(current) };
    } catch (error: unknown) {
      if (error instanceof UnsafeProjectPathError) return { kind: "invalid" };
      // A global hook can start below a directory whose ancestors are not
      // readable by the current process. Treat that branch as unavailable so
      // explicitly supplied workspace roots can still be considered safely.
      if (isInaccessible(error)) return { kind: "none" };
      if (!isMissing(error)) throw error;
    }
    const parent = dirname(current);
    if (parent === current) return { kind: "none" };
    current = parent;
  }
}

async function isUsableAbsoluteDirectory(value: string | undefined): Promise<boolean> {
  if (typeof value !== "string" || value.length === 0 || (!isAbsolute(value) && !win32.isAbsolute(value))) return false;
  try {
    return (await stat(value)).isDirectory();
  } catch {
    return false;
  }
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT"
  );
}

function isInaccessible(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["EACCES", "EPERM"].includes(String((error as { code?: unknown }).code))
  );
}
