import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { computeInputDigest } from "src/core/verification/input-digest.js";
import { assertSuiteGateFinishing, assertSuiteGateReady, coversSourceAndTest } from "src/core/workflow/suite-gate.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-suite-gate-");

async function writeFixture(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("Suite Gate (ac-suite-gate)", () => {
  it("coversSourceAndTest recognizes root, nested, monorepo, and normalized paths", () => {
    // Root level
    expect(coversSourceAndTest(["src/**", "test/**"])).toBe(true);
    expect(coversSourceAndTest(["lib/**", "spec/**"])).toBe(true);
    expect(coversSourceAndTest(["app/**", "tests/**"])).toBe(true);
    expect(coversSourceAndTest(["**"])).toBe(true);

    // Monorepo / subproject nested paths
    expect(coversSourceAndTest(["frt-paymenthub/src/**", "frt-paymenthub/test/**"])).toBe(true);
    expect(coversSourceAndTest(["packages/core/src/index.ts", "packages/core/test/index.test.ts"])).toBe(true);
    expect(coversSourceAndTest(["frt-paymenthub\\src\\**", "frt-paymenthub\\test\\**"])).toBe(true);
    expect(coversSourceAndTest(["./src/**", "./test/**"])).toBe(true);

    // Incomplete inputs
    expect(coversSourceAndTest(["frt-paymenthub/src/**"])).toBe(false);
    expect(coversSourceAndTest(["frt-paymenthub/test/**"])).toBe(false);
    expect(coversSourceAndTest(["src/**"])).toBe(false);
    expect(coversSourceAndTest(["test/**"])).toBe(false);
    expect(coversSourceAndTest(undefined)).toBe(false);
    expect(coversSourceAndTest([])).toBe(false);
  });

  it("ready accepts task with project-level suite check covering full source and test inputs", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "pnpm test", lint: "pnpm lint" },
      }),
    );
    await writeFixture(root, "pnpm-lock.yaml", "");
    await writeFixture(root, "src/index.ts", "export const a = 1;");
    await writeFixture(root, "test/index.test.ts", "test('ok', () => {});");

    const task = buildTaskV3({
      validationPlan: [
        {
          id: "check-suite",
          description: "Project suite check",
          scope: "full",
          required: true,
          command: "pnpm test",
          criterionIds: ["ac-1"],
          inputs: ["src/**", "test/**"],
        },
      ],
    });

    await expect(assertSuiteGateReady(root, task)).resolves.not.toThrow();
  });

  it("ready accepts task with monorepo nested source and test paths", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "dotnet test" },
      }),
    );
    await writeFixture(root, "frt-paymenthub/src/Adapter.cs", "");
    await writeFixture(root, "frt-paymenthub/test/AdapterTests.cs", "");

    const task = buildTaskV3({
      validationPlan: [
        {
          id: "check-monorepo-suite",
          description: "Monorepo suite check",
          scope: "full",
          required: true,
          command: "dotnet test frt-paymenthub/test/FRT.PaymentHub.Tests",
          criterionIds: ["ac-1"],
          inputs: ["frt-paymenthub/src/**", "frt-paymenthub/test/**"],
        },
      ],
    });

    await expect(assertSuiteGateReady(root, task)).resolves.not.toThrow();
  });

  it("ready rejects task missing project-level suite check (regression: pause task scenario)", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "pnpm test", "test:unit": "vitest", "test:workflow": "vitest" },
      }),
    );
    await writeFixture(root, "pnpm-lock.yaml", "");
    await writeFixture(root, "src/index.ts", "");
    await writeFixture(root, "test/index.test.ts", "");

    // Pause task bug: inputs only src/**/*.ts, command only unit+integration, missing test:workflow
    const pauseLikeTask = buildTaskV3({
      validationPlan: [
        {
          id: "check-narrow",
          description: "Narrow verification only unit and integration",
          scope: "focused",
          required: true,
          command: "pnpm typecheck && pnpm test:unit && pnpm test:integration",
          criterionIds: ["ac-1"],
          inputs: ["src/**/*.ts"], // Missing test/**
        },
      ],
    });

    await expect(assertSuiteGateReady(root, pauseLikeTask)).rejects.toThrow(
      /Workflow ready requires a required check whose inputs cover both source and test/u,
    );
    // Actionable: the error must steer away from a "project" scope and toward focused/full with wildcard inputs.
    await expect(assertSuiteGateReady(root, pauseLikeTask)).rejects.toThrow(/"focused" or "full"/u);
    await expect(assertSuiteGateReady(root, pauseLikeTask)).rejects.toThrow(/no "project" scope/u);
  });

  it("finish rejects completion when suite check lacks a passing evidence with current digest", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: { test: "pnpm test" },
      }),
    );
    await writeFixture(root, "src/index.ts", "");
    await writeFixture(root, "test/index.test.ts", "");

    const taskWithoutPass = buildTaskV3({
      status: "verifying",
      checkpoint: "finishing",
      validationPlan: [
        {
          id: "check-suite",
          description: "Project suite check",
          scope: "full",
          required: true,
          command: "pnpm test",
          criterionIds: ["ac-1"],
          inputs: ["src/**", "test/**"],
        },
      ],
      evidence: [], // No evidence recorded
    });

    await expect(assertSuiteGateFinishing(root, taskWithoutPass)).rejects.toThrow(
      /Workflow finish requires a passing source-and-test check with a current input digest/u,
    );
  });

  it("coversSourceAndTest recognizes layouts whose test directories are named by suffix", () => {
    expect(coversSourceAndTest(["Foo.Api/**", "Foo.Api.Tests/**"])).toBe(true);
    expect(coversSourceAndTest(["Foo.Api/**/", "Foo.Api.UnitTests/"])).toBe(true);
    expect(coversSourceAndTest(["service-a/**", "service-a-tests/**"])).toBe(true);
    expect(coversSourceAndTest(["lib/core/**", "lib/core/__tests__/**"])).toBe(true);
    expect(coversSourceAndTest(["Foo.Api/**"])).toBe(false);
    expect(coversSourceAndTest(["Foo.Api.Tests/**"])).toBe(false);
  });

  it("coversSourceAndTest rejects documentation trees, file-only globs and negations as source", () => {
    expect(coversSourceAndTest(["docs/app/**", "test/**"])).toBe(false);
    expect(coversSourceAndTest(["scripts/**", "test/**"])).toBe(false);
    expect(coversSourceAndTest(["**/*.cs", "**/*.Tests.cs"])).toBe(false);
    expect(coversSourceAndTest(["!src/**", "test/**"])).toBe(false);
    expect(coversSourceAndTest(["x/lib/**", "test/**"])).toBe(true);
    expect(coversSourceAndTest(["xlib/**", "test/**"])).toBe(true);
  });

  it("ready error message describes the required coverage and the valid scope values", async () => {
    const root = await createFixture();
    await writeFixture(root, "package.json", JSON.stringify({ scripts: { test: "pnpm test" } }));
    await writeFixture(root, "src/index.ts", "");
    const task = buildTaskV3({ validationPlan: [] });

    const message = await assertSuiteGateReady(root, task).then(
      () => "",
      (error: Error) => error.message,
    );
    expect(message).toMatch(/inputs cover both source and test/u);
    expect(message).toMatch(/"focused" or "full"/u);
    expect(message).toMatch(/no "project" scope/u);
  });

  it("finish judges the newest suite pass, not the first recorded one", async () => {
    const root = await createFixture();
    await writeFixture(root, "package.json", JSON.stringify({ scripts: { test: "pnpm test" } }));
    await writeFixture(root, "src/index.ts", "export const a = 1;");
    await writeFixture(root, "test/index.test.ts", "");
    const suiteCheck = {
      id: "check-suite",
      description: "Project suite check",
      scope: "full" as const,
      required: true,
      command: "pnpm test",
      criterionIds: ["ac-1"],
      inputs: ["src/**", "test/**"],
    };
    const base = buildTaskV3({ status: "verifying", checkpoint: "finishing", validationPlan: [suiteCheck] });
    const { inputDigest } = await computeInputDigest(root, base, "check-suite");
    const pass = (id: string, recordedAt: string, digest: string) => ({
      id,
      checkId: "check-suite",
      recordedAt,
      result: "pass" as const,
      exitCode: 0,
      summary: "pnpm test — pass",
      artifactPaths: [],
      inputDigest: digest,
    });
    const stale = pass("ev-old", "2026-09-28T09:00:00.000+07:00", "0".repeat(64));
    const fresh = pass("ev-new", "2026-09-29T09:00:00.000+07:00", inputDigest);

    await expect(assertSuiteGateFinishing(root, { ...base, evidence: [stale, fresh] })).resolves.not.toThrow();
    await expect(assertSuiteGateFinishing(root, { ...base, evidence: [fresh, stale] })).resolves.not.toThrow();
    const newerStale = pass("ev-newer-stale", "2026-09-29T10:00:00.000+07:00", "1".repeat(64));
    await expect(assertSuiteGateFinishing(root, { ...base, evidence: [fresh, newerStale] })).rejects.toThrow(
      /is stale/u,
    );
  });

  it("permits ready and finish when repository has no tests detected", async () => {
    const root = await createFixture();
    await writeFixture(root, "package.json", JSON.stringify({ scripts: { build: "tsc" } }));
    await writeFixture(root, "src/index.ts", "const x = 1;");

    const task = buildTaskV3({
      status: "verifying",
      checkpoint: "finishing",
      validationPlan: [],
    });

    await expect(assertSuiteGateReady(root, task)).resolves.not.toThrow();
    await expect(assertSuiteGateFinishing(root, task)).resolves.not.toThrow();
  });
});
