import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { queryRepoMap, refreshRepoMap } from "../../../src/core/repo-map/service.js";
import { createRepoMap, repoMapCachePath } from "../../../src/core/repo-map/store.js";
import type { RepoMapRecordV1 } from "../../../src/core/repo-map/types.js";
import { useTemporaryRepositories } from "../../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-");

describe("repository map service", () => {
  it("uses the validator's code-unit ordering for paths whose locale ordering differs", () => {
    const map = createRepoMap([record("src/a.ts"), record("src/B.ts")]);

    expect(map.records.map(({ path }) => path)).toEqual(["src/B.ts", "src/a.ts"]);
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
  it("builds a deterministic structural cache and returns bounded lexical results", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, "docs"), { recursive: true });
    await mkdir(join(root, ".git", "objects"), { recursive: true });
    await mkdir(join(root, ".harnix", "tasks"), { recursive: true });
    await mkdir(join(root, "node_modules", "ignored"), { recursive: true });
    await writeFile(join(root, "src", "payment-service.ts"), "export class PaymentService {\n  async charge(invoiceId: string) { return invoiceId; }\n}\n");
    await writeFile(join(root, "docs", "payments.md"), "# Payment service\n\nOperational notes.\n");
    await writeFile(join(root, ".env.local"), "API_KEY=fixture-secret-value-should-not-persist\n");
    await writeFile(join(root, ".git", "objects", "fixture"), "git internals are not inventory candidates\n");
    await writeFile(join(root, ".harnix", "tasks", "fixture.json"), "{}\n");
    await writeFile(join(root, "node_modules", "ignored", "index.js"), "export const leaked = 'not indexed';\n");

    const refreshed = await refreshRepoMap({ root });

    expect(refreshed.map.records.map(({ path }) => path)).toEqual(["docs/payments.md", "src/payment-service.ts"]);
    expect(refreshed.skipped).not.toEqual(expect.arrayContaining([
      ".git/objects/fixture",
      ".harnix/tasks/fixture.json",
      "node_modules/ignored/index.js",
    ]));
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
  });
});

function record(path: string): RepoMapRecordV1 {
  return { byteLength: 0, contentHash: "a".repeat(64), extension: ".ts", headings: [], identifiers: [], importTargets: [], kind: "source", packagePath: "", path };
}
