import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHECK_UNCHECKED,
  syncPlanChecklistPass,
  tickPlanChecklist,
  tickWorkflow,
} from "src/core/workflow/plan-sync.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { withWorkflowLock } from "src/core/workflow/workflow-lock.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { taskMonth } from "test/support/task-paths.js";

const temporaryRepository = useTemporaryRepositories();

describe("syncPlanChecklistPass", () => {
  it("converts unchecked items with [check-id] tag to [x]", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-1");
    await mkdir(taskDir, { recursive: true });

    const initialPlan = [
      "# Plan",
      "- [ ] [check-1] First item",
      "- [ ] [check-2] Second item",
      "- [x] [check-1] Already checked item",
    ].join("\n");

    await writeFile(join(taskDir, "plan.md"), initialPlan, "utf8");

    const updated = await syncPlanChecklistPass(join(root, ".harnix"), "task-1", "check-1");

    expect(updated).toBe(true);
    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content).toContain("- [x] [check-1] First item");
    expect(content).toContain("- [ ] [check-2] Second item");
    expect(content).toContain("- [x] [check-1] Already checked item");
  });

  it("converts unchecked items with `check-id` code or starting check-id to [x]", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-2");
    await mkdir(taskDir, { recursive: true });

    const initialPlan = [
      "# Plan",
      "- [ ] `check-a` In backticks",
      "- [ ] check-b Starting name",
      "- [ ] [check-c] In tag",
    ].join("\n");

    await writeFile(join(taskDir, "plan.md"), initialPlan, "utf8");

    await syncPlanChecklistPass(join(root, ".harnix"), "task-2", "check-a");
    await syncPlanChecklistPass(join(root, ".harnix"), "task-2", "check-b");

    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content).toContain("- [x] `check-a` In backticks");
    expect(content).toContain("- [x] check-b Starting name");
    expect(content).toContain("- [ ] [check-c] In tag");
  });

  it("returns false and does not throw when plan.md does not exist", async () => {
    const root = await temporaryRepository();
    const result = await syncPlanChecklistPass(join(root, ".harnix"), "non-existent-task", "check-1");
    expect(result).toBe(false);
  });

  it("returns false when no matching unchecked item is found", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-3");
    await mkdir(taskDir, { recursive: true });

    await writeFile(join(taskDir, "plan.md"), "- [ ] [check-other] Do other\n", "utf8");

    const updated = await syncPlanChecklistPass(join(root, ".harnix"), "task-3", "check-unknown");
    expect(updated).toBe(false);
  });

  it("preserves trailing newline POSIX standard after synchronization", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-posix");
    await mkdir(taskDir, { recursive: true });

    await writeFile(join(taskDir, "plan.md"), "# Plan\n- [ ] [check-1] Item\n\n\n", "utf8");
    await syncPlanChecklistPass(join(root, ".harnix"), "task-posix", "check-1");

    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content.endsWith("\n")).toBe(true);
    expect(content.endsWith("\n\n")).toBe(false);
  });
});

describe("tickPlanChecklist", () => {
  it("ticks all items when selector is 'all'", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-all");
    await mkdir(taskDir, { recursive: true });

    await writeFile(join(taskDir, "plan.md"), "# Plan\n- [ ] First item\n- [ ] Second item\n- [x] Done item\n", "utf8");

    const result = await tickPlanChecklist(join(root, ".harnix"), "task-all", "all");
    expect(result).toEqual({ updated: 2, remaining: 0, total: 3 });

    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content).toContain("- [x] First item");
    expect(content).toContain("- [x] Second item");
    expect(content).toContain("- [x] Done item");
  });

  it("ticks specific item by 1-based index", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-idx");
    await mkdir(taskDir, { recursive: true });

    await writeFile(join(taskDir, "plan.md"), "# Plan\n- [ ] Item 1\n- [ ] Item 2\n- [ ] Item 3\n", "utf8");

    const result = await tickPlanChecklist(join(root, ".harnix"), "task-idx", "2");
    expect(result).toEqual({ updated: 1, remaining: 2, total: 3 });

    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content).toContain("- [ ] Item 1");
    expect(content).toContain("- [x] Item 2");
    expect(content).toContain("- [ ] Item 3");
  });

  it("ticks items matching substring pattern", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-pattern");
    await mkdir(taskDir, { recursive: true });

    await writeFile(
      join(taskDir, "plan.md"),
      "# Plan\n- [ ] Implement parser logic\n- [ ] Add unit tests\n- [ ] Documentation\n",
      "utf8",
    );

    const result = await tickPlanChecklist(join(root, ".harnix"), "task-pattern", "parser");
    expect(result).toEqual({ updated: 1, remaining: 2, total: 3 });

    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content).toContain("- [x] Implement parser logic");
    expect(content).toContain("- [ ] Add unit tests");
  });

  it("throws clear error when pattern does not match", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-nomatch");
    await mkdir(taskDir, { recursive: true });

    await writeFile(join(taskDir, "plan.md"), "- [ ] Only item\n", "utf8");

    await expect(tickPlanChecklist(join(root, ".harnix"), "task-nomatch", "nonexistent")).rejects.toThrow(
      'No unchecked checklist item matched pattern: "nonexistent".',
    );
  });

  it("throws error when index is out of range", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-range");
    await mkdir(taskDir, { recursive: true });

    await writeFile(join(taskDir, "plan.md"), "- [ ] Single item\n", "utf8");

    await expect(tickPlanChecklist(join(root, ".harnix"), "task-range", "5")).rejects.toThrow(
      "Index 5 out of range for unchecked items (1..1).",
    );
  });
});

describe("tickWorkflow", () => {
  it("throws error when no active task exists", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await expect(tickWorkflow(root, "all")).rejects.toThrow("Workflow --tick requires an active task.");
  });

  it("ticks active task plan checklist and returns standard envelope", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("in_progress", "implementing");
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, task);
    await setActiveTask(harnixRoot, task.id);

    const taskDir = join(harnixRoot, "tasks", taskMonth(task.id), task.id);
    await mkdir(taskDir, { recursive: true });
    await writeFile(join(taskDir, "plan.md"), "# Plan\n- [ ] First\n- [ ] Second\n", "utf8");

    const result = await tickWorkflow(root, "all");
    expect(result).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      taskId: task.id,
      updated: 2,
      remaining: 0,
      total: 2,
    });
  });
});

describe("plan.md writes take the workflow lock", () => {
  async function planProject(): Promise<{ harnixRoot: string; planPath: string }> {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-1");
    await mkdir(taskDir, { recursive: true });
    const planPath = join(taskDir, "plan.md");
    await writeFile(planPath, "# Plan\n- [ ] [check-1] First item\n", "utf8");
    return { harnixRoot: join(root, ".harnix"), planPath };
  }

  async function waitsForLock(run: () => Promise<unknown>, harnixRoot: string): Promise<void> {
    let release: () => void = () => undefined;
    let entered: () => void = () => undefined;
    const inside = new Promise<void>((resolve) => (entered = resolve));
    const held = withWorkflowLock(harnixRoot, () => {
      entered();
      return new Promise<void>((resolve) => (release = resolve));
    });
    // Wait until the section really holds the lock instead of sleeping and hoping it does.
    await inside;
    let settled = false;
    const attempt = run().then(() => (settled = true));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(settled).toBe(false);
    release();
    await held;
    await attempt;
  }

  it("makes syncPlanChecklistPass wait for a writer that holds the lock", async () => {
    const { harnixRoot, planPath } = await planProject();
    await waitsForLock(() => syncPlanChecklistPass(harnixRoot, "task-1", "check-1"), harnixRoot);
    expect(await readFile(planPath, "utf8")).toContain("- [x] [check-1]");
  });

  it("makes tickPlanChecklist wait for a writer that holds the lock", async () => {
    const { harnixRoot, planPath } = await planProject();
    await waitsForLock(() => tickPlanChecklist(harnixRoot, "task-1", "all"), harnixRoot);
    expect(await readFile(planPath, "utf8")).toContain("- [x] [check-1]");
  });
});

describe("CHECK_UNCHECKED", () => {
  it("matches an unchecked item written with either bullet and rejects a checked one", () => {
    expect(CHECK_UNCHECKED.test("- [ ] item")).toBe(true);
    expect(CHECK_UNCHECKED.test("  * [ ] item")).toBe(true);
    expect(CHECK_UNCHECKED.test("- [x] item")).toBe(false);
  });
});
