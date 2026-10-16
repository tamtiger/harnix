import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createRepoMapOutline, extractFileSymbols } from "src/core/repo-map/outline.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-outline-");

describe("repository map symbol outline", () => {
  it("extracts TypeScript classes, methods, interfaces, types, enums, functions and line spans", () => {
    const source = [
      "export interface BillingConfig {",
      "  readonly currency: string;",
      "}",
      "",
      "export type InvoiceId = string;",
      "",
      "export enum PaymentState {",
      "  Pending = 'pending',",
      "  Paid = 'paid',",
      "}",
      "",
      "export class BillingService {",
      "  async charge(id: InvoiceId): Promise<PaymentState> {",
      "    if (!id) {",
      "      throw new Error('missing id');",
      "    }",
      "    return PaymentState.Paid;",
      "  }",
      "",
      "  formatReceipt(id: InvoiceId): string {",
      "    return `receipt:${id}`;",
      "  }",
      "}",
      "",
      "function helper(x: number): number {",
      "  return x + 1;",
      "}",
      "",
      "export const DEFAULT_CURRENCY = 'USD';",
      "",
    ].join("\n");

    const symbols = extractFileSymbols(source, "ts");

    expect(symbols).toEqual([
      {
        exported: true,
        kind: "interface",
        name: "BillingConfig",
        signature: "export interface BillingConfig {",
        startLine: 1,
        endLine: 3,
      },
      {
        exported: true,
        kind: "type",
        name: "InvoiceId",
        signature: "export type InvoiceId = string;",
        startLine: 5,
        endLine: 5,
      },
      {
        exported: true,
        kind: "enum",
        name: "PaymentState",
        signature: "export enum PaymentState {",
        startLine: 7,
        endLine: 10,
      },
      {
        exported: true,
        kind: "class",
        name: "BillingService",
        signature: "export class BillingService {",
        startLine: 12,
        endLine: 23,
      },
      {
        container: "BillingService",
        exported: false,
        kind: "method",
        name: "charge",
        signature: "async charge(id: InvoiceId): Promise<PaymentState> {",
        startLine: 13,
        endLine: 18,
      },
      {
        container: "BillingService",
        exported: false,
        kind: "method",
        name: "formatReceipt",
        signature: "formatReceipt(id: InvoiceId): string {",
        startLine: 20,
        endLine: 22,
      },
      {
        exported: false,
        kind: "function",
        name: "helper",
        signature: "function helper(x: number): number {",
        startLine: 25,
        endLine: 27,
      },
      {
        exported: true,
        kind: "const",
        name: "DEFAULT_CURRENCY",
        signature: "export const DEFAULT_CURRENCY = 'USD';",
        startLine: 29,
        endLine: 29,
      },
    ]);
  });

  it("extracts Python classes, methods and multiline functions/docstrings using indentation spans", () => {
    const source = [
      "class OrderProcessor:",
      "    def __init__(self, tax_rate: float):",
      "        self.tax_rate = tax_rate",
      "",
      "    async def process(",
      "        self,",
      "        total: float,",
      "    ) -> float:",
      '        """',
      "unindented docstring line",
      '        """',
      "        if total <= 0:",
      "            return 0.0",
      "        return total * (1.0 + self.tax_rate)",
      "",
      "def normalize_amount(",
      "    value: float,",
      ") -> float:",
      "    return round(value, 2)",
      "",
    ].join("\n");

    expect(extractFileSymbols(source, "py")).toEqual([
      {
        exported: true,
        kind: "class",
        name: "OrderProcessor",
        signature: "class OrderProcessor:",
        startLine: 1,
        endLine: 14,
      },
      {
        container: "OrderProcessor",
        exported: false,
        kind: "method",
        name: "__init__",
        signature: "def __init__(self, tax_rate: float):",
        startLine: 2,
        endLine: 3,
      },
      {
        container: "OrderProcessor",
        exported: true,
        kind: "method",
        name: "process",
        signature: "async def process(",
        startLine: 5,
        endLine: 14,
      },
      {
        exported: true,
        kind: "function",
        name: "normalize_amount",
        signature: "def normalize_amount(",
        startLine: 16,
        endLine: 19,
      },
    ]);
  });

  it("extracts Go types/structs/methods, C#/PHP namespaces and classes, and Markdown sections", () => {
    const goSource = [
      "package storage",
      "",
      "type TokenID string",
      "",
      "type Store struct {",
      "  path string",
      "}",
      "",
      "func (s *Store) Save(id TokenID) struct{ ok bool } {",
      "  return struct{ ok bool }{ok: true}",
      "}",
      "",
      "func newStore(path string) *Store {",
      "  return &Store{path: path}",
      "}",
      "",
    ].join("\n");

    expect(extractFileSymbols(goSource, "go")).toEqual([
      { exported: true, kind: "type", name: "TokenID", signature: "type TokenID string", startLine: 3, endLine: 3 },
      { exported: true, kind: "struct", name: "Store", signature: "type Store struct {", startLine: 5, endLine: 7 },
      {
        container: "Store",
        exported: true,
        kind: "method",
        name: "Save",
        signature: "func (s *Store) Save(id TokenID) struct{ ok bool } {",
        startLine: 9,
        endLine: 11,
      },
      {
        exported: false,
        kind: "function",
        name: "newStore",
        signature: "func newStore(path string) *Store {",
        startLine: 13,
        endLine: 15,
      },
    ]);

    const csSource = [
      "namespace MyApp.Billing {",
      "  public class InvoiceService {",
      "    public bool Charge(string id) {",
      "      return id.Length > 0;",
      "    }",
      "  }",
      "}",
    ].join("\n");
    expect(extractFileSymbols(csSource, "cs")).toEqual([
      {
        exported: false,
        kind: "namespace",
        name: "MyApp.Billing",
        signature: "namespace MyApp.Billing {",
        startLine: 1,
        endLine: 7,
      },
      {
        exported: true,
        kind: "class",
        name: "InvoiceService",
        signature: "public class InvoiceService {",
        startLine: 2,
        endLine: 6,
      },
      {
        container: "InvoiceService",
        exported: true,
        kind: "method",
        name: "Charge",
        signature: "public bool Charge(string id) {",
        startLine: 3,
        endLine: 5,
      },
    ]);

    const markdown = ["# Overview", "Intro", "## Details", "More", "### Deep", "Nested", "## Summary", "End"].join(
      "\n",
    );
    expect(extractFileSymbols(markdown, "md")).toEqual([
      { exported: true, kind: "heading", name: "Overview", signature: "# Overview", startLine: 1, endLine: 8 },
      { exported: true, kind: "heading", name: "Details", signature: "## Details", startLine: 3, endLine: 6 },
      { exported: true, kind: "heading", name: "Deep", signature: "### Deep", startLine: 5, endLine: 6 },
      { exported: true, kind: "heading", name: "Summary", signature: "## Summary", startLine: 7, endLine: 8 },
    ]);
  });

  it("ignores braces inside regex literals and inline parameter or return object types", () => {
    const tsSource = [
      "const methodRe = /^(?:[^{;]*\\{|[^;]*$)/u;",
      "",
      "export async function refreshRepoMap(opts: { root: string }): Promise<{ ok: boolean }> {",
      "  const pattern = /\\{unbalanced/u;",
      "  return { ok: pattern.test(opts.root) };",
      "}",
      "",
      "export async function outlineRepoMap(",
      "  options: { readonly root: string },",
      "): Promise<{ readonly ready: boolean }> {",
      "  return { ready: Boolean(options.root) };",
      "}",
      "",
    ].join("\n");

    expect(extractFileSymbols(tsSource, "ts")).toEqual([
      {
        exported: false,
        kind: "const",
        name: "methodRe",
        signature: "const methodRe = /^(?:[^{;]*\\{|[^;]*$)/u;",
        startLine: 1,
        endLine: 1,
      },
      {
        exported: true,
        kind: "function",
        name: "refreshRepoMap",
        signature: "export async function refreshRepoMap(opts: { root: string }): Promise<{ ok: boolean }> {",
        startLine: 3,
        endLine: 6,
      },
      {
        exported: true,
        kind: "function",
        name: "outlineRepoMap",
        signature: "export async function outlineRepoMap(",
        startLine: 8,
        endLine: 12,
      },
    ]);
  });

  it("supports symbol filtering, limit truncation, secret omission and safe status reporting", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, ".git"), { recursive: true });
    await writeFile(
      join(root, "src", "service.ts"),
      [
        "export const VERSION = '1.0.0';",
        "export const leaked = 'api_key = super_secret_token_value_12345';",
        "export function alpha() {",
        "  return 1;",
        "}",
        "export function beta() {",
        "  return 2;",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(join(root, "src", "binary.ts"), "export const x = 1;\0binary\n");
    await writeFile(join(root, ".git", "hidden.ts"), "export const hidden = 1;\n");

    const filtered = await createRepoMapOutline({
      limit: 1,
      root,
      symbol: "beta",
      target: "src/service.ts",
    });
    expect(filtered).toEqual({
      generator: "harnix",
      language: "typescript",
      limit: 1,
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      symbolFilter: "beta",
      symbols: [
        {
          exported: true,
          kind: "function",
          name: "beta",
          signature: "export function beta() {",
          startLine: 6,
          endLine: 8,
        },
      ],
      target: "src/service.ts",
      truncated: false,
    });

    const truncated = await createRepoMapOutline({
      limit: 2,
      root,
      target: "src/service.ts",
    });
    expect(truncated.symbols.map((item) => item.name)).toEqual(["VERSION", "alpha"]);
    expect(truncated.truncated).toBe(true);

    const missing = await createRepoMapOutline({ limit: 20, root, target: "src/missing.ts" });
    expect(missing.status).toBe("not-found");

    const excluded = await createRepoMapOutline({ limit: 20, root, target: ".git/hidden.ts" });
    expect(excluded.status).toBe("not-found");

    const binary = await createRepoMapOutline({ limit: 20, root, target: "src/binary.ts" });
    expect(binary.status).toBe("skipped");

    await expect(createRepoMapOutline({ limit: 20, root, target: "../escape.ts" })).rejects.toThrow(
      /exact normalized repository-relative POSIX path/i,
    );
    await expect(createRepoMapOutline({ limit: 0, root, target: "src/service.ts" })).rejects.toThrow(
      /integer between 1 and 50/i,
    );
  });
});
