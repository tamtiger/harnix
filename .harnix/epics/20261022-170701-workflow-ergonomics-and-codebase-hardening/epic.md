# Epic: Tối ưu hóa trải nghiệm Task Workflow, khắc phục nợ kỹ thuật và gia cố Test Suite

Giải quyết dứt điểm các điểm nghẽn và nợ kỹ thuật: (1) Gia cố cấu trúc test, hạ nhiệt các file test sát trần 400 dòng, chuẩn hóa .gitattributes line endings và cô lập an toàn process.chdir(); (2) Cải tiến chẩn đoán stale check (chỉ rõ file lệch digest), cảnh báo sớm checklist plan.md, và hạ cyclomatic complexity của 3 hàm sát trần 19/20 trong core.

- **Cập nhật:** 2026-10-22 17:11:33 +07:00

## Non-goals

- Không thay đổi TaskRecord schema v3 đóng băng
- Không hạ ngưỡng coverage tiêu chuẩn (giữ vững >= 98.6% functions, >= 95% lines)
- Không tự động commit hay push Git mà không có lệnh người dùng

## Next task

- `20261022-170922-test-structure-line-endings-and-vitest-isolation` — Gia cố Test Suite Structure, Line Endings và Vitest Isolation (`planning`)

## Members (2 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261022-170922-test-structure-line-endings-and-vitest-isolation` | Gia cố Test Suite Structure, Line Endings và Vitest Isolation | `lite` | `planning` |
| 2 | `20261022-171114-stale-check-diagnostics-and-complexity-reduction` | Cải tiến chẩn đoán Stale Check và Hạ Cyclomatic Complexity | `lite` | `planning` |

## Task Overview & Scope

### 1. `20261022-170922-test-structure-line-endings-and-vitest-isolation` — Gia cố Test Suite Structure, Line Endings và Vitest Isolation

- **Trạng thái:** `planning`
- **Mục tiêu:** Cải tiến logic đếm dòng trong test-structure.test.ts (đếm lines of code thực tế thay vì tính dòng trống/comment) hoặc trích xuất helpers sang test/support/, hạ nhiệt 19 file test sát trần 400 dòng; bổ sung .gitattributes và đồng bộ Prettier LF; cố định pool: 'forks' trong vitest.config.ts và bổ sung describe.sequential cho các test dùng process.chdir().
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261022-171114-stale-check-diagnostics-and-complexity-reduction` — Cải tiến chẩn đoán Stale Check và Hạ Cyclomatic Complexity

- **Trạng thái:** `planning`
- **Mục tiêu:** Bổ sung danh sách file cụ thể bị thay đổi khi audit phát hiện digest-mismatch; thêm cảnh báo checklist plan.md chưa hoàn tất tại workflow --transition verifying/verifying; refactor 3 hàm có complexity 19 (validateTaskArtifacts, mergeCheck, transitionWorkflow) xuống dưới 15.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
