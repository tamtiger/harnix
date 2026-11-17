import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exactSymbolBonus, matchSymbols, queryWords, withMatchedSymbols } from "src/core/repo-map/symbol-matches.js";
import type { RepoMapQueryResult } from "src/core/repo-map/types.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const source = [
  "export class PaymentService {",
  "  collectPayment(id: string): string {",
  "    return id;",
  "  }",
  "  refund(id: string): string {",
  "    return id;",
  "  }",
  "}",
  "export function payment(): number {",
  "  return 1;",
  "}",
  "",
].join("\n");

describe("queryWords", () => {
  it("lower-cases, splits on punctuation and drops duplicates", () => {
    expect(queryWords("  Payment-Service, payment ")).toEqual(["payment-service", "payment"]);
  });
});

describe("exactSymbolBonus", () => {
  it("rewards a declared name equal to a query word of at least three characters", () => {
    expect(exactSymbolBonus({ identifiers: ["MapDataSyncES"] }, ["mapdatasynces"])).toMatchObject({ score: 200 });
    expect(exactSymbolBonus({ identifiers: ["MapDataSyncESRunner"] }, ["mapdatasynces"])).toBeUndefined();
    expect(exactSymbolBonus({ identifiers: ["ab"] }, ["ab"])).toBeUndefined();
  });
});

describe("matchSymbols", () => {
  it("lists the symbols whose name matches, closest match first, with kind, container and line", () => {
    const matched = matchSymbols(source, "ts", ["payment"]);

    expect(matched.map(({ name, startLine }) => [name, startLine])).toEqual([
      ["payment", 9],
      ["PaymentService", 1],
      ["collectPayment", 2],
    ]);
    expect(matched[0]).toMatchObject({ kind: "function" });
    expect(matched[2]).toMatchObject({ container: "PaymentService", kind: "method" });
  });

  it("matches a word inside a camel-case name and returns nothing when no name matches", () => {
    expect(matchSymbols(source, "ts", ["collect"]).map(({ name }) => name)).toEqual(["collectPayment"]);
    expect(matchSymbols(source, "ts", ["zzz"])).toEqual([]);
  });

  it("lists at most five symbols", () => {
    const many = Array.from({ length: 8 }, (_, index) => `export function pay${index}() {}`).join("\n");
    expect(matchSymbols(many, "ts", ["pay"])).toHaveLength(5);
  });
});

describe("withMatchedSymbols", () => {
  const result = (path: string, kind: "source" | "documentation" = "source"): RepoMapQueryResult => ({
    outline: { extension: "ts", headings: [], identifiers: [], importTargets: [], kind, packagePath: "" },
    path,
    reasons: [],
    score: 1,
  });

  it("attaches the matched symbols read from each source file and leaves other results as they are", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "pay.ts"), source);

    const [found, missing, doc] = await withMatchedSymbols(
      root,
      [result("src/pay.ts"), result("src/gone.ts"), result("docs/pay.md", "documentation")],
      "refund",
    );

    expect(found?.matchedSymbols).toEqual([
      { container: "PaymentService", kind: "method", name: "refund", startLine: 5 },
    ]);
    expect(missing).not.toHaveProperty("matchedSymbols");
    expect(doc).not.toHaveProperty("matchedSymbols");
  });
});
