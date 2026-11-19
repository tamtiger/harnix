import { describe, expect, it } from "vitest";
import { preflightWorkflow } from "src/core/workflow/preflight.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function suggestionsFor(title: string, goal: string, criterionText: string): Promise<string[]> {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  const base = taskV3("planning", "planning");
  const task = {
    ...base,
    title,
    goal,
    acceptanceCriteria: base.acceptanceCriteria.map((criterion) => ({ ...criterion, text: criterionText })),
  };
  await saveWorkflow(root, { task });
  return (await preflightWorkflow(root, Date.now())).suggestedTechniques ?? [];
}

describe("preflight harnix-exercise suggestion", () => {
  it.each([
    ["an API endpoint", "Thêm endpoint GET /orders"],
    ["a CLI", "Add a new CLI command to export data"],
    ["a browser UI", "Màn hình đăng nhập chạy trên browser"],
    ["a command line in Vietnamese", "Lệnh trên dòng lệnh in ra danh sách"],
  ])("suggests it when a criterion mentions %s", async (_label, text) => {
    expect(await suggestionsFor("Cập nhật tính năng", "Hoàn thiện hành vi", text)).toContain("harnix-exercise");
  });

  it("does not suggest it for words that merely contain the keywords", async () => {
    const suggestions = await suggestionsFor("Click handler", "Client library cleanup", "Rename a private helper");
    expect(suggestions).not.toContain("harnix-exercise");
  });
});
