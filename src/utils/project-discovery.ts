import { access, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve, win32 } from "node:path";

import { UnsafeProjectPathError, resolveSafeHarnixPath } from "./paths.js";

export type InitializedProjectResolution =
  | { kind: "ready"; root: string }
  | { kind: "none" }
  | { kind: "ambiguous" }
  | { kind: "invalid" };

export interface FindInitializedProjectOptions {
  cwd?: string | undefined;
  workspacePaths?: string[] | undefined;
}

/**
 * Finds the nearest safe Harnix root from a hook working directory, then falls
 * back to a single realpath-distinct workspace root. It deliberately does not
 * use Git discovery: hooks can run in ordinary folders as well as repositories.
 */
export async function findInitializedProject(options: FindInitializedProjectOptions): Promise<InitializedProjectResolution> {
  let invalid = false;
  if (await isUsableAbsoluteDirectory(options.cwd)) {
    const fromCwd = await nearestInitializedRoot(options.cwd!);
    if (fromCwd.kind !== "none") return fromCwd;
  }

  const roots = new Map<string, string>();
  for (const workspace of options.workspacePaths ?? []) {
    if (!await isUsableAbsoluteDirectory(workspace)) continue;
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

async function nearestInitializedRoot(start: string): Promise<InitializedProjectResolution> {
  let current = resolve(start);
  while (true) {
    try {
      const config = await resolveSafeHarnixPath(current, "config.yaml");
      await access(config);
      return { kind: "ready", root: await realpath(current) };
    } catch (error: unknown) {
      if (error instanceof UnsafeProjectPathError) return { kind: "invalid" };
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
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT";
}
