import { mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FRESHNESS_SLACK_MS, MAX_VERIFIED_FILES, repoMapFreshness } from "src/core/repo-map/freshness.js";
import { refreshRepoMap } from "src/core/repo-map/service.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-freshness-");
const OLD = new Date("2020-01-01T00:00:00.000Z");
const FUTURE = Date.now() + 60 * 60 * 1000;

/** A cache written now, with every source file stamped long before it, so only a real edit looks recent. */
async function cachedRepository(files: Record<string, string>): Promise<string> {
  const root = await temporaryRepository();
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), content);
    await utimes(join(root, path), OLD, OLD);
  }
  return root;
}

async function freshness(root: string) {
  const { map } = await refreshRepoMap({ root });
  return { map, check: () => repoMapFreshness(root, map) };
}

describe("repoMapFreshness", () => {
  it("is fresh for an untouched tree and writes nothing", async () => {
    const root = await cachedRepository({ "src/a.ts": "export const a = 1;\n" });
    const { check } = await freshness(root);

    expect(await check()).toEqual({ state: "fresh" });
  });

  it("detects an added, a changed and a removed file", async () => {
    const root = await cachedRepository({
      "src/keep.ts": "export const keep = 1;\n",
      "src/edit.ts": "export const edit = 1;\n",
      "src/gone.ts": "export const gone = 1;\n",
    });
    const { check } = await freshness(root);
    await writeFile(join(root, "src", "add.ts"), "export class Added {}\n");
    await writeFile(join(root, "src", "edit.ts"), "export function edited() { return 2; }\n");
    await rm(join(root, "src", "gone.ts"));

    expect(await check()).toEqual({ state: "stale", added: 1, changed: 1, removed: 1 });
  });

  it("treats a touched file with identical content as fresh", async () => {
    const root = await cachedRepository({ "src/a.ts": "export const a = 1;\n" });
    const { check } = await freshness(root);
    await utimes(join(root, "src", "a.ts"), new Date(FUTURE), new Date(FUTURE));

    expect(await check()).toEqual({ state: "fresh" });
  });

  it("never reads a file whose size and old modification time are unchanged", async () => {
    const original = "export const one = 1;\n";
    const root = await cachedRepository({ "src/one.ts": original, "src/two.ts": "export const two = 2;\n" });
    const { map } = await freshness(root);
    // Same size and old mtime but NUL bytes: a read would make the file look binary (removed), so "fresh" proves it
    // was not read.
    await writeFile(join(root, "src", "one.ts"), Buffer.alloc(original.length));
    await utimes(join(root, "src", "one.ts"), OLD, OLD);
    await writeFile(join(root, "src", "two.ts"), "export const two = 22;\n");

    const result = await repoMapFreshness(root, map);

    expect(result).toEqual({ state: "stale", added: 0, changed: 1, removed: 0 });
  });

  it("re-checks a file stamped within the slack before the cache was written", async () => {
    const root = await cachedRepository({ "src/a.ts": "export const a = 1;\n" });
    const { map } = await freshness(root);
    await writeFile(join(root, "src", "a.ts"), "export const a = 2;\n");
    const stamp = new Date(Date.now() - FRESHNESS_SLACK_MS / 2);
    await utimes(join(root, "src", "a.ts"), stamp, stamp);

    expect(await repoMapFreshness(root, map)).toMatchObject({ state: "stale", changed: 1 });
  });

  it("calls a tree with more suspects than the verification cap stale without verifying each one", async () => {
    const files: Record<string, string> = { "src/seed.ts": "export const seed = 1;\n" };
    const root = await cachedRepository(files);
    const { map } = await freshness(root);
    for (let index = 0; index <= MAX_VERIFIED_FILES; index += 1) {
      await writeFile(join(root, "src", `new${index}.ts`), `export const value${index} = ${index};\n`);
    }

    const result = await repoMapFreshness(root, map);

    expect(result.state).toBe("stale");
    expect(result).toMatchObject({ added: 0, changed: MAX_VERIFIED_FILES + 1 });
  });

  it("does not count a new binary file as an addition", async () => {
    const root = await cachedRepository({ "src/a.ts": "export const a = 1;\n" });
    const { check } = await freshness(root);
    await writeFile(join(root, "src", "blob.bin"), Buffer.from([0, 1, 2, 3]));

    expect(await check()).toEqual({ state: "fresh" });
  });
});
