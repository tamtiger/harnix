# Epic: Tối ưu hóa trải nghiệm Task Workflow, khắc phục nợ kỹ thuật và gia cố toàn diện Test Suite

Giải quyết triệt để 100% các vấn đề phát hiện từ kiểm toán toàn diện: (1) Gia cố hạ tầng test: chuẩn hóa .gitattributes và Prettier eol=lf, cải tiến logic đếm dòng trong test-structure.test.ts (đếm LOC thực tế) để hạ nhiệt 19 file test sát trần 400 dòng, cố định pool: 'forks' và bao phủ describe.sequential cho toàn bộ 26 integration test files có gọi process.chdir(); (2) Cải tiến Workflow Ergonomics & Complexity: bổ sung danh sách file thay đổi khi phát hiện digest-mismatch, thêm cảnh báo checklist plan.md chưa hoàn tất tại workflow transition verifying, và refactor hạ Cyclomatic Complexity cho toàn bộ nhóm 7 hàm chạm trần 20 và các hàm chạm trần 19 trong codebase.

- **Cập nhật:** 2026-10-22 21:30:24 +07:00

## Non-goals

- Không thay đổi TaskRecord schema v3 đóng băng
- Không hạ ngưỡng coverage tiêu chuẩn (>= 98.6% functions, >= 95% lines)
- Không tự động commit hay push Git mà không có lệnh người dùng

## Next task

Không còn task nào chưa hoàn tất.

## Members (2 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261022-213025-test-structure-line-endings-and-vitest-isolation` | Gia cố Test Suite Structure, Line Endings và Vitest Concurrency Isolation | `lite` | `completed` |
| 2 | `20261022-213026-stale-check-diagnostics-and-complexity-reduction` | Cải tiến chẩn đoán Stale Check và Hạ Cyclomatic Complexity Toàn diện | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261022-213025-test-structure-line-endings-and-vitest-isolation` — Gia cố Test Suite Structure, Line Endings và Vitest Concurrency Isolation

- **Trạng thái:** `completed`
- **Mục tiêu:** Cải tiến logic đếm dòng trong test-structure.test.ts đếm lines of code thực tế (bỏ qua dòng trống và comments tương tự architecture.test.ts), hạ nhiệt 19 file test sát trần 400 dòng; bổ sung file .gitattributes eol=lf và Prettier endOfLine='lf' chấm dứt lỗi format trên Windows; cố định pool: 'forks' trong vitest.config.ts và bổ sung describe.sequential cho toàn bộ 26 test files có gọi process.chdir().
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261022-213026-stale-check-diagnostics-and-complexity-reduction` — Cải tiến chẩn đoán Stale Check và Hạ Cyclomatic Complexity Toàn diện

- **Trạng thái:** `completed`
- **Mục tiêu:** Nâng cấp chẩn đoán digest-mismatch trong status --explain và kết quả audit/completion để liệt kê chi tiết các file cụ thể bị thay đổi hash; thêm cảnh báo checklist plan.md chưa hoàn tất tại workflow --transition verifying/verifying; refactor hạ Cyclomatic Complexity cho toàn bộ 7 hàm chạm trần 20 và các hàm chạm trần 19 xuống dưới 15.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
