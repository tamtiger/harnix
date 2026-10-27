# Thêm --allow-warnings cho doctor để pipeline không fail khi chỉ có cảnh báo

- **ID:** 20261020-104848-doctor-allow-warnings
- **Mode:** full
- **Epic:** 20261020-104845-workspace-and-gate-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-20 10:48:45 +07:00
- **Updated:** 2026-10-20 11:35:41 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Cho phép harnix doctor --allow-warnings thoát 0 khi summary.errors bằng 0 dù có cảnh báo, giữ nguyên mặc định (exit 1 khi có cảnh báo, exit 2 khi trạng thái invalid) vì đó là hợp đồng đóng băng.

## Non-goals

- Không đổi mặc định của doctor và không đổi trường ok trong JSON v2.
- Không che lỗi hay trạng thái invalid.

## Relevant paths

- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `src/cli-workflow-commands.ts`
- `src/core/doctor`
- `test/integration/scenarios/doctor-exit.test.ts`
- `test/workflow/cli-contract.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): harnix doctor --allow-warnings thoát 0 khi summary.errors bằng 0 dù summary.warnings lớn hơn 0; JSON in ra giữ nguyên (ok vẫn phản ánh có cảnh báo).
- [x] `ac-2` (met): Mặc định không đổi: doctor không cờ vẫn thoát 1 khi có cảnh báo và 2 khi project hoặc global integration invalid; --allow-warnings không bao giờ che lỗi (errors lớn hơn 0 vẫn thoát khác 0) hay trạng thái invalid.
- [x] `ac-3` (met): Cờ mới được khai báo và có test hợp đồng CLI mới, mô tả đúng ngữ nghĩa mã thoát trong README, docs/HARNIX_PRD.md, docs/HARNIX_WORKFLOW.md và docs/IMPLEMENTATION_PLAN.md mục 4 (nếu các file này nêu mã thoát doctor); --allow-warnings dùng được cùng --fix và --global.
- [x] `ac-4` (met): Toàn bộ test suite của dự án và test:gates pass.

## Required checks

- [x] `chk-focus` (focused): Test mã thoát doctor và hợp đồng CLI — pass (2026-10-20 11:33:48 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 11:33:53 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 11:35:14 +07:00)

## Decisions

- **dec-1** — Dùng cờ opt-in --allow-warnings thay vì đổi mặc định hoặc thêm --strict.
  - _Why:_ Mặc định exit 1 khi ok là false nằm trong hợp đồng đóng băng và có thể đang được CI dựa vào; đổi mặc định là thay đổi phá vỡ. Một cờ opt-in cho phép pipeline chấp nhận cảnh báo mà không ảnh hưởng người khác.
- **dec-2** — Chưa rõ 52 cảnh báo trong báo cáo đến từ mã nào: legacy-task-schema đã chỉ là info với task đã kết thúc (project-tasks.ts).
  - _Why:_ Cần danh sách findings thật của dự án đó để biết có phải lỗi phân loại hay drift global thật; ghi lại trong rủi ro còn lại, không đoán.
- **dec-user-1** — Chọn cờ opt-in --allow-warnings, giữ nguyên mặc định của doctor.
  - _Why:_ Không phá CI đang dựa vào exit 1 khi có warning và không đổi hợp đồng mã thoát đóng băng.
- **dec-ver** — Phiên bản 2.13.0-dev.3, kind added. doctorExitCode đặt ở src/core/doctor/exit-code.ts; test mã thoát nằm trong test/integration/scenarios/doctor-exit.test.ts qua runCli.
  - _Why:_ Review: doctor.test.ts không có runCli, cli-workflow-commands.ts đã 270 dòng.

## Evidence

- `chk-focus` — pass (2026-10-20 11:33:48 +07:00): pnpm exec vitest run test/unit/core/doctor test/integration/scenarios/doctor-exit.test.ts test/workflow/cli-contract.test.ts — exit 0
- `chk-gates` — pass (2026-10-20 11:33:53 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-20 11:35:14 +07:00): pnpm test — exit 0
