import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { refreshRepoMap } from "../../../src/core/repo-map/service.js";
import { useTemporaryRepositories } from "../../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-incremental-");

describe("incremental repository-map refresh", () => {
  it("matches a clean rebuild after adding, changing, and deleting files", async () => {
    const incrementalRoot = await temporaryRepository();
    const cleanRoot = await temporaryRepository();

    for (const root of [incrementalRoot, cleanRoot]) {
      await mkdir(join(root, "src"), { recursive: true });
      await writeFile(join(root, "src", "keep.ts"), "export const keep = true;\n");
      await writeFile(join(root, "src", "remove.ts"), "export const remove = true;\n");
    }
    await refreshRepoMap({ root: incrementalRoot });

    await writeFile(join(incrementalRoot, "src", "keep.ts"), "export function keepUpdated() { return true; }\n");
    await writeFile(join(incrementalRoot, "src", "add.ts"), "export class AddedService {}\n");
    await rm(join(incrementalRoot, "src", "remove.ts"));
    const incremental = await refreshRepoMap({ root: incrementalRoot });

    await writeFile(join(cleanRoot, "src", "keep.ts"), "export function keepUpdated() { return true; }\n");
    await writeFile(join(cleanRoot, "src", "add.ts"), "export class AddedService {}\n");
    await rm(join(cleanRoot, "src", "remove.ts"));
    const clean = await refreshRepoMap({ root: cleanRoot });

    expect(incremental.map).toEqual(clean.map);
    expect(incremental.map.records.map((record) => record.path)).toEqual(["src/add.ts", "src/keep.ts"]);
  });
});
