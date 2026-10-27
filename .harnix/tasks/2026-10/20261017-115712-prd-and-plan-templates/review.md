# Chuẩn hóa cấu trúc 4 khối kỹ thuật cho PRD và mô hình Execution Slices cho Plan

- **ID:** 20261017-115712-prd-and-plan-templates
- **Mode:** full
- **Epic:** 20261017-115711-refactor-artifacts-and-epics
- **Status:** completed/finishing
- **Created:** 2026-10-17 11:57:12 +07:00
- **Updated:** 2026-10-17 13:33:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Cập nhật template khởi tạo và cơ chế validation tại ready gate cho PRD (Context, Boundaries, Anchored AC, Constraints) và Plan (TDD Slices với tag [chk-id]); cập nhật ready-artifacts.ts và init-spec.ts.

## Relevant paths

- `src/core/workflow/init-spec.ts`
- `src/core/workflow/ready-artifacts.ts`
- `src/core/workflow/ready-content.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Template khởi tạo PRD tuân theo cấu trúc 4 khối kỹ thuật
- [x] `ac-2` (met): Template khoi tao Plan ho tro Execution Slices va tag lien ket check-id ([chk-id])
- [x] `ac-3` (met): Co che validation tai ready gate kiem tra cau truc 4 khoi cua PRD, Execution Slices cua Plan va ho tro tag [chk-id]
- [x] `ac-4` (met): Init task o mode full tu dong sinh file prd.md va plan.md theo template chuan

## Required checks

- [x] `check-suite` (full): Toan bo test suite cua du an phai xanh — pass (2026-10-17 13:32:43 +07:00)
- [x] `check-templates` (focused): Kiem thu unit cho template PRD/Plan va validation ready — pass (2026-10-17 13:31:28 +07:00)

## Evidence

- `check-templates` — pass (2026-10-17 13:31:28 +07:00): pnpm vitest run test/unit/core/workflow/artifact-templates.test.ts test/unit/core/workflow/ready-artifacts.test.ts test/unit/core/workflow/ready-content.test.ts test/unit/core/workflow/init-task.te... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-17 13:32:43 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
