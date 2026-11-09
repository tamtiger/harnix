// harnix-secret-waiver: dummy credentials that exercise the secret filter, not real secrets
import { describe, expect, it } from "vitest";

import { extractIdentifiers, selectNames } from "src/core/repo-map/extract-symbols.js";

describe("selectNames", () => {
  it("keeps the first values given and then sorts them by code unit", () => {
    expect(selectNames(["zeta", "alpha", "Beta", "gamma"], 3, 20)).toEqual(["Beta", "alpha", "zeta"]);
  });

  it("drops empty, over-long, duplicate and secret-looking values before counting", () => {
    const values = ["", "x".repeat(30), "same", "same", "password=hunter2hunter2", "kept"];

    expect(selectNames(values, 5, 20)).toEqual(["kept", "same"]);
  });
});

describe("extractIdentifiers", () => {
  it("orders declarations before test references and route names", () => {
    const content = "const mock = new Widget();\nfunction later() {}\nclass First {}\n";

    expect(extractIdentifiers(content, "typescript")).toEqual(["First", "Widget", "later", "mock"]);
  });

  it("reads C# properties with generic and nullable types", () => {
    const content = [
      "public class Order {",
      "  public Dictionary<string, List<int>> Lines { get; set; }",
      "  public int? Total { get; init; }",
      "  public string[] Tags { get; }",
      "}",
    ].join("\n");

    expect(extractIdentifiers(content, "csharp")).toEqual(["Lines", "Order", "Tags", "Total"]);
  });

  it("does not read C# members for other languages", () => {
    expect(extractIdentifiers("public string Name { get; set; }", "typescript")).toEqual([]);
  });
});
