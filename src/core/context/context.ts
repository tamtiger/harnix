import { readFile, stat } from "node:fs/promises";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { sha256 } from "../../utils/hashing.js";

export interface ContextEntry { path: string; reason: string; priority: number; pinned: boolean; states: string[]; contentHash?: string; }
export interface ContextManifest { generator: "harnix"; schemaVersion: 1; taskId: string; maxCharacters: number; entries: ContextEntry[]; omitted: Array<{ path: string; reason: "budget" | "duplicate" | "missing" | "unsafe" }>; }
export interface ContextSignals { taskId?: string; references?: string[]; activePaths?: string[]; languages?: string[]; guides?: string[]; }

export function rankContext(entries: ContextEntry[], signals: ContextSignals = {}): ContextEntry[] {
  const refs = normalizedSet(signals.references), active = normalizedSet(signals.activePaths), langs = normalizedSet(signals.languages), guides = normalizedSet(signals.guides);
  const unique = new Map<string, ContextEntry>();
  for (const entry of entries) { const path = normalizeRepositoryPath(entry.path); if (!unique.has(path)) unique.set(path, { ...entry, path }); }
  return [...unique.values()].map((entry) => ({ ...entry, priority: entry.priority + (entry.pinned ? 1000 : 0) + (refs.has(entry.path) ? 500 : 0) + (active.has(entry.path) ? 250 : 0) + (langs.has(entry.path) ? 100 : 0) + (guides.has(entry.path) ? 25 : 0) })).sort(compareEntries);
}

export async function buildContext(
  projectRoot: string,
  entries: ContextEntry[],
  maxCharacters: number,
  signals: ContextSignals = {},
  fullContext = false,
  maxEntries = Number.POSITIVE_INFINITY,
): Promise<{ text: string; manifest: ContextManifest }> {
  const normalizedSeen = new Set<string>(), safeEntries: ContextEntry[] = [], omitted: ContextManifest["omitted"] = [];
  for (const entry of entries) {
    try {
      const path = normalizeRepositoryPath(entry.path);
      if (normalizedSeen.has(path)) omitted.push({ path, reason: "duplicate" });
      else { normalizedSeen.add(path); safeEntries.push({ ...entry, path }); }
    } catch { omitted.push({ path: entry.path, reason: "unsafe" }); }
  }
  const ranked = rankContext(safeEntries, signals), included: ContextEntry[] = [], chunks: string[] = [], contentHashes = new Set<string>();
  let size = 0;
  let inspectedEntries = 0;
  for (const entry of ranked) {
    if (inspectedEntries >= maxEntries) {
      omitted.push({ path: entry.path, reason: "budget" });
      continue;
    }
    inspectedEntries += 1;
    try {
      const path = await resolveSafeProjectPath(projectRoot, entry.path);
      const header = `\n--- ${entry.path} ---\n`;
      // A bounded caller must not read a giant file merely to discover that it
      // cannot fit. UTF-8 byte size is a conservative upper bound for the JS
      // string length used by this context budget.
      if (!fullContext && size + header.length + (await stat(path)).size > maxCharacters) {
        omitted.push({ path: entry.path, reason: "budget" });
        continue;
      }
      const content = await readFile(path, "utf8");
      const contentHash = sha256(content);
      if (contentHashes.has(contentHash)) { omitted.push({ path: entry.path, reason: "duplicate" }); continue; }
      const chunk = `${header}${content}`;
      if (!fullContext && size + chunk.length > maxCharacters) { omitted.push({ path: entry.path, reason: "budget" }); continue; }
      contentHashes.add(contentHash); included.push({ ...entry, contentHash }); chunks.push(chunk); size += chunk.length;
    } catch (error: unknown) { omitted.push({ path: entry.path, reason: isUnsafe(error) ? "unsafe" : "missing" }); }
  }
  return { text: chunks.join("").slice(0, fullContext ? undefined : maxCharacters), manifest: { generator: "harnix", schemaVersion: 1, taskId: signals.taskId ?? "", maxCharacters, entries: included, omitted } };
}
export async function saveContextManifest(taskDirectory: string, manifest: ContextManifest): Promise<void> {
  await atomicWriteFile(await resolveSafeProjectPath(taskDirectory, "context.json"), `${JSON.stringify(validateContextManifest(manifest), null, 2)}\n`);
}
export async function loadContextManifest(path: string): Promise<ContextManifest> { return validateContextManifest(JSON.parse(await readFile(path, "utf8")) as unknown); }
export function validateContextManifest(value: unknown): ContextManifest {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || typeof value.taskId !== "string" || typeof value.maxCharacters !== "number" || !Number.isInteger(value.maxCharacters) || value.maxCharacters <= 0 || !Array.isArray(value.entries) || !Array.isArray(value.omitted)) throw new Error("Invalid or unsupported context manifest.");
  const entries = value.entries as ContextEntry[];
  let previous: ContextEntry | undefined;
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.path !== "string" || normalizeRepositoryPath(entry.path) !== entry.path || typeof entry.reason !== "string" || !Number.isInteger(entry.priority) || typeof entry.pinned !== "boolean" || !Array.isArray(entry.states) || !entry.states.every((state) => typeof state === "string") || entry.contentHash !== undefined && (typeof entry.contentHash !== "string" || !/^[a-f0-9]{64}$/u.test(entry.contentHash)) || previous && compareEntries(previous, entry) > 0) throw new Error("Invalid context entry.");
    previous = entry as unknown as ContextEntry;
  }
  for (const item of value.omitted) if (!isRecord(item) || typeof item.path !== "string" || !["budget", "duplicate", "missing", "unsafe"].includes(String(item.reason))) throw new Error("Invalid omitted context entry.");
  return value as unknown as ContextManifest;
}
function compareEntries(left: ContextEntry, right: ContextEntry): number { return Number(right.pinned) - Number(left.pinned) || right.priority - left.priority || left.path.localeCompare(right.path); }
function normalizedSet(values: string[] | undefined): Set<string> { return new Set((values ?? []).map((value) => normalizeRepositoryPath(value))); }
function isUnsafe(error: unknown): boolean { return error instanceof Error && error.name === "UnsafeProjectPathError"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
