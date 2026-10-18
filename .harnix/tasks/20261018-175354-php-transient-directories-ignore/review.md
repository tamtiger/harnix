# Tự động bỏ qua thư mục tạm, log và cache của PHP và CodeIgniter trong inputDigest

- **ID:** 20261018-175354-php-transient-directories-ignore
- **Mode:** full
- **Epic:** 20261018-175353-dx-robustness-and-php-resilience
- **Status:** completed/finishing
- **Created:** 2026-10-18 17:53:54 +07:00
- **Updated:** 2026-10-18 20:11:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Cập nhật transient-directories.ts để tự động bỏ qua logs, cache, application/logs, application/cache, writable, storage/logs khi tính inputDigest trong dự án PHP.

## Non-goals

- Không bỏ qua các file source code PHP trong application/models hay application/controllers.

## Relevant paths

- `src/core/verification/transient-directories.ts`
- `test/unit/core/verification/transient-directories.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Module transient-directories.ts tự động phát hiện dự án PHP và bỏ qua các thư mục log/cache/writable trong inputDigest.
- [x] `ac-2` (met): Unit test cho transient directories xác nhận các thay đổi trong thư mục log/cache không làm thay đổi inputDigest.
- [x] `ac-3` (met): Toàn bộ test gates pass 100%.

## Required checks

- [x] `check-transient-dirs` (focused): Unit test kiểm tra transient directories cho PHP/CodeIgniter — pass (2026-10-18 20:09:24 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-18 20:10:58 +07:00)
- [x] `check-gates` (focused): Kiểm tra test gates kiến trúc và contract — pass (2026-10-18 20:09:35 +07:00)

## Evidence

- `check-transient-dirs` — pass (2026-10-18 20:09:24 +07:00): pnpm test:unit test/unit/core/verification/transient-directories.test.ts — exit 0
- `check-gates` — pass (2026-10-18 20:09:35 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-18 20:10:58 +07:00): pnpm test — exit 0
