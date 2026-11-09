import { describe, expect, it } from "vitest";

import { refreshRepoMap } from "src/core/repo-map/service.js";
import { createRepoMap } from "src/core/repo-map/store.js";
import { findAffectedTests } from "src/core/repo-map/tests.js";
import type { RepoMapRecordV1 } from "src/core/repo-map/types.js";
import { fixtureRecord, typeScriptFiles, writeFixtureFiles } from "test/support/repo-map-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

import { createHash } from "node:crypto";

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function makeRecord(
  path: string,
  kind: RepoMapRecordV1["kind"],
  importTargets: string[] = [],
  language?: string,
): RepoMapRecordV1 {
  const extension = path.split(".").pop() ?? "";
  return {
    byteLength: 100,
    contentHash: sha256(path),
    extension,
    headings: [],
    identifiers: [],
    importTargets: [...new Set(importTargets)].sort(),
    kind,
    packagePath: "",
    path,
    ...(language ? { language } : {}),
  };
}

describe("findAffectedTests", () => {
  it("resolves affected tests for TypeScript via naming convention and import", () => {
    const map = createRepoMap([
      makeRecord("src/utils/math.ts", "source"),
      makeRecord("src/utils/math.test.ts", "test"),
      makeRecord("src/calculator.ts", "source", ["./utils/math"]),
      makeRecord("test/unit/calculator.test.ts", "test", ["src/calculator.js"]),
      makeRecord("src/unrelated.ts", "source"),
      makeRecord("src/unrelated.test.ts", "test"),
    ]);

    // math.ts changes: should find its own test (math.test.ts) and calculator's test (transitive dependent)
    const mathTests = findAffectedTests(map, { limit: 20, target: "src/utils/math.ts" });
    expect(mathTests.status).toBe("ready");
    expect(mathTests.tests).toContain("src/utils/math.test.ts");
    expect(mathTests.tests).toContain("test/unit/calculator.test.ts");
    expect(mathTests.tests).not.toContain("src/unrelated.test.ts");

    // calculator.ts changes: should find test/unit/calculator.test.ts
    const calcTests = findAffectedTests(map, { limit: 20, target: "src/calculator.ts" });
    expect(calcTests.tests).toEqual(["test/unit/calculator.test.ts"]);
  });

  it("resolves affected tests for Python via test_*.py, *_test.py, and tests/ directory", () => {
    const map = createRepoMap([
      makeRecord("src/services/billing.py", "source", [], "python"),
      makeRecord("src/services/test_billing.py", "test", [], "python"),
      makeRecord("src/services/auth.py", "source", [], "python"),
      makeRecord("src/services/auth_test.py", "test", [], "python"),
      makeRecord("src/models/user.py", "source", [], "python"),
      makeRecord("tests/models/test_user.py", "test", ["src/models/user"], "python"),
    ]);

    const billingTests = findAffectedTests(map, { limit: 20, target: "src/services/billing.py" });
    expect(billingTests.tests).toEqual(["src/services/test_billing.py"]);

    const authTests = findAffectedTests(map, { limit: 20, target: "src/services/auth.py" });
    expect(authTests.tests).toEqual(["src/services/auth_test.py"]);

    const userTests = findAffectedTests(map, { limit: 20, target: "src/models/user.py" });
    expect(userTests.tests).toEqual(["tests/models/test_user.py"]);
  });

  it("resolves affected tests for Go via *_test.go convention and imports", () => {
    const map = createRepoMap([
      makeRecord("pkg/storage/store.go", "source", [], "go"),
      makeRecord("pkg/storage/store_test.go", "test", [], "go"),
      makeRecord("pkg/api/handler.go", "source", ["pkg/storage"], "go"),
      makeRecord("pkg/api/handler_test.go", "test", [], "go"),
    ]);

    const storeTests = findAffectedTests(map, { limit: 20, target: "pkg/storage/store.go" });
    expect(storeTests.tests).toContain("pkg/storage/store_test.go");
    expect(storeTests.tests).toContain("pkg/api/handler_test.go");

    const handlerTests = findAffectedTests(map, { limit: 20, target: "pkg/api/handler.go" });
    expect(handlerTests.tests).toEqual(["pkg/api/handler_test.go"]);
  });

  it("returns the test file itself when target is already a test", () => {
    const map = createRepoMap([makeRecord("test/unit/math.test.ts", "test")]);

    const result = findAffectedTests(map, { limit: 20, target: "test/unit/math.test.ts" });
    expect(result.tests).toEqual(["test/unit/math.test.ts"]);
  });

  it("handles missing target and enforces limits/truncation", () => {
    const map = createRepoMap([
      makeRecord("src/a.ts", "source"),
      makeRecord("src/a.test.ts", "test"),
      makeRecord("test/a.spec.ts", "test"),
    ]);

    const notFound = findAffectedTests(map, { limit: 20, target: "src/nonexistent.ts" });
    expect(notFound.status).toBe("not-found");
    expect(notFound.tests).toEqual([]);

    const limited = findAffectedTests(map, { limit: 1, target: "src/a.ts" });
    expect(limited.tests.length).toBe(1);
    expect(limited.truncated).toBe(true);
  });

  it("resolves affected tests for C# .NET via symbol reference (new Class, Mock<Interface>) when file names differ (ac-1)", () => {
    const serviceRecord: RepoMapRecordV1 = {
      ...makeRecord("frt-payment-gateway/src/Services/PaymentRequestAppService.cs", "source", [], "csharp"),
      identifiers: ["IPaymentRequestAppService", "PaymentRequestAppService"],
    };
    const ruleTestRecord: RepoMapRecordV1 = {
      ...makeRecord("frt-payment-gateway/test/PaymentAmountRuleTests.cs", "test", [], "csharp"),
      identifiers: ["PaymentAmountRuleTests", "PaymentRequestAppService"],
    };
    const propagationTestRecord: RepoMapRecordV1 = {
      ...makeRecord("frt-payment-gateway/test/FollowTypePropagationTests.cs", "test", [], "csharp"),
      identifiers: ["FollowTypePropagationTests", "IPaymentRequestAppService"],
    };
    const unrelatedTestRecord: RepoMapRecordV1 = {
      ...makeRecord("frt-payment-gateway/test/UnrelatedTests.cs", "test", [], "csharp"),
      identifiers: ["UnrelatedTests"],
    };

    const map = createRepoMap([serviceRecord, ruleTestRecord, propagationTestRecord, unrelatedTestRecord]);
    const result = findAffectedTests(map, {
      limit: 20,
      target: "frt-payment-gateway/src/Services/PaymentRequestAppService.cs",
    });

    expect(result.status).toBe("ready");
    expect(result.tests).toContain("frt-payment-gateway/test/FollowTypePropagationTests.cs");
    expect(result.tests).toContain("frt-payment-gateway/test/PaymentAmountRuleTests.cs");
    expect(result.tests).not.toContain("frt-payment-gateway/test/UnrelatedTests.cs");
  });
});

const temporaryRepository = useTemporaryRepositories("harnix-tests-ranking-");

const test = (path: string, overrides: Partial<RepoMapRecordV1> = {}) =>
  fixtureRecord(path, { kind: "test", ...overrides });

function integrationTests(count: number, identifiers: string[]): RepoMapRecordV1[] {
  return Array.from({ length: count }, (_, i) =>
    test(`test/integration/commands/case-${String(i).padStart(2, "0")}.test.ts`, { identifiers }),
  );
}

describe("affected test ranking", () => {
  it("puts the test written for the file ahead of tests that only share a symbol, whatever the path order", () => {
    const map = createRepoMap([
      fixtureRecord("src/core/store.ts", { identifiers: ["readStore", "writeStore"] }),
      test("test/unit/core/store.test.ts"),
      ...integrationTests(25, ["readStore"]),
    ]);

    const result = findAffectedTests(map, { limit: 5, target: "src/core/store.ts" });

    expect(result.tests[0]).toBe("test/unit/core/store.test.ts");
    expect(result.reasons?.["test/unit/core/store.test.ts"]).toBe("convention");
    expect(result.truncated).toBe(true);
  });

  it("orders convention, direct, symbol and transitive tests and labels each one", () => {
    const map = createRepoMap([
      fixtureRecord("src/a.ts", { identifiers: ["thing"] }),
      fixtureRecord("src/user.ts", { importTargets: ["./a"] }),
      test("test/importer.test.ts", { importTargets: ["../src/a"] }),
      test("test/unit/a.test.ts"),
      test("test/symbols.test.ts", { identifiers: ["thing"] }),
      test("test/user.test.ts"),
    ]);

    const result = findAffectedTests(map, { limit: 10, target: "src/a.ts" });

    expect(result.tests).toEqual([
      "test/unit/a.test.ts",
      "test/importer.test.ts",
      "test/symbols.test.ts",
      "test/user.test.ts",
    ]);
    expect(result.reasons).toEqual({
      "test/importer.test.ts": "direct",
      "test/symbols.test.ts": "symbol",
      "test/unit/a.test.ts": "convention",
      "test/user.test.ts": "transitive",
    });
  });

  it("keeps the test named for a widely imported file ahead of its many importers", () => {
    const importers = Array.from({ length: 30 }, (_, i) =>
      test(`src/modules/case-${String(i).padStart(2, "0")}.test.ts`, { importTargets: ["../src/core/store"] }),
    );
    const map = createRepoMap([
      fixtureRecord("src/core/store.ts"),
      test("test/unit/core/store.test.ts", { importTargets: ["../../../src/core/store"] }),
      ...importers,
    ]);

    const result = findAffectedTests(map, { limit: 3, target: "src/core/store.ts" });

    expect(result.tests[0]).toBe("test/unit/core/store.test.ts");
    expect(result.reasons?.["test/unit/core/store.test.ts"]).toBe("convention");
  });

  it("returns at most five transitive tests", () => {
    const users = Array.from({ length: 8 }, (_, i) => fixtureRecord(`src/u${i}.ts`, { importTargets: ["./a"] }));
    const tests = users.map((user, i) =>
      test(`test/u${i}.test.ts`, { importTargets: [`../${user.path.replace(/\.ts$/u, "")}`] }),
    );
    const map = createRepoMap([fixtureRecord("src/a.ts"), ...users, ...tests]);

    const result = findAffectedTests(map, { limit: 20, target: "src/a.ts" });

    expect(result.tests.length).toBe(5);
    expect(Object.values(result.reasons ?? {}).every((reason) => reason === "transitive")).toBe(true);
  });

  it("ignores a symbol shared by more than four declaring files", () => {
    const common = Array.from({ length: 5 }, (_, i) => fixtureRecord(`src/c${i}.ts`, { identifiers: ["run"] }));
    const map = createRepoMap([...common, test("test/noise.test.ts", { identifiers: ["run"] })]);

    expect(findAffectedTests(map, { limit: 20, target: "src/c0.ts" }).tests).toEqual([]);
  });

  it("pairs C# and PHP classes with their tests in monorepo layouts", () => {
    const map = createRepoMap([
      fixtureRecord("frt/src/App/PayAppService.cs"),
      test("frt/test/App.Tests/PayAppServiceTests.cs"),
      fixtureRecord("application/models/FooModel.php"),
      test("tests/models/FooModelTest.php"),
    ]);

    expect(findAffectedTests(map, { limit: 5, target: "frt/src/App/PayAppService.cs" }).tests).toEqual([
      "frt/test/App.Tests/PayAppServiceTests.cs",
    ]);
    expect(findAffectedTests(map, { limit: 5, target: "application/models/FooModel.php" }).tests).toEqual([
      "tests/models/FooModelTest.php",
    ]);
  });

  it("keeps the direct unit test in the top five of a refreshed TypeScript project", async () => {
    const root = await temporaryRepository();
    const importers = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [
        `test/integration/case-${String(i).padStart(2, "0")}.test.ts`,
        'import { fetchProviders } from "./api";\nfetchProviders();\n',
      ]),
    );
    await writeFixtureFiles(root, {
      ...typeScriptFiles,
      ...importers,
      "src/modules/api.test.ts": 'import { fetchProviders } from "./api";\nfetchProviders();\n',
    });
    const { map } = await refreshRepoMap({ root });

    const result = findAffectedTests(map, { limit: 5, target: "src/modules/api.ts" });

    expect(result.tests).toContain("src/modules/api.test.ts");
  });
});
