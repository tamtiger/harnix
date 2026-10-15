# Mở rộng nhận diện glob source trong ready gate, báo lỗi batch và chuẩn hoá tài liệu

- **ID:** 20261015-213327-fix-ready-gate-glob-inputs-and-docs
- **Mode:** full
- **Epic:** 20261015-213325-harnix-dx-workflow-friction-reduction
- **Status:** completed/finishing
- **Created:** 2026-10-15 21:33:25 +07:00
- **Updated:** 2026-10-15 23:25:29 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Mở rộng coversSource cho các thư mục source phổ biến, gom toàn bộ lỗi của ready gate để báo một lần (batch reporting), làm rõ quy tắc checklist plan.md và dọn sạch vết tích schema v2.

## Relevant paths

- `src/core/workflow/ready.ts`
- `src/core/workflow/suite-gate.ts`
- `src/templates/harnix/workflow.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): coversSource nhận diện các thư mục source phổ biến (như core, models, services, modules) ngay cả khi dùng glob file như core/**/*.py.
- [x] `ac-2` (met): assertSuiteGateReady và ready gate gom và báo toàn bộ các lỗi cùng lúc (batch error reporting) thay vì báo từng vòng đơn lẻ.
- [x] `ac-3` (met): Cải thiện thông báo lỗi và hướng dẫn rõ ràng cho điều kiện checklist - [ ] chưa tick trong plan.md.
- [x] `ac-4` (met): Tài liệu và template workflow.md được rà soát và loại bỏ sạch sẽ mọi hướng dẫn sót về schema v2 và token @task-contract.

## Required checks

- [x] `check-suite` (full): Chạy toàn bộ test suite của Harnix — pass (2026-10-15 23:25:05 +07:00)
- [x] `check-gates` (focused): Kiem tra hop dong gates — pass (2026-10-15 23:23:54 +07:00)

## Evidence

- `check-gates` — pass (2026-10-15 23:23:54 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-15 23:25:05 +07:00): pnpm test — exit 0
