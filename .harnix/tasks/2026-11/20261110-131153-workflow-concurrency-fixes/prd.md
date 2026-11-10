# PRD: Sửa tranh chấp khóa và mất cập nhật trong workflow

## Context & Problem Statement

Review phát hiện năm lỗi về đồng thời và trạng thái cục bộ trong lõi workflow: (1) `withWorkflowLock` đặt khóa trong `tmpdir()` theo băm của đường dẫn thô, nên hai tiến trình có TMP khác nhau hoặc cùng repo mở bằng hai cách viết đường dẫn dùng hai khóa khác nhau và `--save`, `--finish`, `--cancel` không còn loại trừ nhau; (2) `tickWorkflow` và `syncPlanChecklistPass` đọc rồi ghi `plan.md` ngoài khóa nên một `--save` chạy xen có thể bị ghi đè; (3) `upsertEpic` ghi đè toàn bộ `epic.json`, xóa `order` do `--epic-order` đặt và viết lại `createdAt`; (4) `pause` và `resume` đổi con trỏ `.active` mà không giữ khóa; (5) `TEST_FILE_PATTERN` là regex toàn cục dùng với `.test()` nên cảnh báo thiếu file test mất không ổn định, regex checklist của cổng `verifying` chỉ nhận bullet `-`, và `run-checks` bỏ qua `now` đã tiêm.

## Scope & Boundaries

- Trong phạm vi: `src/core/workflow/`, `src/core/tasks/task-resume.ts`, `src/core/epics/epic.ts`, `src/commands/pause.ts`, `src/commands/resume.ts` và test tương ứng.
- Ngoài phạm vi: schema TaskRecord v3, enum, transition, định dạng `epic.json`.

## Anchored Acceptance Criteria

- ac-1: khóa workflow nằm trong dự án, hai cách viết đường dẫn dùng chung một khóa.
- ac-2: ghi `plan.md` dưới khóa, không lồng khóa.
- ac-3: `upsertEpic` giữ `order` và `createdAt` hiện có.
- ac-4: `pause` và `resume` chạy dưới khóa.
- ac-5: regex không còn trạng thái, regex checklist dùng chung, `now` được tiêm.

## Architectural & Safety Constraints

Tuân theo `AGENTS.md` và `.harnix/spec/guides/`: ghi nguyên tử bảo toàn quyền, khóa không re-entrant, `core` không phụ thuộc Commander, lock nằm dưới `.harnix/tmp` đã git-ignore.
