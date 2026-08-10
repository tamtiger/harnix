import { access, mkdir, readdir, readFile, rename, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { createHash } from "node:crypto";

import { createConfig, writeConfig } from "../core/config/config.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { sha256 } from "../utils/hashing.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { workflowTemplate } from "../templates/harnix/workflow.js";
import { discoverLegacy } from "./discovery.js";
import { packageVersion } from "../version.js";

export interface MigrateOptions { root: string; developer?: string | undefined; apply?: boolean | undefined; cleanupLegacy?: boolean | undefined; }
export interface MigrateResult { legacy: string[]; conflicts: string[]; staged: boolean; activated: boolean; cleaned: string[]; }
interface MigrationFile { source: string; destination: string; hash: string; }

export async function migrateLegacyProject(options: MigrateOptions): Promise<MigrateResult> {
  const legacy = await discoverLegacy(options.root); const target = join(options.root, ".harnix");
  const conflicts: string[] = []; try { await access(join(options.root, ".harnix")); conflicts.push(".harnix"); } catch { /* absent is expected */ }
  const migrationFiles = await inventoryLegacyFiles(options.root, legacy, conflicts);
  if (!options.apply || conflicts.length > 0) return { legacy, conflicts, staged: false, activated: false, cleaned: [] };
  const stage = join(dirname(options.root), `.${basename(options.root)}.harnix-stage-${process.pid}-${Date.now()}`);
  const stagedTree = join(stage, ".harnix");
  try {
    const developer = options.developer ?? "migration";
    await mkdir(join(stagedTree, "spec", "guides"), { recursive: true });
    await mkdir(join(stagedTree, "tasks"), { recursive: true });
    await mkdir(join(stagedTree, "workspace", developer, "journal"), { recursive: true });
    await writeConfig(join(stagedTree, "config.yaml"), createConfig({ developer }));
    await atomicWriteFile(join(stagedTree, ".developer"), `${developer}\n`);
    await atomicWriteFile(join(stagedTree, "workflow.md"), workflowTemplate);
    await atomicWriteFile(join(stagedTree, ".template-hashes.json"), `${JSON.stringify({ generator: "harnix", schemaVersion: 1, entries: [{ path: ".harnix/workflow.md", sourceId: "workflow", scope: "project", generatedHash: sha256(workflowTemplate), generatorVersion: packageVersion }] }, null, 2)}\n`);
    for (const file of migrationFiles) await atomicWriteFile(join(stagedTree, ...file.destination.split("/")), await readFile(file.source));
    await verifyStage(stagedTree, migrationFiles);
    await rename(stagedTree, target);
    const cleaned = options.cleanupLegacy ? await cleanupLegacy(options.root, legacy) : [];
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
  const byDestination = new Map<string, MigrationFile>();
  for (const marker of legacy.filter((value) => value === ".trellis" || value === ".trellis-pro")) {
    const sourceRoot = await resolveSafeProjectPath(root, marker);
    for (const namespace of ["spec", "tasks", "workspace"]) {
      for (const file of await walkFiles(join(sourceRoot, namespace), namespace)) {
        const existing = byDestination.get(file.destination);
        if (existing && existing.hash !== file.hash) conflicts.push(`.harnix/${file.destination}`);
        else if (!existing) byDestination.set(file.destination, file);
      }
    }
  }
  return [...byDestination.values()].sort((left, right) => left.destination.localeCompare(right.destination));
}
async function walkFiles(directory: string, relativeDirectory: string): Promise<MigrationFile[]> {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error: unknown) { if (isMissing(error)) return []; throw error; }
  const files: MigrationFile[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.isSymbolicLink()) throw new Error(`Legacy migration refuses symbolic link ${relativeDirectory}/${entry.name}.`);
    const source = join(directory, entry.name), destination = `${relativeDirectory}/${entry.name}`.replaceAll("\\", "/");
    if (entry.isDirectory()) files.push(...await walkFiles(source, destination));
    else if (entry.isFile()) files.push({ source, destination, hash: hashBytes(await readFile(source)) });
  }
  return files;
}
async function cleanupLegacy(root: string, legacy: string[]): Promise<string[]> {
  const removed: string[] = [];
  for (const name of legacy.filter((value) => value === ".trellis" || value === ".trellis-pro")) {
    await rm(await resolveSafeProjectPath(root, name), { force: true, recursive: true });
    removed.push(name);
  }
  return removed;
}
function hashBytes(content: Uint8Array): string { return createHash("sha256").update(content).digest("hex"); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
