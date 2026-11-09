import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { computeInputDigest } from "src/core/verification/input-digest.js";
import { missingInputHint } from "src/core/verification/input-hint.js";
import { buildCheck, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function projectWith(directory: string): Promise<string> {
  const root = await temporaryRepository();
  await mkdir(join(root, directory), { recursive: true });
  await writeFile(join(root, directory, "kept.txt"), "kept");
  return root;
}

describe("missingInputHint", () => {
  it("names the nearest existing parent directory and a glob to use instead", async () => {
    const root = await projectWith("src/feature");

    const hint = await missingInputHint(root, "src/feature/deleted/old-file.ts");

    expect(hint).toContain('"src/feature"');
    expect(hint).toContain('--input "src/feature/**"');
  });

  it("falls back to the repository root glob when no parent exists", async () => {
    const root = await projectWith("src");

    const hint = await missingInputHint(root, "gone/dir/file.ts");

    expect(hint).toContain("the repository root");
    expect(hint).toContain('--input "**"');
  });

  it("stops at the first glob segment", async () => {
    const root = await projectWith("src");

    expect(await missingInputHint(root, "src/**/missing.ts")).toContain('--input "src/**"');
  });
});

describe("computeInputDigest with a missing input", () => {
  const task = (inputs: string[]) => buildTaskV3({ validationPlan: [buildCheck({ id: "check", inputs })] });

  it("explains the replacement in the error and digests the parent directory glob", async () => {
    const root = await projectWith("src");

    await expect(computeInputDigest(root, task(["src/deleted.ts"]), "check")).rejects.toThrow(
      'matched no files. Nearest existing directory: "src"; use the input "src/**"',
    );
    const digest = await computeInputDigest(root, task(["src/**"]), "check");
    expect(digest.entries.map((entry) => entry.path)).toEqual(["src/kept.txt"]);
  });
});
