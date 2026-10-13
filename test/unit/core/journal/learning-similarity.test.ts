import { describe, expect, it } from "vitest";

import {
  MAX_SIMILAR,
  SIMILARITY_THRESHOLD,
  findFoldedMatch,
  foldObservation,
  jaccard,
  observationTokens,
  similarLearning,
} from "src/core/journal/learning-similarity.js";
import type { LearningState } from "src/core/journal/learning-store.js";
import { buildLearningEntry } from "test/support/learning-fixtures.js";

function state(id: string, statement: string, status: "draft" | "candidate" | "rejected" = "draft"): LearningState {
  const entry = buildLearningEntry({ id, statement, status });
  return { entry, candidate: entry.learning! };
}

describe("foldObservation", () => {
  it("makes accents, case, spacing and edge punctuation irrelevant", () => {
    const accented = foldObservation("  Luôn chạy test:gates trước KHI vào verifying. ");

    expect(accented).toBe("luon chay test:gates truoc khi vao verifying");
    expect(foldObservation("Đường dẫn")).toBe("duong dan");
    expect(foldObservation("luon  chay test:gates truoc khi vao verifying")).toBe(accented);
  });
});

describe("observationTokens and jaccard", () => {
  it("tokenises folded text into a set of words of two or more characters", () => {
    expect([...observationTokens("Chạy a test, test 42!")].sort()).toEqual(["42", "chay", "test"]);
  });

  it("is the intersection over the union and zero for empty sets", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["b", "c"]))).toBeCloseTo(1 / 3);
    expect(jaccard(new Set(["a"]), new Set(["a"]))).toBe(1);
    expect(jaccard(new Set(), new Set())).toBe(0);
  });
});

describe("findFoldedMatch", () => {
  const states = new Map([
    ["obs-a", state("obs-a", "Luôn chạy test:gates trước khi vào verifying")],
    ["obs-b", state("obs-b", "Khoá ghi tệp learned.md để tránh mất khối")],
  ]);

  it("finds the candidate whose statement differs only by accents, case or punctuation", () => {
    expect(findFoldedMatch(states, "LUON CHAY test:gates truoc khi vao verifying.")?.candidate.id).toBe("obs-a");
  });

  it("does not match a different statement", () => {
    expect(findFoldedMatch(states, "Luôn chạy test:gates sau khi vào verifying")).toBeUndefined();
  });

  it("prefers the newest entry when several share a folded key", () => {
    const older = state("obs-old", "Luôn chạy test:gates trước khi vào verifying");
    const newer = {
      ...state("obs-new", "Luon chay test:gates truoc khi vao verifying"),
      entry: buildLearningEntry({ id: "obs-new" }, { recordedAt: "2099-01-01T00:00:00.000+07:00" }),
    };
    const both = new Map([
      ["obs-old", older],
      [
        "obs-new",
        { ...newer, candidate: { ...newer.candidate, statement: "Luon chay test:gates truoc khi vao verifying" } },
      ],
    ]);

    expect(findFoldedMatch(both, "Luôn chạy test:gates trước khi vào verifying")?.candidate.id).toBe("obs-new");
  });
});

describe("similarLearning", () => {
  const FIXTURE: [string, string][] = [
    ["obs-1", "Luôn chạy test:gates trước khi vào verifying để bắt lỗi hợp đồng sớm"],
    ["obs-2", "Phải chạy test:gates trước khi chuyển verifying để bắt lỗi hợp đồng sớm hơn"],
    ["obs-3", "Ghi learned.md là đọc sửa ghi không có khoá nên hai lệnh đồng thời có thể mất khối"],
    ["obs-4", "Hai lệnh promote đồng thời có thể mất một khối vì learned.md không có khoá"],
    ["obs-5", "Đường dẫn tuyệt đối không được xuất hiện trong output chẩn đoán"],
  ];
  const all = new Map(FIXTURE.map(([id, text]) => [id, state(id, text)]));

  it("pairs near-duplicates and nothing else (precision and recall on the fixture)", () => {
    const expected = new Set(["obs-1|obs-2", "obs-3|obs-4"]);
    const found = new Set<string>();
    for (const [id] of FIXTURE)
      for (const match of similarLearning(all, id)) found.add([id, match.id].sort().join("|"));

    expect(found).toEqual(expected);
  });

  it("returns ids with a score at or above the threshold, best first, never the entry itself", () => {
    const matches = similarLearning(all, "obs-1");

    expect(matches.map((match) => match.id)).toEqual(["obs-2"]);
    expect(matches[0]!.score).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD);
    expect(Number.isInteger(matches[0]!.score * 100)).toBe(true);
  });

  it("ignores rejected entries and caps the list", () => {
    const crowd = new Map(all);
    crowd.set("obs-rej", state("obs-rej", FIXTURE[0]![1], "rejected"));
    for (let index = 0; index < 8; index += 1)
      crowd.set(`obs-c${index}`, state(`obs-c${index}`, `${FIXTURE[0]![1]} variant ${index}`));

    const matches = similarLearning(crowd, "obs-1");

    expect(matches.map((match) => match.id)).not.toContain("obs-rej");
    expect(matches).toHaveLength(MAX_SIMILAR);
  });

  it("returns nothing for an unknown id", () => {
    expect(similarLearning(all, "obs-missing")).toEqual([]);
  });
});
