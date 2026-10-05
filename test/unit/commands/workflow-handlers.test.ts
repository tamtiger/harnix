import { describe, expect, it } from "vitest";

import { WORKFLOW_HANDLERS, type WorkflowContext } from "src/commands/workflow-handlers.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

function context(root: string, input: string | undefined, flags: WorkflowContext["flags"] = {}): WorkflowContext {
  return { root, flags, operands: [], options: { workflowInput: () => Promise.resolve(input ?? "") } };
}

describe("workflow handlers", () => {
  it("has one handler per workflow action", () => {
    expect(Object.keys(WORKFLOW_HANDLERS).sort()).toEqual(
      [
        "addCriterion",
        "addDecision",
        "addRisk",
        "batch",
        "cancel",
        "criterion",
        "evidence",
        "finish",
        "init",
        "inspect",
        "learn",
        "migrate",
        "preflight",
        "replaceCheck",
        "runCheck",
        "save",
        "schema",
        "setCheck",
        "setPaths",
        "snapshot",
        "transition",
      ].sort(),
    );
  });

  it("strips a leading byte order mark from piped JSON before parsing it", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);

    const result = (await WORKFLOW_HANDLERS.save!(
      context(root, `${BYTE_ORDER_MARK}${JSON.stringify({ task: taskV3("planning", "planning") })}`, { brief: true }),
    )) as { status: string };

    expect(result.status).toBe("planning");
  });

  it("rejects an empty stdin body for a required envelope and an invalid JSON body", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(WORKFLOW_HANDLERS.save!(context(root, ""))).rejects.toThrow("requires a bounded JSON envelope");
    await expect(WORKFLOW_HANDLERS.batch!(context(root, "{not json"))).rejects.toThrow("requires valid JSON");
  });

  it("creates and activates a task from --init flags and returns the brief projection", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);

    const result = (await WORKFLOW_HANDLERS.init!(
      context(root, undefined, { title: "Init handler task", mode: "lite", brief: true, input: ["src/**"] }),
    )) as { id: string; status: string; checkpoint: string };

    expect(result).toMatchObject({ status: "planning", checkpoint: "planning" });
    expect(result.id).toMatch(/^\d{8}-\d{6}-init-handler-task$/u);
    const inspected = (await WORKFLOW_HANDLERS.inspect!(context(root, undefined))) as { activeTask: { id: string } };
    expect(inspected.activeTask.id).toBe(result.id);
  });

  it("requires exactly two check ids for --replace-check", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(WORKFLOW_HANDLERS.replaceCheck!(context(root, "", { replaceCheck: ["only-one"] }))).rejects.toThrow(
      "requires exactly two check IDs",
    );
  });
});
