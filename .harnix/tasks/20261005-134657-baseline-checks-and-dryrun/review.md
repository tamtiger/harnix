# Co che baseline check truoc freeze contract va dry-run transition

- **ID:** 20261005-134657-baseline-checks-and-dryrun
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 13:46:54 +07:00
- **Updated:** 2026-10-05 14:33:38 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Them kiem tra baseline cho cac required checks truoc khi dong bang contract tai ready va ho tro transition dry-run de phat hien som loi cau hinh.

## Non-goals

- Khong tu dong bo qua check loi neu khong co waiver
- Khong vi pham quy tac ready gate

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Ho tro flag --transition ready/ready --dry-run de kiem tra truoc cac dieu kien freeze ma khong luu state
- `ac-2` (met): Canh bao hoac chan chuyen ready khi required checks chua duoc chay baseline lan nao
- `ac-3` (met): Toan bo test suite unit, workflow va acceptance cua Harnix vuot qua 100% exit code 0

## Required checks

- `check-baseline-dryrun` (focused): Unit test cho dry-run transition va baseline checking — pass (2026-10-05 14:32:20 +07:00)
- `check-suite` (full): Kiem thu hoi quy toan bo he thong — pass (2026-10-05 14:33:22 +07:00)

## Evidence

- `check-baseline-dryrun` — pass (2026-10-05 14:32:20 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-05 14:33:22 +07:00): pnpm — exit 0
