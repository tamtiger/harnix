import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildVerifyPlan } from "src/core/stack/verify-plan.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-verify-plan-");

async function writeFixture(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("buildVerifyPlan (ac-no-tests & verify-plan)", () => {
  it("generates verify plan with tests and commands when detected", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "vitest run", lint: "eslint ." },
      }),
    );
    await writeFixture(root, "pnpm-lock.yaml", "");
    await writeFixture(root, "test/sample.test.ts", "");

    const plan = await buildVerifyPlan(root);
    expect(plan.generator).toBe("harnix");
    expect(plan.schemaVersion).toBe(1);
    expect(plan.hasTests).toBe(true);
    expect(plan.commands.test).toBe("pnpm run test");
    expect(plan.commands.lint).toBe("pnpm run lint");
    expect(plan.warnings).toEqual([]);
  });

  it("reports warning and hasTests=false when repository has no tests (ac-no-tests)", async () => {
    const root = await createFixture();
    // Only source files, no test script, no test directory
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { build: "tsc" },
      }),
    );
    await writeFixture(root, "src/index.ts", "export const a = 1;");

    const plan = await buildVerifyPlan(root);
    expect(plan.hasTests).toBe(false);
    expect(plan.warnings.length).toBeGreaterThan(0);
    expect(plan.warnings[0]).toContain("No tests detected");
  });

  it("prioritizes verify: section from config.yaml over auto-detected commands", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      ".harnix/config.yaml",
      [
        "generator: harnix",
        "schemaVersion: 2",
        "developer: tam",
        "languages: [typescript]",
        "technologies: []",
        "packages: []",
        "platforms: [kiro]",
        "context: { maxCharacters: 24000, tokenApproximation: 4 }",
        "runtime: { research: conditional, fullContext: false }",
        "verify:",
        "  test: custom-test-runner",
        "  lint: custom-linter",
      ].join("\n"),
    );
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "npm test", lint: "eslint ." },
      }),
    );

    const plan = await buildVerifyPlan(root);
    expect(plan.commands.test).toBe("custom-test-runner");
    expect(plan.commands.lint).toBe("custom-linter");
  });

  it("merges workspace packages with config.verify.packages and warns for package without tests", async () => {
    const root = await createFixture();
    await writeFixture(root, "pnpm-workspace.yaml", "packages:\n  - 'packages/*'");
    await writeFixture(root, "packages/pkg-a/package.json", JSON.stringify({ scripts: { build: "tsc" } }));
    await writeFixture(
      root,
      ".harnix/config.yaml",
      [
        "generator: harnix",
        "schemaVersion: 2",
        "developer: tam",
        "languages: [typescript]",
        "technologies: []",
        "packages: []",
        "platforms: [kiro]",
        "context: { maxCharacters: 24000, tokenApproximation: 4 }",
        "runtime: { research: conditional, fullContext: false }",
        "verify:",
        "  packages:",
        "    - path: packages/pkg-a",
        "      lint: eslint .",
        "    - path: packages/pkg-b",
        "      test: vitest run",
      ].join("\n"),
    );

    const plan = await buildVerifyPlan(root);
    expect(plan.packages.length).toBe(2);
    const pkgA = plan.packages.find((p) => p.path === "packages/pkg-a");
    const pkgB = plan.packages.find((p) => p.path === "packages/pkg-b");
    expect(pkgA?.hasTests).toBe(false);
    expect(pkgA?.warning).toContain("No tests detected for package packages/pkg-a");
    expect(pkgB?.hasTests).toBe(true);
    expect(pkgB?.commands.test).toBe("vitest run");
    expect(plan.hasTests).toBe(true);
  });
});
