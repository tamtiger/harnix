import { readFile } from "node:fs/promises";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { sha256 } from "../../utils/hashing.js";
import { workflowTemplate } from "./workflow.js";
import { packageVersion } from "../../version.js";
import { resolveSafeHarnixPath } from "../../utils/paths.js";

interface WorkflowManifest { generator: "harnix"; schemaVersion: 1; entries: Array<{ path: string; sourceId: string; scope: string; generatedHash: string; generatorVersion: string }>; }
export async function ensureManagedWorkflow(root: string): Promise<void> {
  const workflowPath = await resolveSafeHarnixPath(root, "workflow.md"), manifestPath = await resolveSafeHarnixPath(root, ".template-hashes.json");
  const [workflow, manifestText] = await Promise.all([optional(workflowPath), optional(manifestPath)]);
  const manifest: WorkflowManifest = manifestText.length === 0 ? { generator: "harnix", schemaVersion: 1, entries: [] } : JSON.parse(manifestText) as WorkflowManifest;
  const previous = manifest.entries.find((entry) => entry.path === ".harnix/workflow.md");
  if (workflow.length > 0 && (!previous || sha256(workflow) !== previous.generatedHash)) return;
  await atomicWriteFile(workflowPath, workflowTemplate);
  const entry = { path: ".harnix/workflow.md", sourceId: "harnix-workflow", scope: "project", generatedHash: sha256(workflowTemplate), generatorVersion: packageVersion };
  manifest.entries = [...manifest.entries.filter((item) => item.path !== entry.path), entry].sort((left, right) => left.path.localeCompare(right.path));
  await atomicWriteFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
async function optional(path: string): Promise<string> { try { return await readFile(path, "utf8"); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return ""; throw error; } }
