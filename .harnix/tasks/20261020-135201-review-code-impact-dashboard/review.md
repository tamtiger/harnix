# Sinh dashboard Code impact cho review.md từ Git chỉ đọc

- **ID:** 20261020-135201-review-code-impact-dashboard
- **Mode:** full
- **Epic:** 20261020-135200-harness-hardening-followups
- **Status:** completed/finishing
- **Created:** 2026-10-20 13:52:00 +07:00
- **Updated:** 2026-10-20 14:51:33 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Mục ## Code impact của review.md hiện có renderer nhưng không có nơi nào tính codeImpact; thêm bộ tính chỉ đọc từ Git (số dòng +/- và trạng thái từng file) để review.md của task đang làm hoặc đang verify hiển thị đúng.

## Relevant paths

- `README.md`
- `docs/HARNIX_PRD.md`
- `src/core/tasks/code-impact.ts`
- `src/core/tasks/task-review.ts`
- `src/core/tasks/task-store.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): review.md của task in_progress hoặc verifying có mục ## Code impact liệt kê file thay đổi so với HEAD (added, modified, deleted, untracked tính là added) với +/-, sắp xếp ổn định, giới hạn số file; ngoài Git hoặc không có thay đổi thì không có mục.
- [x] `ac-2` (met): Bộ tính chỉ đọc: chỉ chạy git --no-optional-locks status --porcelain=v2 -z và git --no-optional-locks diff --numstat -z HEAD bằng mảng đối số không shell, timeout ngắn; có allowlist chặn mọi lệnh con khác; tối đa 50 file kèm dòng tóm tắt phần bị cắt; đường dẫn tương đối POSIX, không có đường dẫn tuyệt đối; lỗi git hay thư mục ngoài Git thì bỏ qua mục, không làm hỏng việc lưu task.
- [x] `ac-3` (met): Chỉ tính khi task ở in_progress hoặc verifying trong saveTask (tiêm được bộ chạy git cho test); khi task completed thì giữ nguyên mục Code impact đã có trong review.md thay vì xóa; review.md vẫn là file dẫn xuất không nằm trong digest nên không làm stale evidence; không đổi schema TaskRecord.
- [x] `ac-4` (met): Toàn bộ test suite, lint, typecheck và test:gates của dự án pass; README và PRD mô tả mục Code impact.

## Required checks

- [x] `chk-focus` (focused): Test Code impact: bộ tính, review.md, scenario git thật — pass (2026-10-20 14:49:35 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 14:49:40 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 14:51:01 +07:00)

## Decisions

- **dec-1** — So với HEAD thay vì lưu baseline commit trong task để không đổi schema đóng băng; mục của task completed được giữ từ lần lưu cuối.
  - _Why:_ Hạn chế: commit giữa chừng làm task đang làm thấy ít thay đổi hơn.

## Evidence

- `chk-focus` — pass (2026-10-20 14:49:35 +07:00): pnpm exec vitest run test/unit/core/tasks/code-impact.test.ts test/unit/core/tasks/task-store.test.ts test/unit/core/tasks/task-review.test.ts test/integration/scenarios/review-code-impact.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-20 14:49:40 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-20 14:51:01 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
