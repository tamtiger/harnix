import type { TaskRecordV3 } from "src/core/tasks/task.js";

/**
 * Sinh nội dung template PRD chuẩn 4 khối kỹ thuật:
 * 1. Context & Problem Statement
 * 2. Scope & Boundaries
 * 3. Anchored Acceptance Criteria
 * 4. Architectural & Safety Constraints
 */
export function renderPrdTemplate(task: TaskRecordV3): string {
  const nonGoalsList =
    task.nonGoals && task.nonGoals.length > 0
      ? task.nonGoals.map((ng) => `  - ${ng}`).join("\n")
      : "  - (Chưa có non-goals bổ sung)";

  const criteriaList =
    task.acceptanceCriteria.length > 0
      ? task.acceptanceCriteria.map((ac) => `- **${ac.id}**: ${ac.text}`).join("\n")
      : "- **ac-1**: Tiêu chí hoàn thành mục tiêu";

  return `# PRD: ${task.title}

## 1. Context & Problem Statement
${task.goal || task.title}

## 2. Scope & Boundaries
- **In-Scope**:
  - ${task.title}
- **Out-of-Scope (Non-Goals)**:
${nonGoalsList}

## 3. Anchored Acceptance Criteria
${criteriaList}

## 4. Architectural & Safety Constraints
- Bảo đảm ranh giới kiến trúc và tính toàn vẹn của mã nguồn.
- Giữ vững các invariant hiện tại, tuân thủ TDD và phòng ngừa hồi quy (regression).
- Mọi thay đổi tuân thủ quy tắc giới hạn LOC và không để lọt rò rỉ bảo mật.
`;
}

/**
 * Sinh nội dung template Plan với mô hình Execution Slices và tag liên kết check-id:
 * - Execution Slices kèm tag `- [ ] [chk-id]`
 * - Bảng Verification Matrix
 */
export function renderPlanTemplate(task: TaskRecordV3): string {
  const checkItems =
    task.validationPlan.length > 0
      ? task.validationPlan
          .map(
            (chk) =>
              `- [ ] [${chk.id}] ${chk.description || chk.id} (Lệnh: \`${chk.command || "pnpm test"}\`)`,
          )
          .join("\n")
      : "- [ ] [check-1] Triển khai mã nguồn và kiểm chứng";

  const matrixRows =
    task.validationPlan.length > 0
      ? task.validationPlan
          .map(
            (chk) =>
              `| ${chk.criterionIds.join(", ") || "-"} | ${chk.id} | \`${chk.command || "-"}\` | ${chk.scope} |`,
          )
          .join("\n")
      : "| ac-1 | check-1 | `pnpm test` | focused |";

  return `# Implementation Plan: ${task.title}

## Execution Slices

### Slice 1: Implementation & Verification
${checkItems}

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
${matrixRows}
`;
}
