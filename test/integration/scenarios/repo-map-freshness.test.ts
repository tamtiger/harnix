import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { runRepoMapCommand } from "src/commands/repo-map-internal.js";
import { ensureFreshRepoMap } from "src/core/repo-map/freshness.js";
import { refreshRepoMap } from "src/core/repo-map/service.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-freshness-cli-");
const cachePath = (root: string): string => join(root, ".harnix", "cache", "repo-map-v1.json");

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "billing.ts"), "export function bill(orderId: string) { return orderId; }\n");
  await initializeProject({ developer: "tam", root, yes: true });
  await refreshRepoMap({ root });
  return root;
}

async function addStaleFile(root: string): Promise<void> {
  await writeFile(join(root, "src", "refund.ts"), "import './billing';\nexport function refundOrder() { return 1; }\n");
}

const actions = {
  query: { query: "refundOrder" },
  refs: { refs: "refundOrder" },
  outline: { outline: "src/refund.ts" },
  tests: { tests: "src/refund.ts" },
  impact: { impact: "src/refund.ts" },
} as const;

describe("repo-map freshness on query", () => {
  it.each(Object.entries(actions))("refreshes a stale cache once before --%s answers", async (_name, options) => {
    const root = await project();
    await addStaleFile(root);

    const result = (await runRepoMapCommand(root, { ...options, format: "compact" })) as Record<string, unknown>;

    expect(result).toMatchObject({ freshness: "refreshed", added: 1, changed: 0, removed: 0 });
    expect(await readFile(cachePath(root), "utf8")).toContain("src/refund.ts");
    expect(JSON.stringify(result)).toContain("refund");
  });

  it("leaves a fresh cache untouched and adds no freshness field", async () => {
    const root = await project();
    const before = { text: await readFile(cachePath(root), "utf8"), mtime: (await stat(cachePath(root))).mtimeMs };

    const result = (await runRepoMapCommand(root, { query: "billing" })) as Record<string, unknown>;

    expect(result).not.toHaveProperty("freshness");
    expect(await readFile(cachePath(root), "utf8")).toBe(before.text);
    expect((await stat(cachePath(root))).mtimeMs).toBe(before.mtime);
  });

  it("uses the cache as it is with --cached: no check, no write", async () => {
    const root = await project();
    await addStaleFile(root);
    const before = await readFile(cachePath(root), "utf8");

    const result = (await runRepoMapCommand(root, { cached: true, refs: "refundOrder" })) as Record<string, unknown>;

    expect(result).not.toHaveProperty("freshness");
    expect(await readFile(cachePath(root), "utf8")).toBe(before);
  });

  it("rejects --cached without a cache-reading action or together with --workspace, --refresh and --events", async () => {
    const root = await project();

    for (const options of [
      { cached: true },
      { cached: true, refresh: true },
      { cached: true, events: true },
      { cached: true, query: "x", workspace: true },
    ]) {
      await expect(runRepoMapCommand(root, options)).rejects.toThrow(/--cached requires/u);
    }
  });

  it("reports stale with the refresh hint when the rebuild fails, without throwing", async () => {
    const root = await project();
    await addStaleFile(root);

    const note = await ensureFreshRepoMap(root, {
      refresh: () => Promise.reject(new Error("disk full")),
    });

    expect(note).toEqual({ freshness: "stale", hint: expect.stringContaining("--refresh") as string });
  });

  it("keeps the existing missing-cache hint instead of building one", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await expect(ensureFreshRepoMap(join(root, "nowhere"))).resolves.toBeUndefined();
  });
});
