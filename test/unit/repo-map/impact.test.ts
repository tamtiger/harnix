import { describe, expect, it } from "vitest";

import { createRepoMapImpact, createUnavailableRepoMapImpact } from "../../../src/core/repo-map/impact.js";
import { createRepoMap } from "../../../src/core/repo-map/store.js";
import type { RepoMapRecordV1 } from "../../../src/core/repo-map/types.js";

describe("repository map impact", () => {
  it("returns direct dependencies and reverse dependents with deterministic distances", () => {
    const map = createRepoMap([
      record("src/z.ts", ["./target"]),
      record("src/target.ts", ["./dep-b", "./dep-a", "./b"]),
      record("src/dep-b.ts"),
      record("src/dep-a.ts"),
      record("src/c.ts", ["./b"]),
      record("src/b.ts", ["./a"]),
      record("src/a.ts", ["./target"]),
    ]);

    expect(createRepoMapImpact(map, { target: "src/target.ts", depth: 2, limit: 2 })).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "src/target.ts",
      depth: 2,
      limit: 2,
      dependencies: ["src/b.ts", "src/dep-a.ts"],
      dependents: [
        { path: "src/a.ts", distance: 1 },
        { path: "src/z.ts", distance: 1 },
      ],
      truncated: { dependencies: true, dependents: true },
    });

    const deep = createRepoMapImpact(map, { target: "src/target.ts", depth: 3, limit: 20 });
    expect(deep.dependencies).toEqual(["src/b.ts", "src/dep-a.ts", "src/dep-b.ts"]);
    expect(deep.dependents).toEqual([
      { path: "src/a.ts", distance: 1 },
      { path: "src/z.ts", distance: 1 },
      { path: "src/b.ts", distance: 2 },
      { path: "src/c.ts", distance: 3 },
    ]);
    expect(deep.dependents).not.toContainEqual({ path: "src/target.ts", distance: expect.any(Number) });
    expect(deep.truncated).toEqual({ dependencies: false, dependents: false });
  });

  it("returns stable not-found, missing, and invalid projections", () => {
    const options = { target: "src/missing.ts", depth: 2, limit: 20 } as const;
    const map = createRepoMap([record("src/present.ts")]);

    expect(createRepoMapImpact(map, options)).toEqual(empty("not-found"));
    expect(createUnavailableRepoMapImpact("missing", options)).toEqual(empty("missing"));
    expect(createUnavailableRepoMapImpact("invalid", options)).toEqual(empty("invalid"));

    function empty(status: "missing" | "invalid" | "not-found") {
      return {
        generator: "harnix",
        schemaVersion: 1,
        scope: "project",
        status,
        target: options.target,
        depth: options.depth,
        limit: options.limit,
        dependencies: [],
        dependents: [],
        truncated: { dependencies: false, dependents: false },
      };
    }
  });

  it("rejects non-exact paths and out-of-range bounds", () => {
    const map = createRepoMap([record("src/target.ts")]);
    for (const target of ["./src/target.ts", "src\\target.ts", "src//target.ts", "../target.ts", "C:/target.ts", "."]) {
      expect(() => createRepoMapImpact(map, { target, depth: 2, limit: 20 }), target).toThrow(/exact normalized/iu);
    }
    for (const depth of [0, 4, 1.5]) expect(() => createRepoMapImpact(map, { target: "src/target.ts", depth, limit: 20 })).toThrow(/depth/iu);
    for (const limit of [0, 21, 1.5]) expect(() => createRepoMapImpact(map, { target: "src/target.ts", depth: 2, limit })).toThrow(/limit/iu);
  });
});

function record(path: string, importTargets: string[] = []): RepoMapRecordV1 {
  const extension = path.includes(".") ? path.slice(path.lastIndexOf(".")) : "";
  return {
    byteLength: 0,
    contentHash: "a".repeat(64),
    extension,
    headings: [],
    identifiers: [],
    importTargets: [...importTargets].sort(),
    kind: "source",
    packagePath: "",
    path,
  };
}
