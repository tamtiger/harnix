import { describe, expect, it } from "vitest";
import { entryToSearchText, rankEntriesBM25, tokenize } from "src/core/journal/bm25.js";
import type { JournalEntry } from "src/core/journal/journal.js";

function makeEntry(
  id: string,
  summary: string,
  recordedAt: string = "2026-10-16T12:00:00.000Z",
  options: { taskId?: string; statement?: string } = {},
): JournalEntry {
  return {
    generator: "harnix",
    schemaVersion: 1,
    id,
    recordedAt,
    developer: "tam",
    kind: options.statement ? "learning" : "checkpoint",
    summary,
    evidenceIds: [],
    ...(options.taskId ? { taskId: options.taskId } : {}),
    ...(options.statement
      ? {
          learning: {
            id: `learn-${id}`,
            statement: options.statement,
            sourceTaskIds: [],
            evidenceIds: [],
            occurrences: 1,
            confidence: 0.5,
            status: "draft",
          },
        }
      : {}),
  };
}

describe("tokenize", () => {
  it("normalizes NFC and lowercases Unicode words", () => {
    const tokens = tokenize("Khắc Phục LỖI: Tiếng Việt 2026! Cực kỳ nhanh.");
    expect(tokens).toEqual(["khắc", "phục", "lỗi", "tiếng", "việt", "2026", "cực", "kỳ", "nhanh"]);
  });

  it("returns empty array for empty string or punctuation only", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   \n\t  ")).toEqual([]);
    expect(tokenize("--- ... ***")).toEqual([]);
  });

  it("splits kebab-case and snake_case tokens", () => {
    expect(tokenize("bm25-smart-memory_autodraft")).toEqual(["bm25", "smart", "memory", "autodraft"]);
  });
});

describe("entryToSearchText", () => {
  it("combines summary, taskId and learning statement", () => {
    const entry = makeEntry("e1", "Summary note", "2026-10-16T12:00:00.000Z", {
      taskId: "task-123",
      statement: "Learning statement here",
    });
    const text = entryToSearchText(entry);
    expect(text).toContain("Summary note");
    expect(text).toContain("task-123");
    expect(text).toContain("Learning statement here");
  });
});

describe("rankEntriesBM25", () => {
  it("returns empty array when entries list is empty", () => {
    expect(rankEntriesBM25([], "fix bug")).toEqual([]);
  });

  it("returns entries sorted by recency when query has no tokens", () => {
    const e1 = makeEntry("e1", "First", "2026-10-16T10:00:00.000Z");
    const e2 = makeEntry("e2", "Second", "2026-10-16T12:00:00.000Z");
    const ranked = rankEntriesBM25([e1, e2], "   ---  ");
    expect(ranked.map((e) => e.id)).toEqual(["e2", "e1"]);
  });

  it("ranks entries higher with higher term frequency and matching query terms", () => {
    const e1 = makeEntry("e1", "General update to documentation");
    const e2 = makeEntry("e2", "Fix bug in authentication module");
    const e3 = makeEntry("e3", "Critical bug fix: fix crash when bug occurs during login");

    const ranked = rankEntriesBM25([e1, e2, e3], "bug fix");
    // e3 has highest frequency of 'bug' and 'fix', followed by e2. e1 has no match and is excluded.
    expect(ranked.map((e) => e.id)).toEqual(["e3", "e2"]);
  });

  it("excludes entries with score 0", () => {
    const e1 = makeEntry("e1", "Database migration completed");
    const e2 = makeEntry("e2", "Fix frontend alignment");

    const ranked = rankEntriesBM25([e1, e2], "database");
    expect(ranked.map((e) => e.id)).toEqual(["e1"]);
  });

  it("searches in learning statement as well as summary", () => {
    const e1 = makeEntry("e1", "Routine maintenance", "2026-10-16T12:00:00.000Z", {
      statement: "Khi chạy benchmark cần tắt turbo boost",
    });
    const ranked = rankEntriesBM25([e1], "benchmark");
    expect(ranked.map((e) => e.id)).toEqual(["e1"]);
  });

  it("applies tie-breaker by recordedAt descending then id descending", () => {
    const e1 = makeEntry("e1", "Common keyword match", "2026-10-16T10:00:00.000Z");
    const e2 = makeEntry("e2", "Common keyword match", "2026-10-16T11:00:00.000Z");

    const ranked = rankEntriesBM25([e1, e2], "keyword");
    expect(ranked.map((e) => e.id)).toEqual(["e2", "e1"]);
  });

  it("respects limit parameter", () => {
    const e1 = makeEntry("e1", "Bug report A");
    const e2 = makeEntry("e2", "Bug report B");
    const e3 = makeEntry("e3", "Bug report C");

    const ranked = rankEntriesBM25([e1, e2, e3], "bug", 2);
    expect(ranked).toHaveLength(2);
  });
});
