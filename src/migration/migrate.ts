import { access, lstat, readdir, readFile, rename, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { createHash } from "node:crypto";

import { createConfig, writeConfig } from "../core/config/config.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { sha256 } from "../utils/hashing.js";
import { compareCodeUnits } from "../utils/order.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import { workflowTemplate } from "../templates/harnix/workflow.js";
import { discoverLegacy } from "./discovery.js";
import { packageVersion } from "../version.js";

export interface MigrateOptions { root: string; developer?: string | undefined; apply?: boolean | undefined; cleanupLegacy?: boolean | undefined; }
export interface MigrateResult { legacy: string[]; conflicts: string[]; staged: boolean; activated: boolean; cleaned: string[]; }
export interface MigrationDependencies { beforeVerifyStage?: (stagedTree: string) => Promise<void>; }
interface MigrationFile { source: string; sourceRelative: string; destination: string; hash: string; }
interface InventoryFile { source: string; destination: string; hash: string; }

export async function migrateLegacyProject(options: MigrateOptions, dependencies: MigrationDependencies = {}): Promise<MigrateResult> {
  const legacy = await discoverLegacy(options.root); const target = await resolveSafeHarnixPath(options.root);
  const conflicts: string[] = []; try { await access(target); conflicts.push(".harnix"); } catch { /* absent is expected */ }
  const migrationFiles = await inventoryLegacyFiles(options.root, legacy, conflicts);
  if (!options.apply || conflicts.length > 0) return { legacy, conflicts, staged: false, activated: false, cleaned: [] };
  const stage = join(dirname(options.root), `.${basename(options.root)}.harnix-stage-${process.pid}-${Date.now()}`);
  const stagedTree = join(stage, ".harnix");
  try {
    const developer = options.developer ?? "migration";
    await writeConfig(join(stagedTree, "config.yaml"), createConfig({ developer }));
    await atomicWriteFile(join(stagedTree, "workflow.md"), workflowTemplate);
    await atomicWriteFile(join(stagedTree, ".template-hashes.json"), `${JSON.stringify({ generator: "harnix", schemaVersion: 1, entries: [{ path: ".harnix/workflow.md", sourceId: "workflow", scope: "project", generatedHash: sha256(workflowTemplate), generatorVersion: packageVersion }] }, null, 2)}\n`);
    for (const file of migrationFiles) await atomicWriteFile(join(stagedTree, ...file.destination.split("/")), await readFile(file.source));
    await dependencies.beforeVerifyStage?.(stagedTree);
    await verifyStage(stagedTree, migrationFiles);
    await rename(stagedTree, target);
    const cleaned = options.cleanupLegacy ? await cleanupLegacy(options.root, legacy, migrationFiles) : [];
    return { legacy, conflicts, staged: true, activated: true, cleaned };
  } catch (error) { await rm(stage, { force: true, recursive: true }); throw error; }
  finally { await rm(stage, { force: true, recursive: true }); }
}
async function verifyStage(tree: string, migrationFiles: MigrationFile[]): Promise<void> {
  const config = await import("../core/config/config.js"); await config.readConfig(join(tree, "config.yaml"));
  const manifest = await import("../utils/managed-files.js"); const data = await manifest.readManifest(join(tree, ".template-hashes.json"));
  const configHash = sha256(await readFile(join(tree, "config.yaml"), "utf8"));
  if (data.entries.length !== 1 || data.entries[0]?.generatedHash !== sha256(workflowTemplate) || configHash.length !== 64) throw new Error("Migration staging verification failed.");
  for (const file of migrationFiles) if (hashBytes(await readFile(join(tree, ...file.destination.split("/")))) !== file.hash) throw new Error(`Migration staging verification failed for ${file.destination}.`);
}
async function inventoryLegacyFiles(root: string, legacy: string[], conflicts: string[]): Promise<MigrationFile[]> {
  const byDestination = new Map<string, string>();
  const files: MigrationFile[] = [];
  for (const marker of legacy.filter((value) => value === ".trellis" || value === ".trellis-pro")) {
    const sourceRoot = await resolveSafeProjectPath(root, marker);
    for (const namespace of ["spec", "tasks", "workspace"]) {
      for (const file of await walkFiles(join(sourceRoot, namespace), namespace)) {
        const existingHash = byDestination.get(file.destination);
        if (existingHash !== undefined && existingHash !== file.hash) {
          conflicts.push(`.harnix/${file.destination}`);
          continue;
        }
        byDestination.set(file.destination, file.hash);
        files.push({ ...file, sourceRelative: `${marker}/${file.destination}` });
      }
    }
  }
  return files.sort((left, right) => compareCodeUnits(left.destination, right.destination) || compareCodeUnits(left.sourceRelative, right.sourceRelative));
}
async function walkFiles(directory: string, relativeDirectory: string): Promise<InventoryFile[]> {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error: unknown) { if (isMissing(error)) return []; throw error; }
  const files: InventoryFile[] = [];
  for (const entry of entries.sort((left, right) => compareCodeUnits(left.name, right.name))) {
    if (entry.isSymbolicLink()) throw new Error(`Legacy migration refuses symbolic link ${relativeDirectory}/${entry.name}.`);
    const source = join(directory, entry.name), destination = `${relativeDirectory}/${entry.name}`.replaceAll("\\", "/");
    if (entry.isDirectory()) files.push(...await walkFiles(source, destination));
    else if (entry.isFile()) files.push({ source, destination, hash: hashBytes(await readFile(source)) });
  }
  return files;
}
async function cleanupLegacy(root: string, legacy: string[], migrationFiles: MigrationFile[]): Promise<string[]> {
  const removed: string[] = [];
  for (const name of legacy.filter((value) => value === ".trellis" || value === ".trellis-pro")) {
    const verifiedFiles = migrationFiles.filter((file) => file.sourceRelative.startsWith(`${name}/`));
    if (!await canSafelyCleanupLegacyRoot(root, name, verifiedFiles)) continue;
    await rm(await resolveSafeProjectPath(root, name), { force: true, recursive: true });
    removed.push(name);
  }
  return removed;
}
async function canSafelyCleanupLegacyRoot(root: string, marker: string, migrationFiles: MigrationFile[]): Promise<boolean> {
  const expected = new Map(migrationFiles.map((file) => [file.sourceRelative.slice(marker.length + 1), file.hash]));
  const expectedDirectories = directoriesFor([...expected.keys()]);
  try {
    const sourceRoot = await resolveSafeProjectPath(root, marker);
    const remaining = new Map(expected);
    const verified = await verifyLegacyTree(sourceRoot, "", remaining, expectedDirectories);
    return verified && remaining.size === 0;
  } catch {
    return false;
  }
}
async function verifyLegacyTree(directory: string, relativeDirectory: string, remaining: Map<string, string>, expectedDirectories: Set<string>): Promise<boolean> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) return false;
    const source = join(directory, entry.name);
    const relativePath = relativeDirectory.length === 0 ? entry.name : `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!expectedDirectories.has(relativePath) || !await verifyLegacyTree(source, relativePath, remaining, expectedDirectories)) return false;
      continue;
    }
    if (!entry.isFile()) return false;
    const expectedHash = remaining.get(relativePath);
    const metadata = await lstat(source);
    if (expectedHash === undefined || !metadata.isFile() || metadata.isSymbolicLink() || hashBytes(await readFile(source)) !== expectedHash) return false;
    remaining.delete(relativePath);
  }
  return true;
}
function directoriesFor(paths: string[]): Set<string> {
  const directories = new Set<string>();
  for (const path of paths) {
    const segments = path.split("/");
    segments.pop();
    while (segments.length > 0) {
      directories.add(segments.join("/"));
      segments.pop();
    }
  }
  return directories;
}
function hashBytes(content: Uint8Array): string { return createHash("sha256").update(content).digest("hex"); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
