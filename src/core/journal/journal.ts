import { appendFile, mkdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline";
import type { LearningCandidate } from "./learning.js";
export interface JournalEntry { generator: "harnix"; schemaVersion: 1; id: string; recordedAt: string; developer: string; taskId?: string; kind: "checkpoint" | "completion" | "learning" | "note"; summary: string; evidenceIds: string[]; learning?: LearningCandidate; }
const appendQueues = new Map<string, Promise<void>>();
export async function appendJournal(path: string, entry: JournalEntry): Promise<void> {
  const valid = validateJournalEntry(entry), previous = appendQueues.get(path) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => { await mkdir(dirname(path), { recursive: true }); await appendFile(path, JSON.stringify(valid) + "\n", "utf8"); });
  appendQueues.set(path, current);
  try { await current; } finally { if (appendQueues.get(path) === current) appendQueues.delete(path); }
}
export async function searchJournal(path: string, options: { query?: string; developer?: string; limit?: number } = {}): Promise<{ entries: JournalEntry[]; malformed: number }> {
  const entries: JournalEntry[] = []; let malformed = 0;
  const limit = options.limit ?? Number.POSITIVE_INFINITY;
  let stream;
  try { stream = createReadStream(path, { encoding: "utf8" }); }
  catch (error: unknown) { if (isMissing(error)) return { entries: [], malformed: 0 }; throw error; }
  stream.on("error", () => undefined);
  try {
    for await (const line of createInterface({ input: stream, crlfDelay: Number.POSITIVE_INFINITY })) {
      if (!line) continue;
      try {
        const entry = validateJournalEntry(JSON.parse(line) as unknown);
        if ((!options.developer || entry.developer === options.developer) && (!options.query || entry.summary.toLowerCase().includes(options.query.toLowerCase()))) { entries.push(entry); if (entries.length > limit) entries.shift(); }
      } catch { malformed++; }
    }
  } catch (error: unknown) { if (isMissing(error)) return { entries: [], malformed: 0 }; throw error; }
  return { entries: entries.reverse(), malformed };
}
export function validateJournalEntry(value: unknown): JournalEntry {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || typeof value.id !== "string" || value.id.length === 0 || typeof value.recordedAt !== "string" || !Number.isFinite(Date.parse(value.recordedAt)) || typeof value.developer !== "string" || typeof value.summary !== "string" || !["checkpoint", "completion", "learning", "note"].includes(String(value.kind)) || !Array.isArray(value.evidenceIds) || !value.evidenceIds.every((id) => typeof id === "string")) throw new Error("Invalid journal entry.");
  if (value.taskId !== undefined && typeof value.taskId !== "string") throw new Error("Invalid journal task ID.");
  return value as unknown as JournalEntry;
}
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
