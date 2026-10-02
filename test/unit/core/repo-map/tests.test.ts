import { describe, expect, it } from "vitest";

import { createRepoMap } from "src/core/repo-map/store.js";
import { findAffectedTests } from "src/core/repo-map/tests.js";
import type { RepoMapRecordV1 } from "src/core/repo-map/types.js";

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
});
