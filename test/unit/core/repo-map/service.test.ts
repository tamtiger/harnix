import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  impactRepoMap,
  impactRepoMapTests,
  outlineRepoMap,
  queryRepoMap,
  refreshRepoMap,
  refsRepoMap,
} from "src/core/repo-map/service.js";
import { createRepoMap, repoMapCachePath } from "src/core/repo-map/store.js";
import type { RepoMapRecordV1 } from "src/core/repo-map/types.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-");

describe("repository map service", () => {
  it("uses the validator's code-unit ordering for paths whose locale ordering differs", () => {
    const map = createRepoMap([record("src/a.ts"), record("src/B.ts")]);

    expect(map.records.map(({ path }) => path)).toEqual(["src/B.ts", "src/a.ts"]);
  });
  it("names the nearest mapped paths when --outline, --impact or --tests cannot find a path", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "pay", "src"), { recursive: true });
    await writeFile(join(root, "pay", "src", "svc.ts"), "export function run() {}\n");
    await refreshRepoMap({ root });
    const target = "src/svc.ts";

    const outline = await outlineRepoMap({ limit: 5, root, target });
    const impact = await impactRepoMap({ depth: 1, limit: 5, root, target });
    const tests = await impactRepoMapTests({ limit: 5, root, target });

    for (const result of [outline, impact, tests]) {
      expect(result.status).toBe("not-found");
      expect(result.suggestions).toEqual(["pay/src/svc.ts"]);
    }
    const found = await outlineRepoMap({ limit: 5, root, target: "pay/src/svc.ts" });
    expect(found).not.toHaveProperty("suggestions");
    const unrelated = await impactRepoMap({ depth: 1, limit: 5, root, target: "none/else.ts" });
    expect(unrelated).not.toHaveProperty("suggestions");
  });

  it("adds the matched symbols with their lines to each --query result", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    const lines = [
      "export class Billing {",
      "  charge(): number {",
      "    return 1;",
      "  }",
      "}",
      "export function chargeAll(): void {}",
      "",
    ];
    await writeFile(join(root, "src", "billing.ts"), lines.join("\n"));
    await refreshRepoMap({ root });

    const answer = await queryRepoMap({ limit: 5, query: "chargeAll", root });

    expect(answer.results[0]?.path).toBe("src/billing.ts");
    expect(answer.results[0]?.matchedSymbols).toEqual([{ kind: "function", name: "chargeAll", startLine: 6 }]);
  });

  it("uses code-unit ordering for persisted outlines", () => {
    const value = record("src/order.ts");
    value.headings = ["B", "a"];

    expect(createRepoMap([value]).records[0]?.headings).toEqual(["B", "a"]);
  });
  it("indexes a contained filename that begins with two dots", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "..source.ts"), "export const legitimateSource = true;\n");

    const refreshed = await refreshRepoMap({ root });

    expect(refreshed.map.records.map(({ path }) => path)).toContain("..source.ts");
  });
  it.each([
    ["concurrency", 0],
    ["maxBytesPerFile", -1],
    ["maxFiles", 1.5],
    ["maxTotalBytes", Number.NaN],
  ] as const)("rejects an invalid %s repo-map limit", async (name, value) => {
    const root = await temporaryRepository();
    const limits = { concurrency: 1, maxBytesPerFile: 100, maxFiles: 10, maxTotalBytes: 1_000, [name]: value };

    await expect(refreshRepoMap({ root, limits })).rejects.toThrow(/positive integer/i);
  });
  it("excludes .worktrees directory (Kilo AI git worktrees) from inventory", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, ".worktrees", "feature-branch", "src"), { recursive: true });
    await writeFile(join(root, "src", "app.ts"), "export const app = true;\n");
    await writeFile(join(root, ".worktrees", "feature-branch", "src", "app.ts"), "export const app = true;\n");
    await writeFile(join(root, ".worktrees", "feature-branch", "package.json"), "{}\n");

    const refreshed = await refreshRepoMap({ root });

    expect(refreshed.map.records.map(({ path }) => path)).toEqual(["src/app.ts"]);
    expect(refreshed.map.records.every(({ path }) => !path.startsWith(".worktrees/"))).toBe(true);
  });
  it("excludes nested .kilo worktrees directory from inventory", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, "service", ".kilo", "worktrees", "my-branch", "src"), { recursive: true });
    await writeFile(join(root, "src", "app.ts"), "export const app = true;\n");
    await writeFile(
      join(root, "service", ".kilo", "worktrees", "my-branch", "src", "app.ts"),
      "export const app = true;\n",
    );

    const refreshed = await refreshRepoMap({ root });

    expect(refreshed.map.records.map(({ path }) => path)).toContain("src/app.ts");
    expect(refreshed.map.records.every(({ path }) => !path.includes("/.kilo/"))).toBe(true);
  });
  it("builds a deterministic structural cache and returns bounded lexical results", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, "docs"), { recursive: true });
    await mkdir(join(root, ".git", "objects"), { recursive: true });
    await mkdir(join(root, ".harnix", "tasks"), { recursive: true });
    await mkdir(join(root, "node_modules", "ignored"), { recursive: true });
    await writeFile(
      join(root, "src", "payment-service.ts"),
      "export class PaymentService {\n  async charge(invoiceId: string) { return invoiceId; }\n}\n",
    );
    await writeFile(join(root, "docs", "payments.md"), "# Payment service\n\nOperational notes.\n");
    await writeFile(join(root, ".env.local"), "API_KEY=fixture-secret-value-should-not-persist\n");
    await writeFile(join(root, ".git", "objects", "fixture"), "git internals are not inventory candidates\n");
    await writeFile(join(root, ".harnix", "tasks", "fixture.json"), "{}\n");
    await writeFile(join(root, "node_modules", "ignored", "index.js"), "export const leaked = 'not indexed';\n");

    const refreshed = await refreshRepoMap({ root });

    expect(refreshed.map.records.map(({ path }) => path)).toEqual(["docs/payments.md", "src/payment-service.ts"]);
    expect(refreshed.skipped).not.toEqual(
      expect.arrayContaining([".git/objects/fixture", ".harnix/tasks/fixture.json", "node_modules/ignored/index.js"]),
    );
    const cache = await readFile(repoMapCachePath(root), "utf8");
    expect(cache).not.toContain("fixture-secret-value-should-not-persist");
    expect(cache).not.toContain("async charge(invoiceId");
    expect(cache).not.toContain(root);

    await refreshRepoMap({ root });
    await expect(readFile(repoMapCachePath(root), "utf8")).resolves.toBe(cache);

    const query = await queryRepoMap({ query: "payment service", root });
    expect(query.status).toBe("ready");
    expect(query.results.map(({ path }) => path)).toContain("src/payment-service.ts");
    expect(query.results).toHaveLength(2);

    const outline = await outlineRepoMap({ limit: 20, root, symbol: "charge", target: "src/payment-service.ts" });
    expect(outline.status).toBe("ready");
    expect(outline.symbols.map(({ name }) => name)).toEqual(["charge"]);

    const refs = await refsRepoMap({ limit: 20, root, symbol: "PaymentService" });
    expect(refs.status).toBe("ready");
    expect(refs.references).toEqual([
      {
        kind: "declaration",
        line: 1,
        path: "src/payment-service.ts",
        preview: "export class PaymentService {",
      },
    ]);
  });
  it("finds a PHP test that names the model only inside a load->model string after many other words", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "application", "models"), { recursive: true });
    await mkdir(join(root, "application", "views", "M07C01"), { recursive: true });
    await mkdir(join(root, "tests"), { recursive: true });
    await writeFile(
      join(root, "application", "models", "M17C71Model.php"),
      "<?php\nclass M17C71Model {\n  public function run() { return 1; }\n}\n",
    );
    await writeFile(join(root, "application", "views", "M07C01", "test_result.php"), "<?php echo 'M17C71Model';\n");
    const noise = Array.from({ length: 1_200 }, (_, i) => `$word${i} = ${i};`).join("\n");
    await writeFile(join(root, "tests", "test_m17_hold.php"), `<?php\n${noise}\n$this->load->model('M17C71Model');\n`);
    await writeFile(join(root, "tests", "test_m17_other.php"), "<?php\n$x = 1;\n");
    await refreshRepoMap({ root });

    const result = await impactRepoMapTests({ limit: 20, root, target: "application/models/M17C71Model.php" });

    expect(result.tests).toEqual(["tests/test_m17_hold.php"]);
  });
  it("pages the outline of a file with many functions by --offset and reports the nextOffset", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    const functions = Array.from({ length: 5 }, (_, i) => `export function fn${i}(): number {\n  return ${i};\n}\n`);
    await writeFile(join(root, "src", "many.ts"), functions.join("\n"));

    const first = await outlineRepoMap({ limit: 2, root, target: "src/many.ts" });
    const second = await outlineRepoMap({ limit: 2, offset: first.nextOffset ?? -1, root, target: "src/many.ts" });
    const last = await outlineRepoMap({ limit: 2, offset: second.nextOffset ?? -1, root, target: "src/many.ts" });

    expect(first.symbols.map(({ name }) => name)).toEqual(["fn0", "fn1"]);
    expect(first).toMatchObject({ nextOffset: 2, truncated: true });
    expect(second.symbols.map(({ name }) => name)).toEqual(["fn2", "fn3"]);
    expect(last.symbols.map(({ name }) => name)).toEqual(["fn4"]);
    expect(last.truncated).toBe(false);
    expect(last.nextOffset).toBeUndefined();
  });
  it.each(["Pay_Core:00908", "init-epic", "a b"])(
    "names the accepted characters and --query for refs symbol %s",
    async (symbol) => {
      const root = await temporaryRepository();

      await expect(refsRepoMap({ limit: 20, root, symbol })).rejects.toThrow(
        /\[A-Za-z0-9_\$\].*\nGợi ý: harnix repo-map --query <text>/su,
      );
    },
  );
  it("reports missing cache when refsRepoMap runs before refreshRepoMap", async () => {
    const root = await temporaryRepository();
    const refs = await refsRepoMap({ limit: 20, root, symbol: "PaymentService" });
    expect(refs.status).toBe("missing");
    expect(refs.references).toEqual([]);
  });
});

describe("query fallback to references", () => {
  it("finds a name that is only used, not declared, by scanning like --refs and labels the result", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "a.ts"), "export const x = USED_LITERAL_TOKEN;\n");
    await writeFile(join(root, "src", "b.ts"), "export const y = 1;\n");
    await refreshRepoMap({ root });

    const result = await queryRepoMap({ query: "USED_LITERAL_TOKEN", root });

    expect(result.status).toBe("ready");
    expect(result.fallback).toBe("references");
    expect(result.results.map((item) => item.path)).toEqual(["src/a.ts"]);
    expect(result.results[0]?.reasons).toContain("reference fallback");
  });

  it("keeps documentation, manifest and config files out of the fallback under --source-only", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "a.ts"), "export const x = USED_LITERAL_TOKEN;\n");
    await writeFile(join(root, "README.md"), "Mentions USED_LITERAL_TOKEN in prose.\n");
    await refreshRepoMap({ root });

    // The fallback scans source, test and script files only, so --source-only holds there without a filter of its own.
    const sourceOnly = await queryRepoMap({ query: "USED_LITERAL_TOKEN", root, signals: { sourceOnly: true } });

    expect(sourceOnly.fallback).toBe("references");
    expect(sourceOnly.results.map((item) => item.path)).toEqual(["src/a.ts"]);
  });

  it("does not fall back when the index already answers the query", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "a.ts"), "export function indexedName() { return 1; }\n");
    await refreshRepoMap({ root });

    const result = await queryRepoMap({ query: "indexedName", root });

    expect(result.fallback).toBeUndefined();
    expect(result.results.map((item) => item.path)).toEqual(["src/a.ts"]);
  });

  it("does not fall back for a query of several words", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "a.ts"), "export const x = USED_LITERAL_TOKEN;\n");
    await refreshRepoMap({ root });

    const result = await queryRepoMap({ query: "USED_LITERAL_TOKEN nothing", root });

    expect(result.fallback).toBeUndefined();
  });
});

function record(path: string): RepoMapRecordV1 {
  return {
    byteLength: 0,
    contentHash: "a".repeat(64),
    extension: ".ts",
    headings: [],
    identifiers: [],
    importTargets: [],
    kind: "source",
    packagePath: "",
    path,
  };
}
