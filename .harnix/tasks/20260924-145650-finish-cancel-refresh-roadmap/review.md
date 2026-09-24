# Refresh roadmap markdown khi finish hoặc cancel task có epicId

- **ID:** 20260924-145650-finish-cancel-refresh-roadmap
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-24T14:56:50+07:00
- **Updated:** 2026-09-24T08:07:44.354Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

finishWorkflowTask và cancelWorkflowTask trong src/core/workflow.ts gọi saveTask trực tiếp, bỏ qua logic regenerate roadmap markdown chỉ tồn tại trong saveWorkflowLocked (src/commands/internal-workflow.ts). Kết quả: .harnix/roadmaps/<epic-id>.md không bao giờ phản ánh đúng status completed/cancelled cuối cùng của task, dù trạng thái trong task.json đã đúng. Sửa bằng cách thêm bước refresh roadmap markdown sau khi finishWorkflow/cancelWorkflow (public wrapper trong internal-workflow.ts) gọi xong core finish/cancel, tái sử dụng loadEpicRecord+renderRoadmapMarkdown đã có.

## Non-goals

- Không đổi TaskRecord schema, EvidenceRecordV2, hay bất kỳ frozen contract nào khác.
- Không đổi hành vi finish/cancel cho task không có epicId.
- Không thêm severity structured vào EvidenceRecordV2 (thuộc task Full riêng, cùng epic).

## Acceptance criteria

- `finish-refreshes-roadmap` (met): harnix workflow --finish khi active task có epicId sẽ regenerate .harnix/roadmaps/<epic-id>.md phản ánh đúng status completed cuối cùng của task đó, load lại epic record đầy đủ (title/goal không bị mất, không fallback về bare ID).
- `cancel-refreshes-roadmap` (met): harnix workflow --cancel khi active task có epicId sẽ regenerate .harnix/roadmaps/<epic-id>.md phản ánh đúng status cancelled cuối cùng của task đó.
- `no-epicid-unaffected` (met): Task không có epicId: finish/cancel hành vi và output không đổi so với trước; không có lỗi hay side-effect roadmap nào phát sinh.
- `regression-safe` (met): Toàn bộ test hiện có trong test/workflow/internal-workflow.test.ts và test/workflow/internal-workflow-save.test.ts vẫn pass; test:workflow tổng thể không regression.

## Required checks

- `chk-finish-refresh-unit` (focused): Test: finishWorkflow voi task co epicId regenerate dung .md voi status completed va epic title/goal day du. — pass (2026-09-24T15:05:32+07:00)
- `chk-cancel-refresh-unit` (focused): Test: cancelWorkflow voi task co epicId regenerate dung .md voi status cancelled. — pass (2026-09-24T15:05:32+07:00)
- `chk-no-epicid-regression` (focused): Test: task khong co epicId, finish/cancel khong doi hanh vi/output. — pass (2026-09-24T15:05:32+07:00)
- `chk-workflow-full-regression` (full): Toan bo test:workflow pass sau thay doi. — pass (2026-09-24T15:05:32+07:00)

## Decisions

- **roadmap-md-format-count-header-no-next-task** — Theo yeu cau nguoi dung, doi header bang Members trong roadmap markdown thanh "## Members (N tasks)" de ro day la danh sach day du, va bo dong "**Next task:**"/"**All tasks completed or cancelled.**" o cuoi (field nextTask trong JSON cua public command harnix roadmap --id khong doi, van con day du).
  - _Why:_ Nguoi dung thay dinh dang cu (bang + dong Next task) de gay hieu nham la chi hien thi task hien tai + task ke tiep thay vi toan bo danh sach; header co so luong ro rang hon.

## Evidence

- `chk-finish-refresh-unit` — pass (2026-09-24T15:05:32+07:00): finishWorkflow voi task co epicId regenerate dung .md voi status completed va epic title/goal day du - test moi pass.
- `chk-cancel-refresh-unit` — pass (2026-09-24T15:05:32+07:00): cancelWorkflow voi task co epicId regenerate dung .md voi status cancelled - test moi pass.
- `chk-no-epicid-regression` — pass (2026-09-24T15:05:32+07:00): Task khong epicId: finish/cancel khong doi hanh vi, khong tao thu muc roadmaps - test moi pass.
- `chk-workflow-full-regression` — pass (2026-09-24T15:05:32+07:00): test:workflow 10/10 files (123 tests) pass sau thay doi finish/cancel refresh + doi format markdown (bo Next task line, them header count).
