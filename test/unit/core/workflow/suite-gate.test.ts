import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { assertSuiteGateFinishing, assertSuiteGateReady } from "src/core/workflow/suite-gate.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-suite-gate-");

async function writeFixture(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("Suite Gate (ac-suite-gate)", () => {
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
      /Workflow ready requires a project-level suite check covering full source and test inputs/u,
    );
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
      /Workflow finish requires a passing project-level suite check with current input digest/u,
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
