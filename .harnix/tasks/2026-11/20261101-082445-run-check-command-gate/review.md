# Chặn --run-check ghi pass khi check không khai command và làm save epic idempotent

- **ID:** 20261101-082445-run-check-command-gate
- **Mode:** full
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** planning/planning
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 08:24:43 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Đóng khe hở A5/R1 (check không khai `command` vẫn nhận argv bất kỳ) và R7 (save epic lỗi giữa chừng để lại trạng thái dở).

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/core/workflow/run-check.ts`
- `src/core/workflow/save.ts`
- `src/core/workflow/epic-members.ts`

## Acceptance criteria

- [ ] `ac-1` (pending): `--run-check` từ chối ghi pass khi check bắt buộc không khai `command` hoặc argv khác lệnh đã khai, thông báo in lệnh đã khai và gợi ý `status --checks`/`--set-check --command`.
- [ ] `ac-2` (pending): `--save` có `epic`/`epicMembers` lỗi sau khi ghi task có thể chạy lại idempotent hoặc `doctor` báo finding có fixture.
- [ ] `ac-3` (pending): Có test hồi quy cho cả hai và gate `pnpm test:gates` xanh.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
