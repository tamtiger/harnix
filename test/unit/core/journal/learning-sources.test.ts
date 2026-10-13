import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createSourcePathsLoader } from "src/core/journal/learning-sources.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-learning-sources-");

async function writeTask(harnixRoot: string, id: string, relevantPaths: string[]): Promise<void> {
  const directory = join(harnixRoot, "tasks", id);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "task.json"), JSON.stringify(buildTaskV3({ id, relevantPaths })));
}

describe("createSourcePathsLoader", () => {
  it("returns the relevant paths of every source task and ignores missing or corrupt ones", async () => {
    const harnixRoot = join(await temporaryRepository(), ".harnix");
    await writeTask(harnixRoot, "20260901-000000-one", ["src/core/a.ts"]);
    await writeTask(harnixRoot, "20260901-000100-two", ["docs/a.md"]);
    await mkdir(join(harnixRoot, "tasks", "20260901-000200-bad"), { recursive: true });
    await writeFile(join(harnixRoot, "tasks", "20260901-000200-bad", "task.json"), "{not json");
    const load = createSourcePathsLoader(harnixRoot);

    const paths = await load([
      "20260901-000000-one",
      "20260901-000100-two",
      "20260901-000200-bad",
      "20260901-000300-missing",
    ]);

    expect(paths.sort()).toEqual(["docs/a.md", "src/core/a.ts"]);
  });

  it("reads a task once per loader", async () => {
    const harnixRoot = join(await temporaryRepository(), ".harnix");
    await writeTask(harnixRoot, "20260901-000000-one", ["src/core/a.ts"]);
    const load = createSourcePathsLoader(harnixRoot);

    await load(["20260901-000000-one"]);
    await writeTask(harnixRoot, "20260901-000000-one", ["changed/b.ts"]);

    expect(await load(["20260901-000000-one"])).toEqual(["src/core/a.ts"]);
  });
});
