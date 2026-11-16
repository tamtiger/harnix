import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertFlagGroups } from "src/commands/workflow-flags.js";
import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { buildLintCheck, isReadOnlyCommand } from "src/core/workflow/init-lint-check.js";

const temporaryRepository = useTemporaryRepositories();

describe("isReadOnlyCommand", () => {
  it("accepts plain lint commands", () => {
    for (const command of ["pnpm run lint", "ruff check .", "cargo clippy -- -D warnings", "pnpm -w run lint"])
      expect(isReadOnlyCommand(command)).toBe(true);
  });

  it("rejects -w of a formatter that rewrites files, but not pnpm's -w workspace flag", () => {
    for (const command of ["prettier -w .", "pnpm exec prettier -w src", "npx prettier -w .", "gofmt -w ."])
      expect(isReadOnlyCommand(command)).toBe(false);
    for (const command of ["pnpm -w run lint", "pnpm -w exec eslint .", "prettier --check ."])
      expect(isReadOnlyCommand(command)).toBe(true);
  });

  it("rejects a writing flag in any part of a chained or quoted script", () => {
    for (const command of [
      "eslint . && prettier -w .",
      "tsc --noEmit; eslint --fix .",
      "eslint .&&prettier --write .",
      "bash -c 'eslint . && eslint --fix .'",
      "eslint . || prettier -w src; echo done",
      'bash -c "ruff check . --fix"',
    ])
      expect(isReadOnlyCommand(command)).toBe(false);
  });

  it("keeps a chained read-only script read-only", () => {
    for (const command of ["eslint . && prettier --check .", "bash -c 'tsc --noEmit && eslint .'"])
      expect(isReadOnlyCommand(command)).toBe(true);
  });

  it("rejects --fix and --write in any form", () => {
    for (const command of ["eslint . --fix", "eslint --fix=true .", "prettier --write .", "prettier --write=true ."])
      expect(isReadOnlyCommand(command)).toBe(false);
  });
});

describe("buildLintCheck", () => {
  const criteria = [{ id: "ac-2" }, { id: "ac-1" }];

  it("builds a required full-scope check covering every criterion", () => {
    const { check, notice } = buildLintCheck({
      command: "pnpm run lint",
      criteriaIds: criteria.map((c) => c.id),
      inputs: ["**"],
    });
    expect(notice).toBeUndefined();
    expect(check).toMatchObject({
      id: "check-lint",
      scope: "full",
      required: true,
      command: "pnpm run lint",
      criterionIds: ["ac-1", "ac-2"],
      inputs: ["**"],
    });
  });

  it("carries the package cwd", () => {
    const { check } = buildLintCheck({
      command: "pnpm run lint",
      criteriaIds: ["ac-1"],
      inputs: ["pkg/**"],
      cwd: "pkg",
    });
    expect(check?.cwd).toBe("pkg");
  });

  it("adds nothing and says how to fix it when no lint command exists", () => {
    const { check, notice } = buildLintCheck({ command: undefined, criteriaIds: ["ac-1"], inputs: ["**"] });
    expect(check).toBeUndefined();
    expect(notice).toContain("--with-check");
  });

  it("skips a command with --fix and names the read-only form", () => {
    const { check, notice } = buildLintCheck({ command: "eslint . --fix", criteriaIds: ["ac-1"], inputs: ["**"] });
    expect(check).toBeUndefined();
    expect(notice).toContain("--fix");
  });
});

async function writeLintProject(root: string, scripts: Record<string, string>): Promise<void> {
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts }));
  await mkdir(join(root, "test"), { recursive: true });
  await writeFile(join(root, "test", "sample.test.ts"), "");
}

describe("initTaskWorkflow --with-lint", () => {
  it("adds nothing without the flag, even when the project has a lint script", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeLintProject(root, { test: "vitest run", lint: "eslint ." });

    const task = await initTaskWorkflow(root, { title: "No flag" });

    expect(task.validationPlan.map(({ id }) => id)).toEqual(["check-suite"]);
  });

  it("declares a full-scope check-lint before check-suite covering every criterion", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeLintProject(root, { test: "vitest run", lint: "eslint ." });

    const task = await initTaskWorkflow(root, { title: "Lint", criteria: ["One", "Two"], lint: true });

    expect(task.validationPlan.map(({ id }) => id)).toEqual(["check-lint", "check-suite"]);
    expect(task.validationPlan[0]).toMatchObject({
      scope: "full",
      required: true,
      command: "npm run lint",
      criterionIds: ["ac-1", "ac-2"],
      inputs: ["**"],
    });
  });

  it("keeps the declared check when --with-check already uses the id check-lint", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeLintProject(root, { test: "vitest run", lint: "eslint ." });

    const task = await initTaskWorkflow(root, {
      title: "Declared",
      lint: true,
      checks: [
        { id: "check-lint", command: "pnpm run lint", criterionIds: ["ac-1"], inputs: ["src/**"], scope: "full" },
      ],
    });

    expect(task.validationPlan.filter(({ id }) => id === "check-lint")).toHaveLength(1);
    expect(task.validationPlan.find(({ id }) => id === "check-lint")?.inputs).toEqual(["src/**"]);
  });

  it("does not fail and adds no check when the project has no lint script", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeLintProject(root, { test: "vitest run" });

    const task = await initTaskWorkflow(root, { title: "No lint", lint: true });

    expect(task.validationPlan.map(({ id }) => id)).toEqual(["check-suite"]);
  });
});

describe("--with-lint flag ownership", () => {
  it("belongs to --init only", () => {
    expect(() => assertFlagGroups("init", { withLint: true })).not.toThrow();
    expect(() => assertFlagGroups("inspect", { withLint: true })).toThrow(/--with-lint requires workflow --init/u);
  });
});
