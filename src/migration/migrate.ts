import { access, mkdir, readdir, readFile, rename, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { createConfig, writeConfig } from "../core/config/config.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { sha256 } from "../utils/hashing.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { workflowTemplate } from "../templates/harnix/workflow.js";
import { discoverLegacy } from "./discovery.js";

export interface MigrateOptions { root: string; developer?: string | undefined; apply?: boolean | undefined; cleanupLegacy?: boolean | undefined; }
export interface MigrateResult { legacy: string[]; conflicts: string[]; staged: boolean; activated: boolean; cleaned: string[]; }

export async function migrateLegacyProject(options: MigrateOptions): Promise<MigrateResult> {
  const legacy = await discoverLegacy(options.root); const target = join(options.root, ".harnix");
  const conflicts: string[] = []; try { await access(join(options.root, ".harnix")); conflicts.push(".harnix"); } catch { /* absent is expected */ }
  if (!options.apply || conflicts.length > 0) return { legacy, conflicts, staged: false, activated: false, cleaned: [] };
  const stage = join(dirname(options.root), `.${basename(options.root)}.harnix-stage-${process.pid}-${Date.now()}`);
  const stagedTree = join(stage, ".harnix");
  try {
    const developer = options.developer ?? "migration";
    await mkdir(join(stagedTree, "spec", "guides"), { recursive: true });
    await mkdir(join(stagedTree, "tasks"), { recursive: true });
    await mkdir(join(stagedTree, "workspace", developer, "journal"), { recursive: true });
    await writeConfig(join(stagedTree, "config.yaml"), createConfig({ developer }));
    await atomicWriteFile(join(stagedTree, "workflow.md"), workflowTemplate);
    await atomicWriteFile(join(stagedTree, ".template-hashes.json"), `${JSON.stringify({ generator: "harnix", schemaVersion: 1, entries: [{ path: ".harnix/workflow.md", sourceId: "workflow", scope: "project", generatedHash: sha256(workflowTemplate), generatorVersion: "0.1.0" }] }, null, 2)}\n`);
    await verifyStage(stagedTree);
    await rename(stagedTree, target);
    const cleaned = options.cleanupLegacy ? await cleanupLegacy(options.root) : [];
    return { legacy, conflicts, staged: true, activated: true, cleaned };
  } catch (error) { await rm(stage, { force: true, recursive: true }); throw error; }
  finally { await rm(stage, { force: true, recursive: true }); }
}
async function verifyStage(tree: string): Promise<void> {
  const config = await import("../core/config/config.js"); await config.readConfig(join(tree, "config.yaml"));
  const manifest = await import("../utils/managed-files.js"); const data = await manifest.readManifest(join(tree, ".template-hashes.json"));
  const configHash = sha256(await readFile(join(tree, "config.yaml"), "utf8"));
  const taskCount = (await readdir(join(tree, "tasks"))).length; const specCount = (await readdir(join(tree, "spec", "guides"))).length;
  const developer = (await config.readConfig(join(tree, "config.yaml"))).developer; const journalCount = (await readdir(join(tree, "workspace", developer, "journal"))).length;
  if (data.entries.length !== 1 || data.entries[0]?.generatedHash !== sha256(workflowTemplate) || configHash.length !== 64 || taskCount !== 0 || specCount !== 0 || journalCount !== 0) throw new Error("Migration staging verification failed.");
}
async function cleanupLegacy(root: string): Promise<string[]> { const removed: string[] = []; for (const name of [".trellis", ".trellis-pro"]) { try { await rm(await resolveSafeProjectPath(root, name), { force: true, recursive: true }); removed.push(name); } catch { /* absent or unsafe legacy content remains intact */ } } return removed; }
