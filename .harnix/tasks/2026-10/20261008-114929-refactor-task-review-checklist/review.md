# Refactor trang review task: hiển thị tổng thể tiến độ và checklist trực quan

- **ID:** 20261008-114929-refactor-task-review-checklist
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-08 11:49:29 +07:00
- **Updated:** 2026-10-08 12:04:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Cải tiến trang review.md để thể hiện rõ nét tổng thể task: bổ sung bảng tổng quan tiến độ (Scorecard), hiển thị phạm vi tác động (relevantPaths/specs), định dạng checklist rõ ràng cho criteria và checks mà không dùng icon.

## Relevant paths

- `src/core/tasks/task-review.ts`
- `test/unit/core/tasks/task-review.test.ts`

## Acceptance criteria

- [x] `ac-1` (met): task-review.ts hiển thị bảng tổng quan tiến độ (Scorecard) phản ánh tỷ lệ hoàn thành tiêu chí, kiểm thử, rủi ro tồn đọng.
- [x] `ac-2` (met): task-review.ts hiển thị phạm vi tác động (Scope & Relevant paths/specs) khi task có relevantPaths hoặc relevantSpecs.
- [x] `ac-3` (met): task-review.ts định dạng Acceptance criteria và Required checks theo dạng markdown checklist (- [x] / - [ ]) không dùng icon/emoji, giữ nguyên 100% khả năng tương thích với các test case hiện tại.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-08 12:04:02 +07:00)
- [x] `check-review` (focused): Unit test cho trang review.md — pass (2026-10-08 12:02:59 +07:00)

## Decisions

- **d-human-review** — Trang review.md dùng định dạng checklist markdown và bảng Summary tổng thể, không dùng icon hay emoji
  - _Why:_ Tối ưu khả năng đọc của con người, tương thích tốt với mọi trình render markdown và đáp ứng đúng yêu cầu của người dùng
- **d-check** — Kiem tra render moi
  - _Why:_ Xac nhan file review.md duoc sinh tu ban build moi

## Evidence

- `check-review` — pass (2026-10-08 12:02:59 +07:00): pnpm exec vitest run test/unit/core/tasks/task-review.test.ts — exit 0
- `check-suite` — pass (2026-10-08 12:04:02 +07:00): pnpm test — exit 0
