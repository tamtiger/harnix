import { describe, expect, it } from "vitest";

import {
  compactImpact,
  compactOutline,
  compactRefs,
  compactTests,
  formatQueryResults,
  parseRepoMapFormat,
  parseRepoMapListFormat,
} from "src/core/repo-map/compact.js";
import type { RepoMapImpactResultV1 } from "src/core/repo-map/impact.js";
import type { RepoMapRefsResultV1 } from "src/core/repo-map/refs.js";
import type { RepoMapTestsResultV1 } from "src/core/repo-map/tests.js";
import type { RepoMapOutlineResultV1, RepoMapQueryResult } from "src/core/repo-map/types.js";

describe("repo-map query compact and outline formats", () => {
  const sampleResults: RepoMapQueryResult[] = [
    {
      outline: {
        extension: "ts",
        headings: [],
        identifiers: [
          "BillingService",
          "chargeInvoice",
          "InvoiceId",
          "PaymentState",
          "helperInternal",
          "calculateTax",
          "MAX_RETRIES",
          "logger",
          "config",
          "auditLog",
        ],
        importTargets: [
          "node:path",
          "node:fs/promises",
          "src/utils/order.js",
          "./types.js",
          "./errors.js",
          "src/core/config/config.js",
        ],
        kind: "source",
        language: "typescript",
        packagePath: "packages/billing",
      },
      path: "packages/billing/src/service.ts",
      reasons: ["lexical-match", "direct-dependency"],
      score: 120,
    },
    {
      outline: {
        extension: "md",
        headings: ["Billing Architecture", "Payment Flow", "Error Handling"],
        identifiers: ["PaymentHub", "GatewayClient"],
        importTargets: [],
        kind: "documentation",
        language: "markdown",
        packagePath: ".",
      },
      path: "docs/billing-architecture.md",
      reasons: ["task-term-match"],
      score: 95,
    },
  ];

  it("validates allowed format options strictly", () => {
    expect(parseRepoMapFormat(undefined)).toBe("json");
    expect(parseRepoMapFormat("json")).toBe("json");
    expect(parseRepoMapFormat("compact")).toBe("compact");
    expect(parseRepoMapFormat("outline")).toBe("outline");
    expect(() => parseRepoMapFormat("yaml")).toThrow(/format must be one of: json, compact, outline/u);
  });

  it("preserves original results shape when format is json", () => {
    const formatted = formatQueryResults(sampleResults, "json");
    expect(formatted).toEqual(sampleResults);
  });

  it("formats compact results and achieves over 65% size reduction", () => {
    const compact = formatQueryResults(sampleResults, "compact");
    expect(compact).toEqual([
      {
        path: "packages/billing/src/service.ts",
        score: 120,
        symbols: ["BillingService", "chargeInvoice", "InvoiceId", "PaymentState", "helperInternal"],
      },
      {
        path: "docs/billing-architecture.md",
        score: 95,
        symbols: ["Billing Architecture", "Payment Flow", "Error Handling"],
      },
    ]);

    const fullJsonSize = JSON.stringify(sampleResults).length;
    const compactJsonSize = JSON.stringify(compact).length;
    const reductionPercent = ((fullJsonSize - compactJsonSize) / fullJsonSize) * 100;
    expect(reductionPercent).toBeGreaterThanOrEqual(65);
  });

  it("formats outline results with kind and symbols", () => {
    const outline = formatQueryResults(sampleResults, "outline");
    expect(outline).toEqual([
      {
        kind: "source",
        path: "packages/billing/src/service.ts",
        score: 120,
        symbols: ["BillingService", "chargeInvoice", "InvoiceId", "PaymentState", "helperInternal"],
      },
      {
        kind: "documentation",
        path: "docs/billing-architecture.md",
        score: 95,
        symbols: ["Billing Architecture", "Payment Flow", "Error Handling"],
      },
    ]);
  });
});

describe("repo-map list formats", () => {
  it("accepts json and compact and refuses the query-only outline format", () => {
    expect(parseRepoMapListFormat(undefined)).toBe("json");
    expect(parseRepoMapListFormat("json")).toBe("json");
    expect(parseRepoMapListFormat("compact")).toBe("compact");
    expect(() => parseRepoMapListFormat("outline")).toThrow(/json or compact/u);
  });

  const refs: RepoMapRefsResultV1 = {
    generator: "harnix",
    limit: 20,
    references: [
      { kind: "declaration", line: 10, path: "src/a.ts", preview: "export const repoMapRelativePath = 1;" },
      { kind: "reference", line: 13, path: "src/b.ts", preview: "return join(root, repoMapRelativePath);" },
    ],
    schemaVersion: 1,
    scope: "project",
    status: "ready",
    symbol: "repoMapRelativePath",
    truncated: false,
  };

  it("writes each reference as path:line kind and drops the preview", () => {
    const compacted = compactRefs(refs);

    expect(compacted).toMatchObject({
      format: "compact",
      references: ["src/a.ts:10 declaration", "src/b.ts:13 reference"],
    });
    expect(JSON.stringify(compacted).length).toBeLessThan(JSON.stringify(refs).length);
  });

  it("writes each dependent as path@distance", () => {
    const impact: RepoMapImpactResultV1 = {
      dependencies: ["src/dep.ts"],
      dependents: [
        { distance: 1, path: "src/a.ts" },
        { distance: 2, path: "src/b.ts" },
      ],
      depth: 2,
      generator: "harnix",
      limit: 20,
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "src/t.ts",
      truncated: { dependencies: false, dependents: false },
    };

    expect(compactImpact(impact)).toMatchObject({
      dependencies: ["src/dep.ts"],
      dependents: ["src/a.ts@1", "src/b.ts@2"],
      format: "compact",
    });
  });

  it("writes each test with its reason and drops the reasons map", () => {
    const tests: RepoMapTestsResultV1 = {
      generator: "harnix",
      limit: 20,
      reasons: { "test/a.test.ts": "convention", "test/b.test.ts": "direct" },
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "src/a.ts",
      tests: ["test/a.test.ts", "test/b.test.ts"],
      truncated: false,
    };

    const compacted = compactTests(tests);

    expect(compacted).toMatchObject({
      format: "compact",
      tests: ["test/a.test.ts convention", "test/b.test.ts direct"],
    });
    expect(compacted).not.toHaveProperty("reasons");
  });

  it("writes each symbol as name kind start-end and drops the signature", () => {
    const outline: RepoMapOutlineResultV1 = {
      generator: "harnix",
      limit: 20,
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      symbols: [
        {
          endLine: 24,
          exported: true,
          kind: "function",
          name: "writeRepoMap",
          signature: "export async function writeRepoMap(...)",
          startLine: 21,
        },
      ],
      target: "src/store.ts",
      truncated: false,
    };

    expect(compactOutline(outline)).toMatchObject({ format: "compact", symbols: ["writeRepoMap function 21-24"] });
  });
});
