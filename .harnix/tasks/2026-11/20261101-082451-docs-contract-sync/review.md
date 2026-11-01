# Đồng bộ PRD, WORKFLOW, PLAN và README với hợp đồng thật

- **ID:** 20261101-082451-docs-contract-sync
- **Mode:** lite
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

Đóng E5/E6/R1/R3/R4/R5/R10: tài liệu frozen lệch code về envelope lỗi của hidden workflow, breaker, tiêu chí bất biến và cờ `status`.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `README.md`

## Acceptance criteria

- [ ] `ac-1` (pending): `HARNIX_PRD.md` mô tả hidden `workflow` phát envelope lỗi và chỉ `context` được miễn.
- [ ] `ac-2` (pending): Breaker và tiêu chí bất biến trong PRD, WORKFLOW, PLAN khớp `schema.ts` và `AGENTS.md` (digest mới, `--reset-breaker`, `--replace-check`, `--set-criterion --reason`).
- [ ] `ac-3` (pending): README liệt kê đủ cờ `status`; test docs và `pnpm test:gates` xanh.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
