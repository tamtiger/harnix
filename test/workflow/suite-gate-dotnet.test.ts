import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectProjectStatus } from "src/commands/status.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { assertSuiteGateReady, suiteGateProblem } from "src/core/workflow/suite-gate.js";
import { buildCheck, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
const TEST_PROJECT =
  '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="Microsoft.NET.Test.Sdk" /></ItemGroup></Project>';

async function monorepo(): Promise<string> {
  const root = await temporaryRepository();
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
  await mkdir(join(root, "svc", "tests"), { recursive: true });
  await writeFile(join(root, "svc", "App.sln"), "");
  await writeFile(join(root, "svc", "tests", "App.Tests.csproj"), TEST_PROJECT);
  return root;
}

const withCheck = (overrides: Parameters<typeof buildCheck>[0]) =>
  buildTaskV3({ validationPlan: [buildCheck({ id: "suite", scope: "full", inputs: ["**"], ...overrides })] });

describe("the suite gate in a .NET monorepo", () => {
  it("accepts dotnet test with a safe solution path, and a bare dotnet test with the cwd of the solution", async () => {
    const root = await monorepo();

    await expect(
      assertSuiteGateReady(root, withCheck({ command: "dotnet test svc/App.sln" })),
    ).resolves.toBeUndefined();
    await expect(
      assertSuiteGateReady(root, withCheck({ command: "dotnet test", cwd: "svc" })),
    ).resolves.toBeUndefined();
  });

  it("refuses a partial command and names both ways to fix it with the possible cwd", async () => {
    const root = await monorepo();

    const error = (await assertSuiteGateReady(root, withCheck({ command: "node run.js" })).catch(
      (e: unknown) => e,
    )) as Error;

    expect(error.message).toContain("dotnet test <path/to/solution.sln>");
    expect(error.message).toContain("--cwd <dir>");
    expect(error.message).toContain("svc");
  });
});

describe("suiteGateProblem", () => {
  it("warns early when no required check is the suite, and is silent for a valid one", async () => {
    const root = await monorepo();

    expect(await suiteGateProblem(root, buildTaskV3({ validationPlan: [buildCheck()] }), false)).toMatch(
      /finish will refuse/u,
    );
    expect(await suiteGateProblem(root, withCheck({ command: "pnpm test" }), false)).toBeUndefined();
  });

  it("with requirePass also reports a suite check that has not passed", async () => {
    const root = await monorepo();
    const task = withCheck({ command: "pnpm test" });

    expect(await suiteGateProblem(root, task, true)).toMatch(/has not passed yet/u);
    const red = buildTaskV3({
      ...task,
      evidence: [buildEvidence({ checkId: "suite", result: "fail", exitCode: 1 })],
    });
    expect(await suiteGateProblem(root, red, true)).toMatch(/has not passed yet/u);
  });
});

describe("early suite gate warnings", () => {
  it("shows the problem in status attention and in the transition dry-run advisories", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));

    const status = await inspectProjectStatus(root);
    const dryRun = (await transitionWorkflow(root, "verifying", "verifying", undefined, true)) as {
      advisories: string[];
    };

    expect(status.attention).toContainEqual({
      code: "suite-check-invalid",
      count: 1,
      detail: expect.stringContaining("finish will refuse"),
    });
    expect(dryRun.advisories.some((line) => line.startsWith("Suite gate:"))).toBe(true);
  });
});
