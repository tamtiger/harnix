import { describe, expect, it } from "vitest";

import { buildRepoMapGraph, defaultRepoMapGraphLimits } from "src/core/repo-map/graph.js";
import { createRepoMapImpact } from "src/core/repo-map/impact.js";
import { searchRepoMap } from "src/core/repo-map/search.js";
import { refreshRepoMap } from "src/core/repo-map/service.js";
import { findAffectedTests } from "src/core/repo-map/tests.js";
import { createRepoMap } from "src/core/repo-map/store.js";
import type { RepoMapV1 } from "src/core/repo-map/types.js";
import {
  abpFiles,
  codeIgniterFiles,
  fixtureRecord,
  typeScriptFiles,
  writeFixtureFiles,
} from "test/support/repo-map-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-graph-references-");

function stripReferences(map: RepoMapV1): RepoMapV1 {
  return createRepoMap(
    map.records.map((record) => {
      const copy = { ...record };
      delete copy.references;
      return copy;
    }),
  );
}

describe("graph edges from references", () => {
  it("links a file to the files that declare the names it references", () => {
    const graph = buildRepoMapGraph([
      fixtureRecord("Service.cs", { references: ["Entity"] }),
      fixtureRecord("Entity.cs", { identifiers: ["Entity"] }),
    ]);

    expect(graph.adjacency.get("Service.cs")).toEqual(["Entity.cs"]);
    expect(graph.reverseAdjacency.get("Entity.cs")).toEqual(["Service.cs"]);
  });

  it("never links a file to itself", () => {
    const graph = buildRepoMapGraph([fixtureRecord("A.cs", { identifiers: ["A"], references: ["A"] })]);

    expect(graph.adjacency.get("A.cs")).toEqual([]);
  });

  it("adds at most 8 reference edges per file, preferring names with fewer declaring files", () => {
    const names = Array.from({ length: 12 }, (_, i) => `N${String(i).padStart(2, "0")}`);
    const declaring = names.map((name) => fixtureRecord(`d/${name}.cs`, { identifiers: [name] }));
    const shared = fixtureRecord("d/Shared.cs", { identifiers: ["Wide"] });
    const twin = fixtureRecord("d/Twin.cs", { identifiers: ["Wide"] });
    const user = fixtureRecord("user.cs", { references: ["Wide", ...names].sort() });

    const graph = buildRepoMapGraph([user, shared, twin, ...declaring]);
    const targets = graph.adjacency.get("user.cs") ?? [];

    expect(targets).toHaveLength(8);
    expect(targets).not.toContain("d/Shared.cs");
    expect(targets).not.toContain("d/Twin.cs");
  });

  it("stops adding reference edges at the total reference cap", () => {
    const declaring = ["A", "B", "C"].map((name) => fixtureRecord(`d/${name}.cs`, { identifiers: [name] }));
    const users = ["u1", "u2", "u3"].map((name) => fixtureRecord(`${name}.cs`, { references: ["A", "B", "C"] }));

    const graph = buildRepoMapGraph([...declaring, ...users], { ...defaultRepoMapGraphLimits, maxReferenceEdges: 4 });

    expect(graph.edgeCount).toBe(4);
  });

  it("keeps import edges ahead of reference edges when the edge budget runs out", () => {
    const records = [
      fixtureRecord("a.ts", { importTargets: ["./b"], references: ["Thing"] }),
      fixtureRecord("b.ts"),
      fixtureRecord("thing.ts", { identifiers: ["Thing"] }),
    ];

    const graph = buildRepoMapGraph(records, { ...defaultRepoMapGraphLimits, maxEdges: 1 });

    expect(graph.adjacency.get("a.ts")).toEqual(["b.ts"]);
  });
});

describe("impact with reference edges", () => {
  it("lists dependent .cs files before the dependents added through the enclosing project", () => {
    const map = createRepoMap([
      fixtureRecord("src/Domain/Domain.csproj"),
      fixtureRecord("src/Domain/Transaction.cs", { identifiers: ["Transaction"] }),
      fixtureRecord("src/App/App.csproj", { importTargets: ["../Domain/Domain.csproj"] }),
      fixtureRecord("src/App/Service.cs", { references: ["Transaction"] }),
    ]);

    const result = createRepoMapImpact(map, { depth: 2, limit: 20, target: "src/Domain/Transaction.cs" });

    expect(result.dependents.map((item) => item.path)).toEqual(["src/App/Service.cs", "src/App/App.csproj"]);
  });

  it("returns the real .cs dependents of an ABP entity from a refreshed fixture", async () => {
    const root = await temporaryRepository();
    await writeFixtureFiles(root, abpFiles);
    const { map } = await refreshRepoMap({ root });

    const result = createRepoMapImpact(map, {
      depth: 2,
      limit: 20,
      target: "frt-core/src/Core.Domain/Transactions/Transaction.cs",
    });

    expect(result.dependents[0]).toEqual({
      distance: 1,
      path: "frt-core/src/Core.Application/PaymentRequestAppService.cs",
    });
  });

  it("links a CodeIgniter controller to the model it loads and uses", async () => {
    const root = await temporaryRepository();
    await writeFixtureFiles(root, codeIgniterFiles);
    const { map } = await refreshRepoMap({ root });

    const result = createRepoMapImpact(map, {
      depth: 1,
      limit: 20,
      target: "application/models/M17/M17C78Model.php",
    });

    expect(result.dependents.map((item) => item.path)).toEqual(["application/controllers/M17/M17C55Controller.php"]);
  });

  it("keeps TypeScript query and affected-test results unchanged by reference edges", async () => {
    const root = await temporaryRepository();
    const testFile = 'import { fetchProviders } from "./api";\nfetchProviders();\n';
    await writeFixtureFiles(root, { ...typeScriptFiles, "src/modules/api.test.ts": testFile });
    const { map } = await refreshRepoMap({ root });
    const withoutReferences = stripReferences(map);
    const options = { limit: 10, target: "src/modules/api.ts" };

    expect(searchRepoMap(map, "providers", 10)).toEqual(searchRepoMap(withoutReferences, "providers", 10));
    expect(findAffectedTests(map, options)).toEqual(findAffectedTests(withoutReferences, options));
  });

  it("keeps the TypeScript import-only result unchanged by reference edges", async () => {
    const root = await temporaryRepository();
    await writeFixtureFiles(root, typeScriptFiles);
    const { map } = await refreshRepoMap({ root });
    const withoutReferences = stripReferences(map);
    const options = { depth: 2, limit: 20, target: "src/modules/api.ts" };

    expect(createRepoMapImpact(map, options)).toEqual(createRepoMapImpact(withoutReferences, options));
  });
});
