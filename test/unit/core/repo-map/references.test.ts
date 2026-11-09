import { describe, expect, it } from "vitest";

import type { ExtractedRepoMapFile } from "src/core/repo-map/extract.js";
import { attachReferences, MAX_NAME_USERS } from "src/core/repo-map/references.js";
import { fixtureRecord } from "test/support/repo-map-fixtures.js";

function file(
  path: string,
  identifiers: string[],
  used: string[] = [],
  kind: "source" | "test" = "source",
): ExtractedRepoMapFile {
  return { record: fixtureRecord(path, { identifiers: [...identifiers].sort(), kind }), usedNames: new Set(used) };
}

function referencesOf(files: readonly ExtractedRepoMapFile[], path: string): string[] | undefined {
  return attachReferences(files).find((record) => record.path === path)?.references;
}

describe("attachReferences", () => {
  it("keeps a name used here and declared in one to four other files", () => {
    const files = [
      file("a.ts", [], ["One", "Four", "Five"]),
      file("one.ts", ["One"]),
      ...["f1", "f2", "f3", "f4"].map((name) => file(`${name}.ts`, ["Four"])),
      ...["g1", "g2", "g3", "g4", "g5"].map((name) => file(`${name}.ts`, ["Five"])),
    ];

    expect(referencesOf(files, "a.ts")).toEqual(["Four", "One"]);
  });

  it("ignores a name this file declares itself, even when another file declares it too", () => {
    const files = [file("a.ts", ["Shared"], ["Shared", "Local"]), file("b.ts", ["Shared"]), file("c.ts", ["Local"])];

    expect(referencesOf(files, "a.ts")).toEqual(["Local"]);
  });

  it("takes declarations only from source files, not from tests", () => {
    const files = [file("a.ts", [], ["Helper"]), file("helper.test.ts", ["Helper"], [], "test")];

    expect(referencesOf(files, "a.ts")).toBeUndefined();
  });

  it("drops a name used by more than the allowed number of files", () => {
    const users = (count: number): ExtractedRepoMapFile[] =>
      Array.from({ length: count }, (_, i) => file(`u${String(i).padStart(2, "0")}.ts`, [], ["Common"]));

    expect(referencesOf([file("decl.ts", ["Common"]), ...users(MAX_NAME_USERS)], "u00.ts")).toEqual(["Common"]);
    expect(referencesOf([file("decl.ts", ["Common"]), ...users(MAX_NAME_USERS + 1)], "u00.ts")).toBeUndefined();
  });

  it("keeps at most 48 names and prefers names declared in fewer files", () => {
    const rare = Array.from({ length: 50 }, (_, i) => `Rare${String(i).padStart(2, "0")}`);
    const common = Array.from({ length: 20 }, (_, i) => `Common${String(i).padStart(2, "0")}`);
    const files = [
      file("user.ts", [], [...common, ...rare]),
      file("rare.ts", rare.slice(0, 50)),
      file("c1.ts", common),
      file("c2.ts", common),
      file("c3.ts", common),
    ];

    const references = referencesOf(files, "user.ts") ?? [];

    expect(references).toHaveLength(48);
    expect(references.every((name) => name.startsWith("Rare"))).toBe(true);
    expect(references).toEqual([...references].sort());
  });

  it("returns records without a references field when nothing qualifies and never exposes the used names", () => {
    const records = attachReferences([file("a.ts", ["A"], ["Unknown"])]);

    expect(records).toHaveLength(1);
    expect(records[0]).not.toHaveProperty("references");
    expect(records[0]).not.toHaveProperty("usedNames");
  });
});
