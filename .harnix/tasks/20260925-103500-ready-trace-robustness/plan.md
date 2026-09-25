# Implementation Plan: Core Robustness & Parser Flexibility

## Checklist

- [x] `S1` — Nới lỏng regex checklist trong ready-trace.ts
- [x] `S2` — Thêm unit test kiểm thử ký tự gạch nối
- [x] `S3` — Refactor tách helper từ internal-workflow.ts
- [x] `S4` — Bổ sung roadmapMembers vào save envelope và roadmap sync
- [x] `S5` — Chạy full test suite và verification

### Slice `S1`

Criteria: `ac-parser-dash-flexibility`
Checks: `check-parser-code`
Paths: `src/core/tasks/ready-trace.ts`

### Slice `S2`

Criteria: `ac-parser-unit-tests`
Checks: `check-parser-tests`
Paths: `src/core/tasks/ready-trace.ts`, `test/workflow/ready-trace.test.ts`

### Slice `S3`

Criteria: `ac-workflow-module-split`
Checks: `check-module-split`
Paths: `src/commands/internal-workflow.ts`, `src/core/tasks/workflow-helpers.ts`

### Slice `S4`

Criteria: `ac-roadmap-member-scaffolding`
Checks: `check-roadmap-scaffold`
Paths: `src/commands/internal-workflow.ts`, `test/workflow/internal-workflow-save.test.ts`, `test/workflow/internal-workflow.test.ts`

### Slice `S5`

Criteria: `ac-all-tests-green`
Checks: `check-build-and-tests`
Paths: `package.json`, `src/**/*.ts`, `test/**/*.ts`
