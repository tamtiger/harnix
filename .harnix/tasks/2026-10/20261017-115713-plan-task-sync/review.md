# Xây dựng cơ chế tự động đồng bộ hai chiều giữa Plan checklist và Task state

- **ID:** 20261017-115713-plan-task-sync
- **Mode:** full
- **Epic:** 20261017-115711-refactor-artifacts-and-epics
- **Status:** completed/finishing
- **Created:** 2026-10-17 11:57:13 +07:00
- **Updated:** 2026-10-17 13:39:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Khi một validation check pass qua lệnh --run-check hoặc --evidence, harness tự động tìm checklist item có tag [chk-id] trong plan.md và chuyển thành [x] [chk-id]; ngăn chặn triệt để tình trạng lệch pha state.

## Relevant paths

- `src/core/workflow/plan-edit.ts`
- `src/core/workflow/run-check.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Lệnh --run-check tự động chuyển [ ] thành [x] trong plan.md khi pass
- [x] `ac-2` (met): Ghi nhan evidence pass qua --evidence cung tu dong dong bo checklist trong plan.md
- [x] `ac-3` (met): Bao toan nguyen ven cac checklist items khac va bo qua an toan khi khong tim thay plan.md

## Required checks

- [x] `check-suite` (full): Toan bo test suite cua du an phai xanh — pass (2026-10-17 13:38:40 +07:00)
- [x] `check-sync` (focused): Kiem thu unit cho co che tu dong dong bo plan checklist — pass (2026-10-17 13:37:27 +07:00)

## Evidence

- `check-sync` — pass (2026-10-17 13:37:27 +07:00): pnpm vitest run test/unit/core/workflow/plan-sync.test.ts test/unit/core/workflow/run-check.test.ts test/unit/core/workflow/evidence-flags.test.ts — exit 0
- `check-suite` — pass (2026-10-17 13:38:40 +07:00): pnpm test — exit 0
