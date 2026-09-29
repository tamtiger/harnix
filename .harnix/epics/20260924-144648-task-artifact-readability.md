# Epic: Cải thiện khả năng đọc của task artifacts

Giảm văn xuôi tự do và trùng lặp trong task.json/prd.md/plan.md/review.md: tách rõ AC↔evidence qua dòng Verifies:, What/How trong mỗi Slice, quy ước Command→Result→Note cho evidence summary, ADR-lite cho design.md, dòng Verdict và gộp evidence rerun trùng lặp trong review.md, và severity structured trên EvidenceRecordV2 khi cần.

- **Cập nhật:** 2026-09-24 14:46:48 +07:00

## Non-goals

- Không retrofit prd.md/plan.md của task cũ đã completed/cancelled.
- Không đổi frozen ready-trace grammar v1 hiện có.

## Next task

Không còn task nào chưa hoàn tất.

## Members (3 tasks)

| # | Task ID | Title | Status |
|---|---------|-------|--------|
| 1 | `20260924-144648-review-md-verdict-and-dedupe` | Thêm dòng Verdict và gộp evidence rerun trùng lặp trong review.md | `completed` |
| 2 | `20260924-145650-finish-cancel-refresh-roadmap` | Refresh roadmap markdown khi finish hoặc cancel task có epicId | `completed` |
| 3 | `20260924-151442-evidence-findings-severity` | Structured findings với severity trên EvidenceRecordV2 | `completed` |

## Task Overview & Scope

### 1. `20260924-144648-review-md-verdict-and-dedupe` — Thêm dòng Verdict và gộp evidence rerun trùng lặp trong review.md

- **Trạng thái:** `completed`
- **Mục tiêu:** Cải thiện renderTaskReview trong src/core/tasks/task.ts: thêm dòng Verdict tóm tắt trạng thái tổng quan ngay sau header block, và gộp evidence cùng checkId trong mục Evidence để chỉ hiển thị lần chạy mới nhất kèm ghi chú số lần rerun trước đó, giúp reviewer không phải đọc hết file mới biết task pass hay chưa.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20260924-145650-finish-cancel-refresh-roadmap` — Refresh roadmap markdown khi finish hoặc cancel task có epicId

- **Trạng thái:** `completed`
- **Mục tiêu:** finishWorkflowTask và cancelWorkflowTask trong src/core/workflow.ts gọi saveTask trực tiếp, bỏ qua logic regenerate roadmap markdown chỉ tồn tại trong saveWorkflowLocked (src/commands/internal-workflow.ts). Kết quả: .harnix/roadmaps/<epic-id>.md không bao giờ phản ánh đúng status completed/cancelled cuối cùng của task, dù trạng thái trong task.json đã đúng. Sửa bằng cách thêm bước refresh roadmap markdown sau khi finishWorkflow/cancelWorkflow (public wrapper trong internal-workflow.ts) gọi xong core finish/cancel, tái sử dụng loadEpicRecord+renderRoadmapMarkdown đã có.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20260924-151442-evidence-findings-severity` — Structured findings với severity trên EvidenceRecordV2

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm optional field findings[] có severity máy đọc được vào EvidenceRecordV2, cho phép Stage-2 review lọc/ưu tiên theo mức độ nghiêm trọng thay vì chỉ có summary văn xuôi tự do. Chạm frozen contract IMPLEMENTATION_PLAN.md mục 4.3, cần update đồng thời workflow/PRD/validator/test.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
