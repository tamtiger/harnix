import { readFile } from "node:fs/promises";
import { resolveSafeProjectPath } from "../../utils/paths.js";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { join } from "node:path";

export interface ContextEntry { path: string; reason: string; priority: number; pinned: boolean; states: string[]; contentHash?: string; }
export interface ContextManifest { generator: "harnix"; schemaVersion: 1; taskId: string; maxCharacters: number; entries: ContextEntry[]; omitted: Array<{ path: string; reason: "budget" | "duplicate" | "missing" | "unsafe" }>; }
export interface ContextSignals { references?: string[]; activePaths?: string[]; languages?: string[]; guides?: string[]; }

export function rankContext(entries: ContextEntry[], signals: ContextSignals = {}): ContextEntry[] {
  const refs = new Set(signals.references ?? []), active = new Set(signals.activePaths ?? []), langs = new Set(signals.languages ?? []), guides = new Set(signals.guides ?? []);
  return [...new Map(entries.map((entry) => [entry.path, entry])).values()].map((entry) => ({ ...entry, priority: entry.priority + (refs.has(entry.path) ? 500 : 0) + (active.has(entry.path) ? 250 : 0) + (langs.has(entry.path) ? 100 : 0) + (guides.has(entry.path) ? 25 : 0) })).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.priority - a.priority || a.path.localeCompare(b.path));
}

export async function buildContext(projectRoot: string, entries: ContextEntry[], maxCharacters: number, signals: ContextSignals = {}, fullContext = false): Promise<{ text: string; manifest: ContextManifest }> {
  const ranked = rankContext(entries, signals), included: ContextEntry[] = [], omitted: ContextManifest["omitted"] = [], chunks: string[] = [];
  let size = 0;
  for (const entry of ranked) {
    try {
      const content = await readFile(await resolveSafeProjectPath(projectRoot, entry.path), "utf8");
      const chunk = `\n--- ${entry.path} ---\n${content}`;
      if (!fullContext && size + chunk.length > maxCharacters) { omitted.push({ path: entry.path, reason: "budget" }); continue; }
      included.push(entry); chunks.push(chunk); size += chunk.length;
    } catch (error: unknown) { omitted.push({ path: entry.path, reason: isUnsafe(error) ? "unsafe" : "missing" }); }
  }
  return { text: chunks.join("").slice(0, fullContext ? undefined : maxCharacters), manifest: { generator: "harnix", schemaVersion: 1, taskId: "", maxCharacters, entries: included, omitted } };
}
export async function saveContextManifest(taskDirectory: string, manifest: ContextManifest): Promise<void> {
  await atomicWriteFile(join(taskDirectory, "context.json"), `${JSON.stringify(validateContextManifest(manifest), null, 2)}\n`);
}
export async function loadContextManifest(path: string): Promise<ContextManifest> { return validateContextManifest(JSON.parse(await readFile(path, "utf8")) as unknown); }
export function validateContextManifest(value: unknown): ContextManifest {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || typeof value.taskId !== "string" || typeof value.maxCharacters !== "number" || !Number.isInteger(value.maxCharacters) || value.maxCharacters <= 0 || !Array.isArray(value.entries) || !Array.isArray(value.omitted)) throw new Error("Invalid or unsupported context manifest.");
  const entries = value.entries as ContextEntry[];
  let previous = "";
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.path !== "string" || entry.path.includes("\\") || entry.path.startsWith("/") || entry.path <= previous || typeof entry.reason !== "string" || !Number.isInteger(entry.priority) || typeof entry.pinned !== "boolean" || !Array.isArray(entry.states)) throw new Error("Invalid context entry.");
    previous = entry.path;
  }
  return value as unknown as ContextManifest;
}
function isUnsafe(error: unknown): boolean { return error instanceof Error && error.name === "UnsafeProjectPathError"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
