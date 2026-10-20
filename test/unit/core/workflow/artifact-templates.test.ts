import { describe, expect, it } from "vitest";
import { renderPlanTemplate, renderPrdTemplate } from "src/core/workflow/artifact-templates.js";
import { buildCheck, buildCriterion, buildTaskV3 } from "test/support/builders.js";

const sampleTask = buildTaskV3({
  id: "20261017-120000-sample-task",
  title: "Tích hợp tính năng mới",
  mode: "full",
  status: "planning",
  checkpoint: "planning",
  goal: "Xây dựng tính năng đồng bộ và lưu trữ dữ liệu an toàn",
  nonGoals: ["Hỗ trợ dịch vụ đám mây bên thứ ba"],
  acceptanceCriteria: [
    buildCriterion({ id: "ac-1", text: "Khởi tạo thành công kết nối" }),
    buildCriterion({ id: "ac-2", text: "Lưu trữ dữ liệu mã hóa" }),
  ],
  validationPlan: [
    buildCheck({
      id: "check-unit",
      description: "Kiểm thử đơn vị kết nối",
      scope: "focused",
      command: "pnpm test:unit",
      criterionIds: ["ac-1"],
      inputs: ["src/**"],
    }),
    buildCheck({
      id: "check-suite",
      description: "Toàn bộ test suite",
      scope: "full",
      command: "pnpm test",
      criterionIds: ["ac-1", "ac-2"],
      inputs: ["src/**", "test/**"],
    }),
  ],
  evidence: [],
  relevantPaths: ["src/index.ts"],
  relevantSpecs: ["docs/SPEC.md"],
});

describe("artifact-templates", () => {
  describe("renderPrdTemplate", () => {
    it("should render 4 core technical sections for PRD", () => {
      const prd = renderPrdTemplate(sampleTask);

      expect(prd).toContain("# PRD: Tích hợp tính năng mới");
      expect(prd).toContain("## 1. Context & Problem Statement");
      expect(prd).toContain("Xây dựng tính năng đồng bộ và lưu trữ dữ liệu an toàn");
      expect(prd).toContain("## 2. Scope & Boundaries");
      expect(prd).toContain("Hỗ trợ dịch vụ đám mây bên thứ ba");
      expect(prd).toContain("## 3. Anchored Acceptance Criteria");
      expect(prd).toContain("- **ac-1**: Khởi tạo thành công kết nối");
      expect(prd).toContain("- **ac-2**: Lưu trữ dữ liệu mã hóa");
      expect(prd).toContain("## 4. Architectural & Safety Constraints");
    });
  });

  describe("renderPlanTemplate", () => {
    it("should render Execution Slices with [check-id] tags and Verification Matrix", () => {
      const plan = renderPlanTemplate(sampleTask);

      expect(plan).toContain("# Implementation Plan: Tích hợp tính năng mới");
      expect(plan).toContain("## Execution Slices");
      expect(plan).toContain("- [ ] [check-unit]");
      expect(plan).toContain("- [ ] [check-suite]");
      expect(plan).toContain("## Verification Matrix");
      expect(plan).toContain("| ac-1 | check-unit | `pnpm test:unit` | focused |");
      expect(plan).toContain("| ac-1, ac-2 | check-suite | `pnpm test` | full |");
    });
  });
});

describe("artifact-templates stay neutral for any project", () => {
  it("never carries a rule that belongs to the Harnix repository itself", () => {
    const text = `${renderPrdTemplate(sampleTask)}\n${renderPlanTemplate(sampleTask)}`;

    for (const harnixOnly of ["300 LOC", "commands -> core", "giới hạn LOC"]) expect(text).not.toContain(harnixOnly);
    expect(text).toContain("AGENTS.md");
    expect(text).toContain(".harnix/spec/guides/");
  });

  it("keeps the section headings that the ready gate and the init flow read", () => {
    expect(renderPrdTemplate(sampleTask)).toContain("## 1. Context & Problem Statement");
    expect(renderPrdTemplate(sampleTask)).toContain("## 3. Anchored Acceptance Criteria");
    expect(renderPlanTemplate(sampleTask)).toContain("## Execution Slices");
    expect(renderPlanTemplate(sampleTask)).toContain("## Verification Matrix");
  });
});
