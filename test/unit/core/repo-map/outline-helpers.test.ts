import { describe, expect, it } from "vitest";

import {
  assertOutlineOptions,
  filterSymbols,
  makeResult,
  makeSymbol,
  stripComments,
} from "src/core/repo-map/outline-helpers.js";

describe("outline helpers", () => {
  it("formats symbols and trims whitespace in signatures", () => {
    const sym = makeSymbol(["TestService", "class", true, 1, 10, "  class   TestService   {  ", "ParentNamespace"]);
    expect(sym).toEqual({
      container: "ParentNamespace",
      endLine: 10,
      exported: true,
      kind: "class",
      name: "TestService",
      signature: "class TestService {",
      startLine: 1,
    });
  });

  it("strips strings, regex literals and line comments", () => {
    expect(stripComments('const x = "hello world"; // inline comment')).toBe('const x = "";');
    expect(stripComments("const r = /\\{test\\}/u;")).toBe('const r "";');
  });

  it("filters symbols by name and container case-insensitively and sorts by startLine", () => {
    const list = [
      makeSymbol(["beta", "function", true, 15, 20, "function beta()"]),
      makeSymbol(["alpha", "function", true, 5, 10, "function alpha()"]),
      makeSymbol(["query", "method", true, 12, 14, "query()", "BillingService"]),
    ];
    expect(filterSymbols(list, "billing")).toEqual([
      makeSymbol(["query", "method", true, 12, 14, "query()", "BillingService"]),
    ]);
    expect(filterSymbols(list, undefined).map((s) => s.name)).toEqual(["alpha", "query", "beta"]);
  });

  it("builds consistent outline result objects", () => {
    const res = makeResult("ready", { limit: 20, target: "src/index.ts" }, [], false, "typescript");
    expect(res).toEqual({
      generator: "harnix",
      language: "typescript",
      limit: 20,
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      symbols: [],
      target: "src/index.ts",
      truncated: false,
    });
  });

  it("validates outline options strictly", () => {
    expect(() => assertOutlineOptions({ limit: 10, target: "src/index.ts" })).not.toThrow();
    expect(() => assertOutlineOptions({ limit: 0, target: "src/index.ts" })).toThrow(/limit must be an integer/u);
    expect(() => assertOutlineOptions({ limit: 10, target: "src\\index.ts" })).toThrow(/exact normalized/u);
    expect(() => assertOutlineOptions({ limit: 10, symbol: "", target: "src/index.ts" })).toThrow(/symbol filter/u);
  });
});
