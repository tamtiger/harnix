import { appendFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { LearningCandidate } from "./learning.js";
export interface JournalEntry { generator: "harnix"; schemaVersion: 1; id: string; recordedAt: string; developer: string; taskId?: string; kind: "checkpoint" | "completion" | "learning" | "note"; summary: string; evidenceIds: string[]; learning?: LearningCandidate; }
export async function appendJournal(path: string, entry: JournalEntry): Promise<void> { await mkdir(dirname(path), { recursive: true }); await appendFile(path, JSON.stringify(entry) + "\n", "utf8"); }
export async function searchJournal(path: string, options: { query?: string; developer?: string; limit?: number } = {}): Promise<{ entries: JournalEntry[]; malformed: number }> {
  let source: string; try { source = await readFile(path, "utf8"); } catch (error: unknown) { if (isMissing(error)) return { entries: [], malformed: 0 }; throw error; }
  const entries: JournalEntry[] = []; let malformed = 0;
  for (const line of source.split(/\r?\n/u).filter(Boolean)) { try { const entry = JSON.parse(line) as JournalEntry; if (entry.generator !== "harnix" || entry.schemaVersion !== 1) throw new Error(); if ((!options.developer || entry.developer === options.developer) && (!options.query || entry.summary.toLocaleLowerCase().includes(options.query.toLocaleLowerCase()))) entries.push(entry); } catch { malformed++; } }
  return { entries: entries.reverse().slice(0, options.limit ?? Number.POSITIVE_INFINITY), malformed };
}
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
