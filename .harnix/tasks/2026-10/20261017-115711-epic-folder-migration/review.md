# Nhóm Epic vào folder riêng và xây dựng bộ di chuyển dữ liệu tương thích ngược

- **ID:** 20261017-115711-epic-folder-migration
- **Mode:** full
- **Epic:** 20261017-115711-refactor-artifacts-and-epics
- **Status:** completed/finishing
- **Created:** 2026-10-17 11:57:11 +07:00
- **Updated:** 2026-10-17 13:18:52 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Chuyển đổi lưu trữ Epic từ file phẳng sang folder .harnix/epics/<id>/epic.json và epic.md; cập nhật src/core/epics/migrate.ts và epic.ts để tự động di chuyển idempotent và duy trì đọc fallback 100%.

## Non-goals

- Không làm mất dữ liệu các file epic phẳng cũ trong quá trình di chuyển.
- Không thay đổi schema của EpicRecord v1.

## Relevant paths

- `src/core/epics/epic.ts`
- `src/core/epics/migrate.ts`
- `src/core/epics/order.ts`
- `test/unit/core/epics/epic.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Epic mới được tạo và cập nhật vào thư mục .harnix/epics/<id>/epic.json và epic.md
- [x] `ac-2` (met): Module migrate.ts tự động chuyển đổi an toàn các file phẳng cũ sang cấu trúc folder mới (idempotent)
- [x] `ac-3` (met): Hệ thống đọc hỗ trợ cơ chế fallback an toàn: ưu tiên đọc folder mới, fallback về file phẳng cũ

## Required checks

- [x] `check-epic-unit` (focused): Toàn bộ unit test cho epics và migrate pass — pass (2026-10-17 13:14:19 +07:00)
- [x] `check-full-suite` (full): Toan bo test suite cua du an phai xanh — pass (2026-10-17 13:18:45 +07:00)

## Evidence

- `check-epic-unit` — pass (2026-10-17 13:14:19 +07:00): pnpm test:unit test/unit/core/epics — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-17 13:10:29 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-17 13:12:14 +07:00): Task contract revised at persisted replan: Cap nhat check suite voi input bao gom package.json sau khi da fix xong cac test ENOENT
- `check-full-suite` — pass (2026-10-17 13:18:45 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
