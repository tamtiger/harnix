import { appendFile, mkdir, readdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import type { LearningCandidate } from "./learning.js";
import { validateLearningCandidate } from "./learning.js";
export interface JournalEntry { generator: "harnix"; schemaVersion: 1; id: string; recordedAt: string; developer: string; taskId?: string; kind: "checkpoint" | "completion" | "cancellation" | "learning" | "note"; summary: string; evidenceIds: string[]; learning?: LearningCandidate; }
const appendQueues = new Map<string, Promise<void>>();
const idempotentQueues = new Map<string, Promise<unknown>>();
export async function appendJournal(path: string, entry: JournalEntry): Promise<void> {
  const valid = validateJournalEntry(entry), previous = appendQueues.get(path) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => { await mkdir(dirname(path), { recursive: true }); await appendFile(path, JSON.stringify(valid) + "\n", "utf8"); });
  appendQueues.set(path, current);
  try { await current; } finally { if (appendQueues.get(path) === current) appendQueues.delete(path); }
}
export async function appendJournalIdempotent(journalRoot: string, path: string, entry: JournalEntry): Promise<{ entry: JournalEntry; created: boolean }> {
  const valid = validateJournalEntry(entry), previous = idempotentQueues.get(journalRoot) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => {
    const existing = await findJournalEntry(journalRoot, valid.id);
    if (existing) {
      if (journalIdentity(existing) !== journalIdentity(valid)) throw new Error(`Journal entry ${valid.id} conflicts with existing data.`);
      return { entry: existing, created: false };
    }
    await appendJournal(path, valid);
    return { entry: valid, created: true };
  });
  idempotentQueues.set(journalRoot, current);
  try { return await current; } finally { if (idempotentQueues.get(journalRoot) === current) idempotentQueues.delete(journalRoot); }
}
export async function searchJournal(path: string, options: { query?: string; developer?: string; kind?: JournalEntry["kind"]; limit?: number } = {}): Promise<{ entries: JournalEntry[]; malformed: number }> {
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
        if ((!options.developer || entry.developer === options.developer) && (!options.kind || entry.kind === options.kind) && (!options.query || entry.summary.toLowerCase().includes(options.query.toLowerCase()))) { entries.push(entry); if (entries.length > limit) entries.shift(); }
      } catch { malformed++; }
    }
  } catch (error: unknown) { if (isMissing(error)) return { entries: [], malformed: 0 }; throw error; }
  return { entries: entries.reverse(), malformed };
}
async function findJournalEntry(journalRoot: string, id: string): Promise<JournalEntry | undefined> {
  let names: string[];
  try { names = (await readdir(journalRoot)).filter((name) => name.endsWith(".jsonl")).sort(); }
  catch (error: unknown) { if (isMissing(error)) return undefined; throw error; }
  for (const name of names) {
    const result = await searchJournal(join(journalRoot, name));
    const existing = result.entries.find((entry) => entry.id === id);
    if (existing) return existing;
  }
  return undefined;
}
function journalIdentity(entry: JournalEntry): string {
  return JSON.stringify({ generator: entry.generator, schemaVersion: entry.schemaVersion, id: entry.id, developer: entry.developer, taskId: entry.taskId, kind: entry.kind, summary: entry.summary, evidenceIds: entry.evidenceIds, learning: entry.learning });
}
export function validateJournalEntry(value: unknown): JournalEntry {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || typeof value.id !== "string" || value.id.length === 0 || typeof value.recordedAt !== "string" || !Number.isFinite(Date.parse(value.recordedAt)) || typeof value.developer !== "string" || typeof value.summary !== "string" || !["checkpoint", "completion", "cancellation", "learning", "note"].includes(String(value.kind)) || !Array.isArray(value.evidenceIds) || !value.evidenceIds.every((id) => typeof id === "string")) throw new Error("Invalid journal entry.");
  if (value.taskId !== undefined && typeof value.taskId !== "string") throw new Error("Invalid journal task ID.");
  const learning = value.learning === undefined ? undefined : validateLearningCandidate(value.learning);
  if (value.kind === "learning" && learning === undefined) throw new Error("Learning journal entries require a candidate.");
  return { ...(value as unknown as JournalEntry), ...(learning === undefined ? {} : { learning }) };
}
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
