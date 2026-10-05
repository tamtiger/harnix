import { describe, expect, it } from "vitest";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("initTaskWorkflow", () => {
  it("should create a valid TaskRecord v3 and set it as active task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    const task = await initTaskWorkflow(root, {
      title: "Fix Payment Portal Lint",
    });

    expect(task.schemaVersion).toBe(3);
    expect(task.title).toBe("Fix Payment Portal Lint");
    expect(task.mode).toBe("lite");
    expect(task.status).toBe("planning");
    expect(task.checkpoint).toBe("planning");
    expect(task.acceptanceCriteria).toHaveLength(1);
    expect(task.acceptanceCriteria[0]?.text).toBe("Fix Payment Portal Lint");
    expect(task.validationPlan).toHaveLength(1);
    expect(task.validationPlan[0]?.required).toBe(true);

    const active = await resolveActiveTask(`${root}/.harnix`);
    expect(active?.id).toBe(task.id);
  });

  it("should support custom mode, goal, criterion text, command, and inputs", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    const task = await initTaskWorkflow(root, {
      title: "Add Microservice Gateway",
      mode: "full",
      goal: "Implement API Gateway",
      criterion: "Gateway routes payment requests correctly",
      command: "dotnet test services/gateway",
      input: ["services/gateway/**"],
    });

    expect(task.mode).toBe("full");
    expect(task.goal).toBe("Implement API Gateway");
    expect(task.acceptanceCriteria[0]?.text).toBe("Gateway routes payment requests correctly");
    expect(task.validationPlan[0]?.command).toBe("dotnet test services/gateway");
    expect(task.validationPlan[0]?.inputs).toEqual(["services/gateway/**"]);
  });

  it("should reject an empty title", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(initTaskWorkflow(root, { title: "" })).rejects.toThrow(/--title/u);
    await expect(initTaskWorkflow(root, { title: "   " })).rejects.toThrow(/--title/u);
  });
});
