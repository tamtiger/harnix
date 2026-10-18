# Chẩn đoán lỗi validation chi tiết và tách biệt thao tác Epic độc lập

- **ID:** 20261018-175400-dx-error-diagnostics-and-epic-decoupling
- **Mode:** full
- **Epic:** 20261018-175353-dx-robustness-and-php-resilience
- **Status:** completed/finishing
- **Created:** 2026-10-18 17:54:00 +07:00
- **Updated:** 2026-10-18 21:47:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Tách biệt thông báo lỗi chi tiết cho task validation (id, mode, status, checkpoint hợp lệ); chuẩn hóa cwd giữa --set-check và --save; cho phép khởi tạo task thành viên mà không cướp active pointer.

## Non-goals

- Không nới lỏng các quy tắc an toàn của schema TaskRecord v3.

## Relevant paths

- `src/core/tasks/task-validate.ts`
- `src/core/workflow/save.ts`
- `src/core/workflow/epic-members.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Lỗi assertIdentity trong task-validate.ts chỉ rõ cụ thể trường nào không hợp lệ (id, mode, status hay checkpoint) kèm danh sách giá trị hợp lệ.
- [x] `ac-2` (met): Chuẩn hóa thuộc tính cwd trong kiểm tra obligation để tránh báo nhầm thay đổi hợp đồng, và hỗ trợ khởi tạo member task không đổi active pointer.
- [x] `ac-3` (met): Toàn bộ unit test và test gates pass 100%.
- [x] `ac-4` (met): Bổ sung cờ --brief cho lệnh harnix resume và hỗ trợ phân tách danh sách dấu phẩy cho --criterion.
- [x] `ac-5` (met): Đồng bộ toàn bộ tài liệu dự án: AGENTS.md, activation.ts, workflow templates, skills, README.md và thực hiện fold dev changelog đóng Epic.

## Required checks

- [x] `check-dx-diagnostics` (focused): Unit test kiểm tra thông báo lỗi chi tiết, cwd normalization, resume --brief và criteria list — pass (2026-10-18 21:46:34 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-18 21:45:44 +07:00)

## Evidence

- `check-dx-diagnostics` — pass (2026-10-18 21:46:34 +07:00): pnpm test:unit test/unit/core/tasks/task-validate.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-18 21:45:44 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
