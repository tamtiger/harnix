import { readFile, rm } from "node:fs/promises";
import { decideObsoleteFile, decideWholeFile } from "src/core/managed/decision.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import type { AtomicFileSystem } from "src/utils/atomic-write.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { sha256 } from "src/utils/hashing.js";
import { compareCodeUnits } from "src/utils/order.js";

export type ManagedScope = "project" | "kiro" | "antigravity" | "codex";
export interface ManagedEntry {
  path: string;
  sourceId: string;
  scope: ManagedScope;
  generatedHash: string;
  generatorVersion: string;
}
export interface ManagedManifest {
  generator: "harnix";
  schemaVersion: 1;
  entries: ManagedEntry[];
}
export type OwnershipState = "new" | "unchanged" | "modified" | "deleted" | "obsolete-unchanged" | "obsolete-modified";

export class ManagedManifestError extends Error {
  override name = "ManagedManifestError";
}

export function validateManifest(value: unknown): ManagedManifest {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || !Array.isArray(value.entries))
    throw new ManagedManifestError("Invalid or unsupported managed manifest.");
  let previous = "";
  const entries = value.entries.map((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.path !== "string" ||
      typeof entry.sourceId !== "string" ||
      typeof entry.scope !== "string" ||
      typeof entry.generatedHash !== "string" ||
      !/^[a-f0-9]{64}$/u.test(entry.generatedHash) ||
      typeof entry.generatorVersion !== "string"
    )
      throw new ManagedManifestError("Invalid managed manifest entry.");
    const path = normalizeRepositoryPath(entry.path, { allowRoot: true });
    if (path !== entry.path || path <= previous || !["project", "kiro", "antigravity", "codex"].includes(entry.scope))
      throw new ManagedManifestError("Managed manifest entries must be safe and sorted.");
    previous = path;
    return entry as unknown as ManagedEntry;
  });
  return { generator: "harnix", schemaVersion: 1, entries };
}

export async function readManifest(path: string): Promise<ManagedManifest> {
  const { parse } = await import("yaml");
  return validateManifest(parse(await readFile(path, "utf8")));
}

export async function writeManifest(
  path: string,
  manifest: ManagedManifest,
  options: { filesystem?: AtomicFileSystem; randomSuffix?: () => string } = {},
): Promise<void> {
  await atomicWriteFile(path, `${JSON.stringify(validateManifest(manifest), null, 2)}\n`, options);
}

export async function ownershipState(
  projectRoot: string,
  desired: ManagedEntry,
  previous?: ManagedEntry,
): Promise<OwnershipState> {
  const target = await resolveSafeProjectPath(projectRoot, desired.path);
  try {
    const content = await readFile(target, "utf8");
    if (!previous) return "modified";
    return sha256(content) === previous.generatedHash ? "unchanged" : "modified";
  } catch (error: unknown) {
    if (isMissing(error)) return previous ? "deleted" : "new";
    throw error;
  }
}

export async function obsoleteState(projectRoot: string, entry: ManagedEntry): Promise<OwnershipState> {
  return (await ownershipState(projectRoot, entry, entry)) === "unchanged" ? "obsolete-unchanged" : "obsolete-modified";
}

export interface DesiredManagedFile {
  entry: ManagedEntry;
  content: string;
}
export interface ReconcileResult {
  created: string[];
  updated: string[];
  metadataUpdated: string[];
  preserved: string[];
  deleted: string[];
  obsolete: string[];
}

export async function reconcileManagedFiles(
  projectRoot: string,
  manifest: ManagedManifest,
  desired: DesiredManagedFile[],
  options: {
    generatorVersion: string;
    removeObsolete?: boolean | undefined;
    restoreDeleted?: boolean | undefined;
    dryRun?: boolean | undefined;
  } = {
    generatorVersion: "unknown",
  },
): Promise<{ manifest: ManagedManifest; result: ReconcileResult }> {
  await Promise.all([
    ...manifest.entries.map((entry) => resolveSafeProjectPath(projectRoot, entry.path)),
    ...desired.map((file) => resolveSafeProjectPath(projectRoot, file.entry.path)),
  ]);
  const oldByPath = new Map(manifest.entries.map((entry) => [entry.path, entry]));
  const result: ReconcileResult = {
    created: [],
    updated: [],
    metadataUpdated: [],
    preserved: [],
    deleted: [],
    obsolete: [],
  };
  const nextEntries: ManagedEntry[] = [];
  for (const file of desired.sort((a, b) => compareCodeUnits(a.entry.path, b.entry.path))) {
    const entry = { ...file.entry, generatorVersion: options.generatorVersion };
    const previous = oldByPath.get(entry.path);
    const target = await resolveSafeProjectPath(projectRoot, entry.path);
    const generatedHash = sha256(file.content);
    oldByPath.delete(entry.path);
    switch (
      decideWholeFile({
        current: await readOptionalText(target),
        previousHash: previous?.generatedHash,
        desiredHash: generatedHash,
        restoreDeleted: options.restoreDeleted === true,
      })
    ) {
      case "create":
        if (options.dryRun !== true) await atomicWriteFile(target, file.content);
        result.created.push(entry.path);
        nextEntries.push({ ...entry, generatedHash });
        break;
      case "keep-deleted":
        result.deleted.push(entry.path);
        nextEntries.push(previous!);
        break;
      case "collision":
        result.preserved.push(entry.path);
        break;
      case "keep-modified":
        result.preserved.push(entry.path);
        nextEntries.push(previous!);
        break;
      case "update":
        if (options.dryRun !== true) await atomicWriteFile(target, file.content);
        result.updated.push(entry.path);
        nextEntries.push({ ...entry, generatedHash });
        break;
      case "unchanged":
        result.preserved.push(entry.path);
        if (
          previous!.generatorVersion !== entry.generatorVersion ||
          previous!.sourceId !== entry.sourceId ||
          previous!.scope !== entry.scope
        ) {
          result.metadataUpdated.push(entry.path);
        }
        nextEntries.push({ ...entry, generatedHash });
        break;
    }
  }
  for (const obsolete of oldByPath.values()) {
    const target = await resolveSafeProjectPath(projectRoot, obsolete.path);
    const removable =
      decideObsoleteFile(await readOptionalText(target), obsolete.generatedHash) === "remove" &&
      options.removeObsolete === true;
    if (removable) {
      if (options.dryRun !== true) await rm(target, { force: true });
      result.deleted.push(obsolete.path);
    } else {
      result[(await obsoleteState(projectRoot, obsolete)) === "obsolete-unchanged" ? "obsolete" : "preserved"].push(
        obsolete.path,
      );
      nextEntries.push(obsolete);
    }
  }
  return {
    manifest: validateManifest({
      generator: "harnix",
      schemaVersion: 1,
      entries: nextEntries.sort((left, right) => compareCodeUnits(left.path, right.path)),
    }),
    result,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"
  );
}

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}
