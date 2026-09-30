import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildGlobIgnores,
  createGuardedDirectoryFilter,
  targetedSegments,
} from "src/core/verification/transient-directories.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-transient-");

describe("transient directory rules", () => {
  it("collects lower-cased literal segments and ignores globs, negation and a leading ./", () => {
    expect([...targetedSegments("./Src/Binary/**")]).toEqual(["src", "binary"]);
    expect([...targetedSegments("!Api/bin/**")]).toEqual(["api", "bin"]);
    expect([...targetedSegments("**/obj/*.json")]).toEqual(["obj"]);
    expect([...targetedSegments("Api\\Bin\\x.dll")]).toEqual(["api", "bin", "x.dll"]);
  });

  it("builds case-insensitive ignores and drops the ones an input names on purpose", () => {
    const defaults = buildGlobIgnores(new Set());
    expect(defaults).toContain("**/.git/**");
    expect(defaults).toContain("**/.harnix/**");
    expect(defaults).toContain("**/[nN][oO][dD][eE]_[mM][oO][dD][uU][lL][eE][sS]/**");

    const targeted = buildGlobIgnores(new Set([".harnix", "testresults"]));
    expect(targeted).not.toContain("**/.harnix/**");
    expect(targeted.some((pattern) => pattern.includes("[tT][eE][sS][tT]"))).toBe(false);
  });

  it("keeps a guarded directory unless its parent holds the matching build marker", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "Api"), { recursive: true });
    await writeFile(join(root, "Api", "Api.fsproj"), "");
    await mkdir(join(root, "web"), { recursive: true });
    await writeFile(join(root, "web", "pom.xml"), "");
    const isKept = createGuardedDirectoryFilter(root);

    expect(await isKept("Api/bin/a.dll", new Set())).toBe(false);
    expect(await isKept("Api/bin/a.dll", new Set(["bin"]))).toBe(true);
    expect(await isKept("tools/bin/cli.js", new Set())).toBe(true);
    expect(await isKept("web/out/site.js", new Set())).toBe(false);
    expect(await isKept("web/bin/cli.js", new Set())).toBe(true);
    expect(await isKept("missing/dist/a.js", new Set())).toBe(true);
    expect(await isKept("src/a.ts", new Set())).toBe(true);
  });
});
