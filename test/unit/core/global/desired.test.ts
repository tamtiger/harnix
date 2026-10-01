import { describe, expect, it } from "vitest";

import { prepareDesired } from "src/core/global/desired.js";
import { sha256 } from "src/utils/hashing.js";

describe("desired global entries", () => {
  it("turns desired files into hashed entries sorted by path", () => {
    const prepared = prepareDesired(
      [
        { path: "b.md", sourceId: "s-b", kind: "file", content: "B" },
        { path: "a.md", sourceId: "s-a", kind: "file", content: "A" },
      ],
      "kiro",
      "2.0.0",
    );

    expect(prepared.map((item) => item.entry.path)).toEqual(["a.md", "b.md"]);
    expect(prepared[0]?.entry.generatedHash).toBe(sha256("A"));
    expect(prepared[0]?.entry.generatorVersion).toBe("2.0.0");
  });

  it("rejects a managed block whose content contains its own marker", () => {
    const selector = { type: "markers" as const, begin: "<!-- begin -->", end: "<!-- end -->" };

    expect(() =>
      prepareDesired(
        [{ path: "AGENTS.md", sourceId: "s", kind: "managed-block", selector, content: "x <!-- end --> y" }],
        "codex",
        "2.0.0",
      ),
    ).toThrow("boundary markers");
  });

  it("requires a path and a source id", () => {
    expect(() => prepareDesired([{ path: "", sourceId: "s", kind: "file", content: "x" }], "kiro", "2.0.0")).toThrow(
      "path and sourceId",
    );
  });
});
