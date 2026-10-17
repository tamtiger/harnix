# Implementation Plan: Chuẩn hóa cấu trúc 4 khối kỹ thuật cho PRD và mô hình Execution Slices cho Plan

## Execution Slices

### Slice 1: Template Generator Modules & Tests (`ac-1`, `ac-2`)
- [x] [check-templates] Viết unit tests kiểm thử hàm `renderPrdTemplate` (4 khối kỹ thuật) và `renderPlanTemplate` (Execution Slices & tag `[chk-id]`) trong `test/unit/core/workflow/artifact-templates.test.ts`.
- [x] [check-templates] Hiện thực module `src/core/workflow/artifact-templates.ts` sinh markdown cho PRD và Plan.

### Slice 2: Tự động khởi tạo Artifacts khi Init Full Task (`ac-4`)
- [x] [check-templates] Viết unit tests trong `test/unit/core/workflow/init-task.test.ts` đảm bảo `initTaskWorkflow` với `mode: "full"` tự động sinh `prd.md` và `plan.md`.
- [x] [check-templates] Cập nhật `src/core/workflow/init-task.ts` để ghi template artifacts khi `mode === "full"`.

### Slice 3: Nâng cấp Ready Gate Content & Artifact Validation (`ac-3`)
- [x] [check-templates] Nâng cấp `ready-content.ts` hỗ trợ nhận diện check id dạng `[check-id]` ở đầu checklist item.
- [x] [check-templates] Bổ sung hàm kiểm tra khuyến nghị (advisories) cho 4 khối của PRD và Execution Slices của Plan trong `ready-content.ts` và `ready-artifacts.ts`.
- [x] [check-templates] Bổ sung test cases trong `test/unit/core/workflow/ready-content.test.ts` và `test/unit/core/workflow/ready-artifacts.test.ts`.

### Slice 4: Bump Version & Full Verification
- [x] [check-suite] Chạy đồng bộ version `2.10.0-dev.2` bằng `pnpm version:sync`.
- [x] [check-suite] Chạy toàn bộ verify plan và test suite dự án để đảm bảo pass 100%.

## Verification Matrix
| Criterion | Check ID | Command | Scope | Status |
|---|---|---|---|---|
| ac-1, ac-2, ac-3, ac-4 | check-templates | `pnpm vitest run test/unit/core/workflow/artifact-templates.test.ts test/unit/core/workflow/ready-artifacts.test.ts test/unit/core/workflow/ready-content.test.ts test/unit/core/workflow/init-task.test.ts` | focused | Pending |
| ac-1, ac-2, ac-3, ac-4 | check-suite | `pnpm run test` | full | Pending |
