# Bo sung transport thay the atomic cho required check da fail

- **ID:** 20261005-134656-atomic-replace-check
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 13:46:54 +07:00
- **Updated:** 2026-10-05 14:21:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Bo sung co lenh workflow --replace-check de thay the nguyen tu mot check da fail bang mot check moi ma van dam bao tinh bat bien cua hop dong va tieu chuan kiem thu.

## Non-goals

- Khong cho phep thay the check da pass
- Khong giam do bao phu tieu chi nghiem thu

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Ho tro flag --replace-check <old> <new> --reason va kiem tra new check cover du criterionIds cua old check
- `ac-2` (met): Thao tac thay the la atomic, ghi nhan contractRevision hop le va giu nguyen dinh nghia cua old check
- `ac-3` (met): Toan bo test suite unit, workflow va acceptance cua Harnix vuot qua 100% exit code 0

## Required checks

- `check-replace-command` (focused): Unit test cho workflow replace-check command va plan-edit — pass (2026-10-05 14:16:16 +07:00)
- `check-suite` (full): Kiem thu hoi quy toan bo he thong — pass (2026-10-05 14:21:20 +07:00)

## Evidence

- `check-replace-command` — pass (2026-10-05 14:16:16 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-05 14:21:20 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
