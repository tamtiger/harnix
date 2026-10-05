# Khac phuc Windows spawn runner cho .cmd/.bat va tang cuong chan doan input globs

- **ID:** 20261005-134655-windows-runner-glob-validation
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 13:46:54 +07:00
- **Updated:** 2026-10-05 13:57:29 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Sua loi spawn EINVAL khi chay cac lenh .cmd/.bat tren Windows qua check-runner va cai thien do ro rang cua thong bao loi khi input globs khong match file nao.

## Non-goals

- Khong thuc thi shell arbitrary khong an toan
- Khong bo qua kiem tra an toan ky tu cmd

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): check-runner nhan dien cac tep .cmd, .bat tren Windows va route an toan qua cmd.exe /d /s /c ma khong bi spawn EINVAL
- `ac-2` (met): Validation input globs va computeInputDigest thong bao chinh xac glob nao khong match file nao thay vi loi chung chung
- `ac-3` (met): Toan bo test suite unit, workflow va acceptance cua Harnix vuot qua 100% exit code 0

## Required checks

- `check-input-globs` (focused): Unit test chan doan loi chi tiet khi input glob khong khop — pass (2026-10-05 13:54:23 +07:00)
- `check-suite` (full): Kiem thu hoi quy toan bo he thong — pass (2026-10-05 13:57:02 +07:00)
- `check-windows-runner` (focused): Unit test cho check-runner voi cac launcher .cmd/.bat tren Windows — pass (2026-10-05 13:54:14 +07:00)

## Evidence

- `check-windows-runner` — pass (2026-10-05 13:54:14 +07:00): pnpm — exit 0
- `check-input-globs` — pass (2026-10-05 13:54:23 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-05 13:57:02 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
