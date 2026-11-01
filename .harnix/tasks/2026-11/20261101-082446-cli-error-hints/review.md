# Mọi lỗi CLI hay gặp đều có hint nêu lệnh đúng

- **ID:** 20261101-082446-cli-error-hints
- **Mode:** full
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** planning/planning
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 08:24:43 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/4 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Đóng nhóm B1/H1–H8,H12,H15: lỗi chỉ có `message`, cờ giá trị bắt buộc nuốt token kế tiếp, lệnh/option lạ không có hint, id epic không liệt kê id hợp lệ.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/cli-helpers.ts`
- `src/cli-hints.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-command.ts`
- `src/commands/epic.ts`

## Acceptance criteria

- [ ] `ac-1` (pending): Lỗi trong `workflow-flags.ts` (`--brief` không hỗ trợ, `--set-baseline`, `--format`, operands) kèm `hint` nêu lệnh hoặc cờ đúng trong JSON lỗi.
- [ ] `ac-2` (pending): Cờ giá trị bắt buộc không nuốt cờ kế tiếp (`--set-baseline --result pass` báo đúng nguyên nhân); lệnh lạ như `harnix facts` gợi ý `harnix update`.
- [ ] `ac-3` (pending): `No epic found`, `Repo map/Resume/Pause requires an initialized Harnix project` và `status` thừa đối số đều có hint và danh sách id/project hợp lệ.
- [ ] `ac-4` (pending): Test hợp đồng CLI và golden được cập nhật đúng chuỗi mới, `pnpm test:gates` xanh.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
