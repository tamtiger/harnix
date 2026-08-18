import { describe, expect, it } from "vitest";

import { buildRepoMapGraph } from "../../../src/core/repo-map/graph.js";
import { searchRepoMap } from "../../../src/core/repo-map/search.js";
import { createRepoMap } from "../../../src/core/repo-map/store.js";
import type { RepoMapRecordV1 } from "../../../src/core/repo-map/types.js";

describe("repository map dependency graph ranking", () => {
  it("resolves only safe relative exact, extensionless, and index targets", () => {
    const records = [
      record("root.ts", ["../outside", "/absolute", "package", "https://example.test/x"]),
      record("src/a.ts", ["./b"]),
      record("src/b.ts"),
      record("src/c.ts", ["./feature"]),
      record("src/feature/index.ts"),
      record("src/ambiguous-user.ts", ["./multi"]),
      record("src/multi.ts"), record("src/multi.js"), record("src/multi.jsx"), record("src/multi.tsx"), record("src/multi.mjs"),
    ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);

    const graph = buildRepoMapGraph(records);

    expect(graph.adjacency.get("src/a.ts")).toEqual(["src/b.ts"]);
    expect(graph.reverseAdjacency.get("src/b.ts")).toEqual(["src/a.ts"]);
    expect(graph.adjacency.get("src/c.ts")).toEqual(["src/feature/index.ts"]);
    expect(graph.adjacency.get("root.ts")).toEqual([]);
    expect(graph.adjacency.get("src/ambiguous-user.ts")).toEqual([]);
    expect(graph.nodeCount).toBe(records.length);
    expect(graph.edgeCount).toBe(2);
  });

  it("expands lexical seeds to dependencies and importers with deterministic capped bonuses", () => {
    const map = createRepoMap([
      record("docs/controller-guide.md", [], ["ControllerGuide", "ControllerReference"], "documentation"),
      record("src/payment-controller.ts", ["./payment-service"], ["PaymentController"]),
      record("src/payment-handler.ts", ["./payment-controller"], ["PaymentHandler"]),
      record("src/payment-service.ts", [], ["ChargeEngine"]),
    ]);

    const v1 = searchRepoMap(map, "controller", 20, {}, { rankerVersion: 1 });
    const v2 = searchRepoMap(map, "controller", 20, {}, { rankerVersion: 2 });
    const defaultRanking = searchRepoMap(map, "controller");

    expect(v1.map(({ path }) => path)).not.toContain("src/payment-service.ts");
    expect(v2.map(({ path }) => path)).toContain("src/payment-service.ts");
    expect(v2.find(({ path }) => path === "src/payment-service.ts")).toMatchObject({ reasons: expect.arrayContaining(["dependency-centrality", "dependency-neighbor"]) });
    expect(v2.find(({ path }) => path === "src/payment-handler.ts")).toMatchObject({ reasons: expect.arrayContaining(["referenced-by"]) });
    expect(defaultRanking).toEqual(v2);
    expect(v2).toEqual([...v2].sort((left, right) => right.score - left.score || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0)));
    expect(Object.keys(v2[0]!).sort()).toEqual(["outline", "path", "reasons", "score"]);
  });

  it("keeps ranker v1 lexical behavior and applies depth-two expansion once", () => {
    const map = createRepoMap([
      record("src/alpha-entry.ts", ["./middle"], ["AlphaEntry"]),
      record("src/far.ts", [], ["FarDependency"]),
      record("src/middle.ts", ["./far"], ["MiddleNode"]),
    ]);
    const legacy = searchRepoMap(map, "alpha", 20, {}, { rankerVersion: 1 });
    const legacyAgain = searchRepoMap(map, "alpha", 20, {}, { rankerVersion: 1 });
    const graph = searchRepoMap(map, "alpha", 20, {}, { rankerVersion: 2 });

    expect(legacyAgain).toEqual(legacy);
    expect(legacy.map(({ path }) => path)).toEqual(["src/alpha-entry.ts"]);
    expect(graph.find(({ path }) => path === "src/far.ts")).toMatchObject({ reasons: expect.arrayContaining(["dependency-neighbor"]), score: expect.any(Number) });
    expect(graph.find(({ path }) => path === "src/far.ts")!.score).toBeGreaterThanOrEqual(40);
  });

  it("applies deterministic node and edge caps before ranking", () => {
    const records = [
      record("src/a.ts", ["./b", "./c"]),
      record("src/b.ts"),
      record("src/c.ts"),
    ];

    const graph = buildRepoMapGraph(records, { maxAmbiguousMatches: 4, maxEdges: 1, maxNodes: 3 });
    const truncated = buildRepoMapGraph([...records].reverse(), { maxAmbiguousMatches: 4, maxEdges: 10, maxNodes: 2 });

    expect(graph.nodeCount).toBe(3);
    expect(graph.edgeCount).toBe(1);
    expect(graph.adjacency.get("src/a.ts")).toEqual(["src/b.ts"]);
    expect(truncated.nodeCount).toBe(2);
    expect([...truncated.adjacency.keys()]).toEqual(["src/a.ts", "src/b.ts"]);
    expect(truncated.edgeCount).toBe(1);
  });
});

function record(path: string, importTargets: string[] = [], identifiers: string[] = [], kind: RepoMapRecordV1["kind"] = "source"): RepoMapRecordV1 {
  const extension = path.includes(".") ? path.slice(path.lastIndexOf(".") + 1) : "";
  return {
    byteLength: 0,
    contentHash: "a".repeat(64),
    extension,
    headings: [],
    identifiers: [...identifiers].sort(),
    importTargets: [...importTargets].sort(),
    kind,
    packagePath: "",
    path,
  };
}
