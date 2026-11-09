import { describe, expect, it } from "vitest";

import { extractTestStem, findConventionTests } from "src/core/repo-map/test-convention.js";
import { fixtureRecord } from "test/support/repo-map-fixtures.js";

const test = (path: string) => fixtureRecord(path, { kind: "test" });

describe("extractTestStem", () => {
  it.each([
    ["math.test.ts", "math"],
    ["math.spec.ts", "math"],
    ["math_test.go", "math"],
    ["test_user.py", "user"],
    ["PaymentServiceTests.cs", "PaymentService"],
    ["FooModelTest.php", "FooModel"],
    ["plain.ts", undefined],
  ])("reads the tested name from %s", (file, expected) => {
    expect(extractTestStem(file)).toBe(expected);
  });
});

describe("findConventionTests", () => {
  it("pairs a source with a test beside it, in __tests__ or in a mirrored test directory", () => {
    const records = [
      test("src/a/b.test.ts"),
      test("src/a/__tests__/b.test.ts"),
      test("test/unit/a/b.test.ts"),
      test("test/unit/other/b.test.ts"),
    ];

    expect(findConventionTests("src/a/b.ts", records)).toEqual([
      "src/a/__tests__/b.test.ts",
      "src/a/b.test.ts",
      "test/unit/a/b.test.ts",
    ]);
  });

  it("pairs a nested monorepo source with its mirrored test", () => {
    const records = [test("frt-core/test/unit/store/save.test.ts")];

    expect(findConventionTests("frt-core/src/store/save.ts", records)).toEqual([
      "frt-core/test/unit/store/save.test.ts",
    ]);
  });

  it("pairs a C# class with its tests in a sibling X.Tests project", () => {
    const records = [
      test("frt-core/test/Core.Application.Tests/PaymentRequestAppServiceTests.cs"),
      test("frt-core/test/Core.Domain.Tests/PaymentRequestAppServiceTests.cs"),
    ];

    expect(findConventionTests("frt-core/src/Core.Application/PaymentRequestAppService.cs", records)).toEqual([
      "frt-core/test/Core.Application.Tests/PaymentRequestAppServiceTests.cs",
    ]);
  });

  it("pairs a PHP class with its PHPUnit test and ignores a view whose name merely ends in test", () => {
    const records = [test("tests/models/FooModelTest.php"), fixtureRecord("application/views/add_edit_test.php")];

    expect(findConventionTests("application/models/FooModel.php", records)).toEqual(["tests/models/FooModelTest.php"]);
  });

  it("does not pair tests of a different name", () => {
    expect(findConventionTests("src/a/b.ts", [test("src/a/c.test.ts")])).toEqual([]);
  });
});
