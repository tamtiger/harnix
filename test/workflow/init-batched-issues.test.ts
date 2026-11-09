import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import { parseCheckSpec } from "src/core/workflow/init-spec.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function projectWithoutTests(): Promise<string> {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  return root;
}

async function projectWithPackage(): Promise<string> {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  await mkdir(join(root, "svc"), { recursive: true });
  await writeFile(join(root, "svc", "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
  return root;
}

describe("workflow --init reports every problem at once", () => {
  it("lists the missing slug and the missing test command in one message with a corrected command", async () => {
    const root = await projectWithoutTests();

    const error = (await initTaskWorkflow(root, { title: "Giảm ma sát" }).catch((caught: unknown) => caught)) as Error;

    expect(error.message).toContain("workflow --init has 2 problems");
    expect(error.message).toContain("giam-ma-sat");
    expect(error.message).toContain("no project test command");
    expect(error.message).toContain('--slug giam-ma-sat --command "<cmd>"');
  });
});

describe("workflow --init --cwd reaches every declared check", () => {
  const spec = (extra = "") =>
    parseCheckSpec(`id=chk-focus;command=pnpm exec vitest run a;criteria=ac-1;input=svc/**${extra}`);

  it("lets a --with-check without cwd inherit --cwd and keeps an explicit cwd", async () => {
    const root = await projectWithPackage();

    const task = await initTaskWorkflow(root, {
      title: "Plain title",
      cwd: "svc",
      checks: [spec(), { ...spec(), id: "chk-other", cwd: "svc/other" }],
    });

    const byId = new Map(task.validationPlan.map((check) => [check.id, check.cwd]));
    expect(byId.get("check-suite")).toBe("svc");
    expect(byId.get("chk-focus")).toBe("svc");
    expect(byId.get("chk-other")).toBe("svc/other");
  });
});
