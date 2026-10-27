# Plan - Hoàn thiện nội dung review.md và đưa vào workflow canonical

## Implementation checklist

- [ ] `S1-CONTENT` — RED rồi thêm required checks/timestamp/artifacts vào renderTaskReview.
- [ ] `S2-WORKFLOW-WIRING` — RED rồi thêm review.md vào workflowTemplate và AGENTS template.
- [ ] `S3-SKILL-WIRING` — RED rồi thêm mô tả review.md vào harnix-finish-work và harnix-brainstorm.
- [ ] `S4-RELEASE` — Bump patch version, chạy exact acceptance sequence.

### Slice `S1-CONTENT`

Criteria: `ac-review-md-required-checks`, `ac-review-md-metadata`
Checks: `focused-review-content`
Paths: `src/core/tasks/task.ts`, `test/unit/task-state.test.ts`

RED: task có validationPlan với một check chưa có evidence và một check đã pass -> review.md phải hiện cả hai đúng trạng thái; task có prd.md/plan.md trên đĩa -> Artifacts liệt kê đúng; không có design.md -> không nhắc design.md. GREEN: implement.

### Slice `S2-WORKFLOW-WIRING`

Criteria: `ac-workflow-canonical-wiring`
Checks: `focused-template-wiring`
Paths: `src/templates/harnix/workflow.ts`, `src/templates/harnix/agents.ts`, `test/workflow/templates.test.ts`

RED: init một project mới rồi assert AGENTS.md/workflow.md sinh ra chứa "review.md". GREEN: thêm đoạn mô tả.

### Slice `S3-SKILL-WIRING`

Criteria: `ac-skill-wiring`
Checks: `focused-template-wiring`
Paths: `src/skills/harnix-finish-work/SKILL.md`, `src/skills/harnix-brainstorm/SKILL.md`, `test/workflow/skill-sources.test.ts`

RED: needle assertion "review.md" trong hai skill. GREEN: thêm câu ngắn.

### Slice `S4-RELEASE`

Criteria: `ac-release-readiness`
Checks: `release-gate`
Paths: `CHANGELOG.md`, `package.json`

Bump patch version một lần, chạy exact acceptance sequence.

<!-- harnix:execution-notes:begin -->
<!-- harnix:execution-notes:end -->
