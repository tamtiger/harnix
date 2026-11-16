import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultCheckInputs } from "src/core/workflow/init-default-inputs.js";
import { coversSourceAndTest } from "src/core/workflow/suite-gate.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function layout(root: string, directories: string[], files: string[] = []): Promise<void> {
  for (const directory of directories) await mkdir(join(root, directory), { recursive: true });
  for (const file of files) await writeFile(join(root, file), "");
}

describe("defaultCheckInputs", () => {
  it("narrows to the source tree, the test tree and the root manifests when both trees exist", async () => {
    const root = await temporaryRepository();
    await layout(root, ["src", "test", "docs"], ["package.json", "tsconfig.json", "README.md"]);

    const inputs = await defaultCheckInputs(root, undefined);

    expect(inputs).toEqual(["package.json", "src/**", "test/**", "tsconfig.json"]);
    expect(coversSourceAndTest(inputs)).toBe(true);
  });

  it("accepts tests and spec as the test tree", async () => {
    for (const tests of ["tests", "spec", "__tests__"]) {
      const root = await temporaryRepository();
      await layout(root, ["src", tests]);
      expect(await defaultCheckInputs(root, undefined)).toEqual(["src/**", `${tests}/**`].sort());
    }
  });

  it("keeps ** when a source tree or a test tree is missing", async () => {
    const onlySource = await temporaryRepository();
    await layout(onlySource, ["src"], ["package.json"]);
    const onlyTests = await temporaryRepository();
    await layout(onlyTests, ["test"]);
    const neither = await temporaryRepository();
    await layout(neither, ["docs"]);

    for (const root of [onlySource, onlyTests, neither])
      expect(await defaultCheckInputs(root, undefined)).toEqual(["**"]);
  });

  it("looks inside the --cwd package and prefixes every input with it", async () => {
    const root = await temporaryRepository();
    await layout(root, ["pkg/src", "pkg/test", "src"], ["pkg/package.json"]);

    const inputs = await defaultCheckInputs(root, "pkg");

    expect(inputs).toEqual(["pkg/package.json", "pkg/src/**", "pkg/test/**"]);
    expect(coversSourceAndTest(inputs)).toBe(true);
  });

  it("falls back to the package wildcard when the package has no such trees", async () => {
    const root = await temporaryRepository();
    await layout(root, ["pkg"], ["pkg/package.json"]);
    expect(await defaultCheckInputs(root, "pkg")).toEqual(["pkg/**"]);
  });

  it("adds the root config, lock and solution files that change what the tests do", async () => {
    const root = await temporaryRepository();
    const configs = [
      "vitest.config.ts",
      "jest.config.js",
      "eslint.config.mjs",
      ".eslintrc.json",
      "pnpm-lock.yaml",
      "package-lock.json",
      "App.sln",
      "Directory.Build.props",
      "Directory.Packages.props",
      "global.json",
      "pytest.ini",
      "pnpm-workspace.yaml",
      "App.slnx",
    ];
    await layout(root, ["src", "test"], [...configs, "README.md", "CHANGELOG.md", "notes.txt"]);

    const inputs = await defaultCheckInputs(root, undefined);

    expect(inputs).toEqual([...configs, "src/**", "test/**"].sort());
    expect(coversSourceAndTest(inputs)).toBe(true);
  });

  it("stays narrow: no wildcard, no build or data directory, no unrelated root file", async () => {
    const root = await temporaryRepository();
    await layout(root, ["src", "test", "dist", "data", "coverage"], ["vitest.config.ts", "notes.md", "LICENSE"]);

    const inputs = await defaultCheckInputs(root, undefined);

    expect(inputs).toEqual(["src/**", "test/**", "vitest.config.ts"]);
    expect(inputs.some((input) => input === "**" || input.includes("dist") || input.includes("data"))).toBe(false);
  });

  it("looks for the config files inside the --cwd package only", async () => {
    const root = await temporaryRepository();
    await layout(root, ["pkg/src", "pkg/test"], ["vitest.config.ts", "pkg/vitest.config.ts", "pkg/App.sln"]);

    expect(await defaultCheckInputs(root, "pkg")).toEqual([
      "pkg/App.sln",
      "pkg/src/**",
      "pkg/test/**",
      "pkg/vitest.config.ts",
    ]);
  });
});
