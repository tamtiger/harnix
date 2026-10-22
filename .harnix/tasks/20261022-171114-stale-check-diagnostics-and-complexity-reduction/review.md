# Cải tiến chẩn đoán Stale Check và Hạ Cyclomatic Complexity

- **ID:** 20261022-171114-stale-check-diagnostics-and-complexity-reduction
- **Mode:** lite
- **Epic:** 20261022-170701-workflow-ergonomics-and-codebase-hardening
- **Status:** planning/planning
- **Created:** 2026-10-22 17:11:14 +07:00
- **Updated:** 2026-10-22 17:11:14 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/3 passed |

## Goal

Bổ sung danh sách file cụ thể bị thay đổi khi audit phát hiện digest-mismatch; thêm cảnh báo checklist plan.md chưa hoàn tất tại workflow --transition verifying/verifying; refactor 3 hàm có complexity 19 (validateTaskArtifacts, mergeCheck, transitionWorkflow) xuống dưới 15.

## Acceptance criteria

- [ ] `ac-1` (pending): Nâng cấp chẩn đoán digest-mismatch trong status --explain và kết quả audit/completion để liệt kê chi tiết các file cụ thể bị thay đổi hash, giúp dev biết ngay nguyên nhân check bị stale.
- [ ] `ac-2` (pending): Bổ sung cảnh báo sớm (warning) khi chuyển trạng thái sang verifying/verifying nếu checklist trong plan.md chưa đạt 100% [x].
- [ ] `ac-3` (pending): Refactor và hạ Cyclomatic Complexity của 3 hàm sát trần 19 (validateTaskArtifacts trong task-store.ts, mergeCheck trong plan-edit.ts, transitionWorkflow trong transition.ts) xuống dưới 15.

## Required checks

- [ ] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run
- [ ] `check-audit-diagnostics` (focused): check-audit-diagnostics — chưa chạy / not yet run
- [ ] `check-complexity-lint` (focused): check-complexity-lint — chưa chạy / not yet run

## Evidence

_None recorded yet._
