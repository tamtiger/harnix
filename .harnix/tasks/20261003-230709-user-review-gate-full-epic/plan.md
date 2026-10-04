# Plan: Bắt buộc user review trước khi chạy task Full hoặc Epic

## Implementation Checklist

- [x] Slice 1: Cập nhật tài liệu quy trình `docs/HARNIX_WORKFLOW.md` (Invariant 4 & mục 5.3 Ready gate).
- [x] Slice 2: Cập nhật template quy trình `src/templates/harnix/workflow.md` và `.harnix/workflow.md`.
- [x] Slice 3: Cập nhật kỹ năng lập kế hoạch `src/skills/harnix-plan/SKILL.md` và `references/epic.md`.
- [x] Slice 4: Cập nhật `AGENTS.md` và sửa test version `test/unit/version.test.ts`.
- [x] Slice 5: Chạy toàn bộ kiểm thử xác minh tập trung và kiểm thử tổng thể (suite gate).

## Slices chi tiết

### Slice 1: Cập nhật quy trình HARNIX_WORKFLOW.md
- File: `docs/HARNIX_WORKFLOW.md`
- Invariant 4: Phân tách rõ ràng rằng yêu cầu rõ ràng chỉ tự động cấp quyền triển khai cho task Lite; task Full và Epic bắt buộc dừng tại checkpoint `await` sau khi ready gate pass để user review.
- Mục 5.3 Ready gate: Khẳng định rằng với Full task hoặc Epic, dù yêu cầu ban đầu có chứa từ khóa triển khai, Agent luôn dừng ở `ready` (`nextStage: await`) và xuất trình bản review.

### Slice 2: Cập nhật workflow template
- Files: `src/templates/harnix/workflow.md`, `.harnix/workflow.md`
- Mục `## Route`: Cập nhật đoạn văn bản mô tả `nextStage: await` cho Full tasks và Epics.
- Đảm bảo 2 file đồng bộ chính xác.

### Slice 3: Cập nhật kỹ năng harnix-plan
- Files: `src/skills/harnix-plan/SKILL.md`, `src/skills/harnix-plan/references/epic.md`
- Trong `SKILL.md`:
  + Mục `## Start`: Ghi chú `await` là mandatory stop cho mọi Full task và Epic.
  + Mục `## Ready`: Yêu cầu xuất trình bản review (tóm tắt mục tiêu, quyết định, checklist) và dừng turn chờ phê duyệt trước khi implement.
  + Mục `## Exit`: Định rõ điểm dừng `await` cho Full/Epic.
- Trong `references/epic.md`:
  + Bước 4: Sau khi khởi tạo epic và toàn bộ member tasks, dừng turn xuất trình danh sách task và thứ tự thực thi để người dùng duyệt.

### Slice 4: Cập nhật AGENTS.md và test/unit/version.test.ts
- File: `AGENTS.md`
  + Bổ sung quy định rõ ràng về điểm dừng review bắt buộc cho Full task và Epic tại checkpoint `ready`.
- File: `test/unit/version.test.ts`
  + Cập nhật version mong đợi thành `2.0.1` để test suite xanh hoàn toàn.

### Slice 5: Verification & Gate
- Chạy `check-workflow-docs`: `pnpm vitest run test/workflow/docs-task-contract.test.ts test/workflow/templates.test.ts`
- Chạy `check-skills-budget`: `pnpm vitest run test/workflow/instruction-budget.test.ts test/workflow/skill-sources.test.ts test/unit/skills/catalog.test.ts`
- Chạy `check-suite`: `pnpm test`
