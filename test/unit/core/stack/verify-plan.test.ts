import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
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

  it("discovers nested .NET solutions and sub-repositories when recursive option is true", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "vitest run" },
      }),
    );
    await writeFixture(root, "test/sample.test.ts", "");

    // Nested .NET sub-repositories
    await writeFixture(
      root,
      "services/payment-core/PaymentCore.sln",
      'Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "Tests", "PaymentCore.Tests\\PaymentCore.Tests.csproj", "{1}"\nEndProject\n',
    );
    await writeFixture(
      root,
      "services/payment-core/PaymentCore.Tests/PaymentCore.Tests.csproj",
      '<Project><ItemGroup><PackageReference Include="xunit" Version="2" /></ItemGroup></Project>',
    );
    await writeFixture(root, "services/payment-gateway/Gateway.csproj", "");

    const plan = await buildVerifyPlan(root, { recursive: true });
    const corePkg = plan.packages.find((p) => p.path === "services/payment-core");
    const gatewayPkg = plan.packages.find((p) => p.path === "services/payment-gateway");

    expect(corePkg).toBeDefined();
    expect(corePkg?.ecosystem).toBe("dotnet");
    expect(corePkg?.commands.test).toBe("dotnet test PaymentCore.sln");
    expect(plan.packages.some((p) => p.path === "services/payment-core/PaymentCore.Tests")).toBe(false);

    expect(gatewayPkg).toBeDefined();
    expect(gatewayPkg?.ecosystem).toBe("dotnet");
    expect(gatewayPkg?.hasTests).toBe(false);
  });

  it("never exposes an absolute project path", async () => {
    const root = await createFixture();
    await writeFixture(root, "package.json", JSON.stringify({ scripts: { test: "vitest run" } }));
    await writeFixture(root, "test/sample.test.ts", "");

    const plan = await buildVerifyPlan(root);
    expect(plan).not.toHaveProperty("projectRoot");
    expect(JSON.stringify(plan)).not.toContain(root.replaceAll("\\", "\\\\"));
  });

  it("computes impact-driven verification for an exact target file", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "vitest run" },
      }),
    );
    await writeFixture(root, "src/service.ts", "export function service() { return 42; }");
    await writeFixture(root, "test/service.test.ts", "export const testRan = true;");

    const plan = await buildVerifyPlan(root, { impact: "src/service.ts" });
    expect(plan.impact).toBeDefined();
    expect(plan.impact?.files).toEqual(["src/service.ts"]);
    expect(plan.impact?.tests).toEqual(["test/service.test.ts"]);
    expect(plan.impact?.command).toContain("test/service.test.ts");
    expect(plan.impact?.cwd).toBe(".");
  });
});

const execFileAsync = promisify(execFile);

async function monorepo(root: string): Promise<void> {
  await writeFixture(root, "pnpm-workspace.yaml", "packages:\n  - 'packages/*'\n");
  await writeFixture(root, "pnpm-lock.yaml", "");
  for (const name of ["a", "b"]) {
    await writeFixture(
      root,
      `packages/${name}/package.json`,
      JSON.stringify({ name, scripts: { test: "vitest run" } }),
    );
    await writeFixture(root, `packages/${name}/index.ts`, "export const value = 1;\n");
  }
  await writeFixture(root, "packages/docs/package.json", JSON.stringify({ name: "docs" }));
}

describe("buildVerifyPlan scope options", () => {
  it("keeps only the packages inside or containing --path and leaves the repository verdict alone", async () => {
    const root = await createFixture();
    await monorepo(root);

    const full = await buildVerifyPlan(root);
    const scoped = await buildVerifyPlan(root, { path: "packages/a/src" });

    expect(full.packages.map((pkg) => pkg.path)).toEqual(["packages/a", "packages/b", "packages/docs"]);
    expect(scoped.packages.map((pkg) => pkg.path)).toEqual(["packages/a"]);
    expect(scoped.hasTests).toBe(full.hasTests);
    expect(scoped.commands).toEqual(full.commands);
    expect((await buildVerifyPlan(root, { path: "packages" })).packages).toHaveLength(3);
    expect((await buildVerifyPlan(root, { path: "." })).packages).toHaveLength(3);
  });

  it("keeps only the packages that hold a file changed according to git for --changed", async () => {
    const root = await createFixture();
    await monorepo(root);
    await execFileAsync("git", ["init", "-q", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync(
      "git",
      [
        "-c",
        "user.email=t@example.com",
        "-c",
        "user.name=t",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-q",
        "-m",
        "base",
      ],
      {
        cwd: root,
      },
    );
    await writeFixture(root, "packages/b/index.ts", "export const value = 2;\n");

    const plan = await buildVerifyPlan(root, { changed: true });

    expect(plan.packages.map((pkg) => pkg.path)).toEqual(["packages/b"]);
  });

  it("does not narrow --changed when git has nothing to report", async () => {
    const root = await createFixture();
    await monorepo(root);

    const plan = await buildVerifyPlan(root, { changed: true });

    expect(plan.packages.map((pkg) => pkg.path)).toEqual(["packages/a", "packages/b", "packages/docs"]);
  });

  it("returns only path, hasTests and the test command of packages with tests for --brief", async () => {
    const root = await createFixture();
    await monorepo(root);

    const plan = await buildVerifyPlan(root, { brief: true });

    expect(plan.packages).toEqual([
      { path: "packages/a", hasTests: true, commands: { test: "pnpm run test" } },
      { path: "packages/b", hasTests: true, commands: { test: "pnpm run test" } },
    ]);
  });

  it("keeps the default output shape when no scope option is given", async () => {
    const root = await createFixture();
    await monorepo(root);

    const plan = await buildVerifyPlan(root);

    expect(plan.packages[0]).toMatchObject({ path: "packages/a", ecosystem: "node", hasTests: true });
    expect(plan.packages.find((pkg) => pkg.path === "packages/docs")?.warning).toMatch(/No tests detected/u);
  });
});

describe("buildVerifyPlan --changed against git", () => {
  async function committedMonorepo(root: string): Promise<void> {
    await monorepo(root);
    await writeFixture(root, "packages/my app/package.json", JSON.stringify({ scripts: { test: "vitest run" } }));
    await writeFixture(root, "packages/my app/index.ts", "export const value = 1;\n");
    await execFileAsync("git", ["init", "-q", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync(
      "git",
      [
        "-c",
        "user.email=t@example.com",
        "-c",
        "user.name=t",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-q",
        "-m",
        "base",
      ],
      {
        cwd: root,
      },
    );
  }

  it("returns no package for a clean working tree", async () => {
    const root = await createFixture();
    await committedMonorepo(root);

    expect((await buildVerifyPlan(root, { changed: true })).packages).toEqual([]);
  });

  it("matches a changed file under a directory whose name has a space", async () => {
    const root = await createFixture();
    await committedMonorepo(root);
    await writeFixture(root, "packages/my app/index.ts", "export const value = 2;\n");

    const plan = await buildVerifyPlan(root, { changed: true });

    expect(plan.packages.map((pkg) => pkg.path)).toEqual(["packages/my app"]);
  });
});

describe("buildVerifyPlan when the Harnix root is below the Git root", () => {
  it("matches changed files against package paths relative to the Harnix root", async () => {
    const root = await createFixture();
    await writeFixture(root, "app/pnpm-workspace.yaml", "packages:\n  - 'packages/*'\n");
    for (const name of ["a", "b"]) {
      await writeFixture(
        root,
        `app/packages/${name}/package.json`,
        JSON.stringify({ scripts: { test: "vitest run" } }),
      );
      await writeFixture(root, `app/packages/${name}/index.ts`, "export const value = 1;\n");
    }
    await writeFixture(root, "other/readme.md", "x\n");
    await execFileAsync("git", ["init", "-q", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync(
      "git",
      [
        "-c",
        "user.email=t@example.com",
        "-c",
        "user.name=t",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-q",
        "-m",
        "base",
      ],
      { cwd: root },
    );
    await writeFixture(root, "app/packages/b/index.ts", "export const value = 2;\n");
    await writeFixture(root, "other/readme.md", "y\n");

    const plan = await buildVerifyPlan(join(root, "app"), { changed: true });

    expect(plan.packages.map((pkg) => pkg.path)).toEqual(["packages/b"]);
  });

  it("explains a --path that leaves the repository", async () => {
    const root = await createFixture();
    await writeFixture(root, "package.json", JSON.stringify({ scripts: { test: "vitest run" } }));

    await expect(buildVerifyPlan(root, { path: "../elsewhere" })).rejects.toThrow(
      /--path must be a repository-relative directory/u,
    );
  });
});
