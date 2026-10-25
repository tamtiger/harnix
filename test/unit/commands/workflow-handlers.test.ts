import { describe, expect, it } from "vitest";

import { WORKFLOW_HANDLERS, type WorkflowContext } from "src/commands/workflow-handlers.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import {
  implementingTaskV3,
  initializeUtcProject,
  loadPersistedTask,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";

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
        "epicOrder",
        "evidence",
        "finish",
        "init",
        "inspect",
        "learn",
        "migrate",
        "preflight",
        "removeCriterion",
        "removeDecision",
        "removeRisk",
        "replaceCheck",
        "resetBreaker",
        "runCheck",
        "runChecks",
        "save",
        "schema",
        "setBaseline",
        "setCheck",
        "setCriterion",
        "setGoal",
        "setPaths",
        "setTitle",
        "snapshot",
        "tick",
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
      context(root, undefined, {
        title: "Init handler task",
        mode: "lite",
        brief: true,
        command: "pnpm test",
        input: ["src/**/*.{ts,tsx}, My Dir/**", "test/**"],
      }),
    )) as { id: string; status: string; checkpoint: string };

    expect(result).toMatchObject({ status: "planning", checkpoint: "planning" });
    expect(result.id).toMatch(/^\d{8}-\d{6}-init-handler-task$/u);
    const persisted = (await loadPersistedTask(root, result.id)) as { validationPlan: { inputs: string[] }[] };
    expect(persisted.validationPlan[0]?.inputs).toEqual(["My Dir/**", "src/**/*.{ts,tsx}", "test/**"]);
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

  it("addRisk keeps the mitigation inside the risk text", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);

    await WORKFLOW_HANDLERS.addRisk!(
      context(root, undefined, {
        addRisk: "r1",
        text: "Có thể mất dữ liệu",
        mitigation: "Sao lưu trước",
        severity: "high",
      }),
    );

    const persisted = (await loadPersistedTask(root, task.id)) as {
      residualRisks: { text: string; severity: string }[];
    };
    expect(persisted.residualRisks).toEqual([
      expect.objectContaining({ text: "Có thể mất dữ liệu (Mitigation: Sao lưu trước)", severity: "high" }),
    ]);
  });

  it("presentTask returns brief projection by default and full task with --full", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);

    const briefResult = (await WORKFLOW_HANDLERS.setTitle!(
      context(root, undefined, { setTitle: "Tiêu đề mới ngắn gọn" }),
    )) as Record<string, unknown>;

    expect(briefResult).toEqual({
      id: task.id,
      status: task.status,
      checkpoint: task.checkpoint,
      updatedAt: expect.any(String),
    });
    expect(briefResult.title).toBeUndefined();

    const fullResult = (await WORKFLOW_HANDLERS.setTitle!(
      context(root, undefined, { setTitle: "Tiêu đề mới đầy đủ", full: true }),
    )) as Record<string, unknown>;

    expect(fullResult.id).toBe(task.id);
    expect(fullResult.title).toBe("Tiêu đề mới đầy đủ");
    expect(fullResult.acceptanceCriteria).toBeDefined();
  });

  it("transition supports --reason and --note with Vietnamese UTF-8 for replan", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);

    const replanResult = (await WORKFLOW_HANDLERS.transition!(
      context(root, undefined, {
        transition: "in_progress/replan",
        reason: "Điều chỉnh yêu cầu nghiệp vụ theo quyết định kiến trúc mới",
        note: "Ghi chú tiến độ tiếng Việt",
      }),
    )) as { status: string; checkpoint: string };

    expect(replanResult.status).toBe("in_progress");
    expect(replanResult.checkpoint).toBe("replan");

    const persisted = (await loadPersistedTask(root, task.id)) as {
      checkpoint: string;
    };
    expect(persisted.checkpoint).toBe("replan");
  });

  it("handles resetBreaker action through WORKFLOW_HANDLERS", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    const resetResult = (await WORKFLOW_HANDLERS.resetBreaker!(
      context(root, undefined, {
        resetBreaker: "check",
        reason: "Reset circuit breaker cho check sau khi sửa lỗi",
        brief: true,
      }),
    )) as { status: string };

    expect(resetResult.status).toBe("in_progress");
  });
});
