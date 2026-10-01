import { readFile, readdir, stat } from "node:fs/promises";
import { GlobalManagedManifestError } from "src/core/global/managed-error.js";
import { type UserPathRoot } from "src/core/platform/user-paths.js";
import { entryKey, isMissingPathError, normalizeGlobalPath, resolveSafeGlobalPath } from "src/core/global/manifest.js";
import { type GlobalManagedEntry, type PreparedDesired, type TargetState } from "src/core/global/types.js";

export async function loadTargetStates(
  relativePaths: readonly string[],
  paths: ReadonlyMap<string, string>,
): Promise<Map<string, TargetState>> {
  const states = await Promise.all(
    relativePaths.map(async (relativePath) => {
      const absolutePath = paths.get(relativePath);
      if (absolutePath === undefined) {
        throw new GlobalManagedManifestError("Missing resolved global managed path.");
      }
      const content = await readOptionalText(absolutePath);
      return [relativePath, { relativePath, absolutePath, original: content, current: content }] as const;
    }),
  );
  return new Map(states);
}

export async function markUnownedSkillUnitCollisions(
  targetStates: ReadonlyMap<string, TargetState>,
  prepared: readonly PreparedDesired[],
  previousByKey: ReadonlyMap<string, GlobalManagedEntry>,
  root: UserPathRoot,
): Promise<void> {
  for (const item of prepared) {
    if (item.entry.kind !== "file" || previousByKey.has(entryKey(item.entry))) {
      continue;
    }
    const unitPath = harnixSkillUnitPath(item.entry.path);
    if (unitPath === undefined) {
      continue;
    }
    const target = getTargetState(targetStates, item.entry.path);
    if (target.current !== undefined) {
      continue;
    }
    if (await pathExists(await resolveSafeGlobalPath(root, unitPath))) {
      target.unownedSkillUnit = true;
    }
  }
}

function harnixSkillUnitPath(path: string): string | undefined {
  const segments = path.split("/");
  if (
    segments.length !== 3 ||
    segments[0] !== "skills" ||
    !segments[1]?.startsWith("harnix-") ||
    segments[2] !== "SKILL.md"
  ) {
    return undefined;
  }
  return `${segments[0]}/${segments[1]}`;
}

export function getTargetState(states: ReadonlyMap<string, TargetState>, path: string): TargetState {
  const state = states.get(path);
  if (state === undefined) {
    throw new GlobalManagedManifestError("Missing global managed target state.");
  }
  return state;
}

export async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return undefined;
    }
    throw error;
  }
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return false;
    }
    throw error;
  }
}

export async function rootContainsOnlyOwnedLock(
  root: UserPathRoot,
  lockPath: string | undefined,
  lockRecordName: string | undefined,
  lockContent: string | undefined,
): Promise<boolean> {
  if (
    lockPath === undefined ||
    lockRecordName === undefined ||
    lockContent === undefined ||
    lockPath.includes("/") ||
    lockRecordName.includes("/")
  ) {
    return false;
  }
  const normalizedLockPath = normalizeGlobalPath(lockPath);
  const normalizedRecordName = normalizeGlobalPath(lockRecordName);
  const absoluteLockPath = await resolveSafeGlobalPath(root, normalizedLockPath);
  const absoluteRecordPath = await resolveSafeGlobalPath(root, `${normalizedLockPath}/${normalizedRecordName}`);
  try {
    const rootEntries = await readdir(root.path);
    const lockEntries = await readdir(absoluteLockPath);
    return (
      rootEntries.length === 1 &&
      rootEntries[0] === normalizedLockPath &&
      lockEntries.length === 1 &&
      lockEntries[0] === normalizedRecordName &&
      (await readFile(absoluteRecordPath, "utf8")) === lockContent
    );
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return false;
    }
    throw error;
  }
}
