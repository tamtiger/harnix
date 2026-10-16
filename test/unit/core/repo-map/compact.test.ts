import { describe, expect, it } from "vitest";

import { formatQueryResults, parseRepoMapFormat } from "src/core/repo-map/compact.js";
import type { RepoMapQueryResult } from "src/core/repo-map/types.js";

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
