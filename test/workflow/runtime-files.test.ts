import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const lines = (path: string) => read(path).split(/\r?\n/u);

describe("runtime files of a Harnix checkout", () => {
  it("ignores the per-person pointer, the scratch folder and the cache in git", () => {
    const ignored = lines(".gitignore");

    for (const entry of [".harnix/tasks/.active", ".harnix/tmp/", ".harnix/cache/"]) expect(ignored).toContain(entry);
  });

  it("keeps scratch scripts under .harnix/ out of ESLint and Prettier", () => {
    expect(read("eslint.config.mjs")).toContain('".harnix/**"');
    expect(lines(".prettierignore")).toContain(".harnix");
  });
});
