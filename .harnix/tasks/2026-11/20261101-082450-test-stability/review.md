# Ổn định test song song và cô lập mock

- **ID:** 20261101-082450-test-stability
- **Mode:** lite
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** planning/planning
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 08:24:43 +07:00

**Verdict:** PENDING — 0/2 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/2 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Đóng B7/E2: test 6 writer chập chờn khi tải cao, `isolate: false` không ép `restoreMocks`.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `vitest.config.ts`
- `src/core/tasks/read-tracker.ts`

## Acceptance criteria

- [ ] `ac-1` (pending): Test ghi song song không còn chập chờn qua 20 lần chạy liên tiếp (tăng retry hoặc backoff, hoặc giảm writer, có lý do).
- [ ] `ac-2` (pending): `vitest.config.ts` bật `restoreMocks` mà không hạ ngưỡng coverage.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
