import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { coveredFiles, expandBraces, relevantPatterns } from "src/core/workflow/relevant-paths.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("relevantPatterns", () => {
  it("keeps real globs and drops the task-contract token and negated patterns", () => {
    const task = buildTaskV3({ relevantPaths: ["src/**", "@task-contract", "!src/skip.ts", "docs/*"] });

    expect(relevantPatterns(task)).toEqual(["src/**", "docs/*"]);
  });

  it("is empty when the task declares no relevantPaths", () => {
    expect(relevantPatterns(buildTaskV3({ relevantPaths: [] }))).toEqual([]);
  });
});

describe("expandBraces", () => {
  it("leaves a pattern without braces as it is", () => {
    expect(expandBraces("src/**")).toEqual(["src/**"]);
  });

  it("expands one group and several groups into every combination", () => {
    expect(expandBraces("src/**/*.{ts,js}")).toEqual(["src/**/*.ts", "src/**/*.js"]);
    expect(expandBraces("{src,test}/**/*.{ts,js}").sort()).toEqual([
      "src/**/*.js",
      "src/**/*.ts",
      "test/**/*.js",
      "test/**/*.ts",
    ]);
  });

  it("falls back to a wildcard for the groups when the expansion would be too large", () => {
    const pattern = "{a,b,c,d}/{a,b,c,d}/{a,b,c,d}/x.{ts,js}";

    expect(expandBraces(pattern)).toEqual(["*/*/*/x.*"]);
  });

  it("does not touch an unbalanced or nested brace", () => {
    expect(expandBraces("src/{a,b")).toEqual(["src/{a,b"]);
    expect(expandBraces("src/{a,{b,c}}.ts")).toEqual(["src/{a,{b,c}}.ts"]);
  });
});

describe("coveredFiles", () => {
  it("lists the existing files the patterns cover, including dot files, and nothing outside them", async () => {
    const root = await temporaryRepository();
    for (const path of ["src/a.ts", "src/.hidden.ts", "README.md"]) {
      await mkdir(join(root, path, ".."), { recursive: true });
      await writeFile(join(root, path), "x\n");
    }

    const covered = await coveredFiles(root, ["src/**"]);

    expect([...covered].sort()).toEqual(["src/.hidden.ts", "src/a.ts"]);
  });

  it("does not follow into node_modules unless a pattern names it", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "node_modules/pkg"), { recursive: true });
    await writeFile(join(root, "node_modules/pkg/index.js"), "x\n");
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src/a.ts"), "x\n");

    expect([...(await coveredFiles(root, ["**"]))]).toEqual(["src/a.ts"]);
  });
});
