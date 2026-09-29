import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { extractRepoMapRecord } from "src/core/repo-map/extract.js";
import type { RepoMapInventoryFile } from "src/core/repo-map/types.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-extract-");

async function inventoryFile(root: string, path: string, content: string | Buffer): Promise<RepoMapInventoryFile> {
  const absolutePath = join(root, path);
  await mkdir(join(absolutePath, ".."), { recursive: true });
  await writeFile(absolutePath, content);
  return { path, absolutePath, byteLength: Buffer.byteLength(content) };
}

describe("repo-map record extraction", () => {
  it("outlines a source file with sorted identifiers, import targets, language and kind", async () => {
    const root = await temporaryRepository();
    const file = await inventoryFile(
      root,
      "packages/api/src/billing.ts",
      'import { db } from "./db.js";\nconst lib = require("lodash");\nexport class Invoice {}\nexport function bill() {}\n',
    );

    const record = await extractRepoMapRecord(file, ["", "packages/api"]);

    expect(record).toMatchObject({
      path: "packages/api/src/billing.ts",
      extension: "ts",
      language: "typescript",
      kind: "source",
      packagePath: "packages/api",
      importTargets: ["./db.js", "lodash"],
      identifiers: ["Invoice", "bill", "lib"],
    });
    expect(record?.contentHash).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("classifies tests, manifests, documentation, configuration and scripts by path and extension", async () => {
    const root = await temporaryRepository();
    const kinds: Record<string, string> = {
      "src/a.test.ts": "test",
      "package.json": "manifest",
      "README.md": "documentation",
      "settings.yaml": "config",
      "tools/run.ps1": "script",
      "data.bin2": "other",
    };
    for (const [path, expected] of Object.entries(kinds)) {
      const record = await extractRepoMapRecord(await inventoryFile(root, path, "content\n"), [""]);
      expect(record?.kind, path).toBe(expected);
    }
  });

  it("extracts markdown headings and uses the root package when no nested package matches", async () => {
    const root = await temporaryRepository();
    const record = await extractRepoMapRecord(
      await inventoryFile(root, "docs/guide.md", "# Title\ntext\n## Second\n"),
      ["", "packages/api"],
    );

    expect(record?.headings).toEqual(["Second", "Title"]);
    expect(record?.packagePath).toBe("");
  });

  it("refuses binary, replacement-heavy, unreadable and secret-named files", async () => {
    const root = await temporaryRepository();
    const binary = await inventoryFile(root, "bin.dat", Buffer.from([0x41, 0x00, 0x42]));
    const garbled = await inventoryFile(root, "garbled.txt", "�".repeat(64));
    const secretNamed = await inventoryFile(root, "config/api_key=abcdefghij.txt", "plain\n");
    const missing: RepoMapInventoryFile = { path: "gone.ts", absolutePath: join(root, "gone.ts"), byteLength: 0 };

    expect(await extractRepoMapRecord(binary, [""])).toBeUndefined();
    expect(await extractRepoMapRecord(garbled, [""])).toBeUndefined();
    expect(await extractRepoMapRecord(secretNamed, [""])).toBeUndefined();
    expect(await extractRepoMapRecord(missing, [""])).toBeUndefined();
  });

  it("drops outline entries that look like secret assignments instead of exposing them", async () => {
    const root = await temporaryRepository();
    const record = await extractRepoMapRecord(
      await inventoryFile(root, "docs/notes.md", "# Overview\n# password: hunter2hunter2\n"),
      [""],
    );

    expect(record?.headings).toEqual(["Overview"]);
  });
});
