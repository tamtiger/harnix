import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildVerifyPlan } from "src/core/stack/verify-plan.js";
import { EXERCISE_RUNBOOK_PATH, findExerciseRunbook } from "src/core/spec/exercise-runbook.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-exercise-runbook-");

describe("findExerciseRunbook", () => {
  it("returns the repository-relative POSIX path when the file exists and has content", async () => {
    const root = await createFixture();
    await mkdir(join(root, ".harnix", "spec"), { recursive: true });
    await writeFile(join(root, ".harnix", "spec", "exercise.md"), "# Chạy thật\npnpm dev --port 4310\n");
    expect(await findExerciseRunbook(root)).toBe(EXERCISE_RUNBOOK_PATH);
    expect(EXERCISE_RUNBOOK_PATH).toBe(".harnix/spec/exercise.md");
  });

  it("returns undefined when the file is missing, empty or a directory", async () => {
    const root = await createFixture();
    expect(await findExerciseRunbook(root)).toBeUndefined();
    await mkdir(join(root, ".harnix", "spec", "exercise.md"), { recursive: true });
    expect(await findExerciseRunbook(root)).toBeUndefined();
    const other = await createFixture();
    await mkdir(join(other, ".harnix", "spec"), { recursive: true });
    await writeFile(join(other, ".harnix", "spec", "exercise.md"), "  \n");
    expect(await findExerciseRunbook(other)).toBeUndefined();
  });

  it("is reported by verify-plan as runbook only when the file exists", async () => {
    const root = await createFixture();
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
    expect((await buildVerifyPlan(root)).runbook).toBeUndefined();
    await mkdir(join(root, ".harnix", "spec"), { recursive: true });
    await writeFile(join(root, ".harnix", "spec", "exercise.md"), "# Chạy thật\n");
    expect((await buildVerifyPlan(root)).runbook).toBe(".harnix/spec/exercise.md");
  });
});
