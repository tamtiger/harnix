# Khôi phục gate xanh cho HEAD 2.0.4

- **ID:** 20261005-184125-khoi-phuc-gate-xanh-2-0-5
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 18:41:25 +07:00
- **Updated:** 2026-10-05 19:21:26 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Đưa typecheck, lint, format và coverage về xanh, và bảo đảm chuỗi acceptance thật sự chạy coverage (R-001, R-013).

## Non-goals

- Không thay đổi hành vi runtime ngoài việc sửa kiểu và tách module
- Không hạ ngưỡng coverage hay thêm miễn trừ ESLint

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): `pnpm run typecheck` exit 0: `src/commands/workflow-command.ts` có import type `TaskRecord`, `InitTaskOptions` tương thích `exactOptionalPropertyTypes`, và các lỗi kiểu trong `test/unit/core/workflow/transition.test.ts`, `batch.test.ts`, `test/workflow/localized-time.test.ts` được sửa bằng thu hẹp kiểu đúng nghĩa, không dùng `any`.
- `ac-2` (met): `src/core/workflow/batch.ts` (và các file khác) tuân thủ `max-lines` 300 và complexity 20 bằng cách tách module theo trách nhiệm; không thêm miễn trừ vào `eslint.config.mjs`; `pnpm run format:check` sạch.
- `ac-3` (met): Coverage về lại trên ngưỡng trong `vitest.config.ts` (lines/statements 94.7, branches 88.4) nhờ test thật cho `src/core/workflow/ready.ts` và `src/core/workflow/save-files.ts` cùng các nhánh mới tách ra.
- `ac-4` (met): `docs/IMPLEMENTATION_PLAN.md` §11 và `test:acceptance` chạy `pnpm run test` có coverage; một test cấu trúc bảo vệ điều này.
- `ac-5` (met): Cổng chất lượng xanh: `pnpm run typecheck`, `pnpm run lint` và `pnpm run test` (có coverage, không hạ ngưỡng) đều exit 0 trên cây mã cuối cùng của task.

## Required checks

- `check-focused` (focused): Test workflow và command liên quan — pass (2026-10-05 19:19:48 +07:00)
- `check-docs` (focused): Test hợp đồng tài liệu và cấu trúc — pass (2026-10-05 19:19:52 +07:00)
- `check-typecheck` (full): pnpm run typecheck exit 0 — pass (2026-10-05 19:19:58 +07:00)
- `check-lint` (full): pnpm run lint (format:check + ESLint) exit 0 — pass (2026-10-05 19:20:19 +07:00)
- `check-suite` (full): pnpm run test (vitest + coverage) exit 0 — pass (2026-10-05 19:21:09 +07:00)

## Decisions

- **d-acceptance-alias** — test:acceptance trở thành alias của pnpm run test (có coverage) và chuỗi acceptance §11 chạy đúng một lần pnpm test; các suite con vẫn chạy riêng được qua test:unit..test:safety.
  - _Why:_ Sàn coverage trong vitest.config.ts chỉ được ép khi chạy vitest --coverage; chuỗi cũ chỉ chạy sáu suite con nên coverage dưới sàn lọt qua gate ở 2.0.4.

## Residual risks

- **r-format-only-churn** (low) — Các file status.ts, verify-plan.ts, task-validate.ts, obligations.ts, run-check.ts và vài test chỉ đổi định dạng Prettier trong task này; khi review diff hãy tách phần format khỏi phần logic.

## Evidence

- `check-focused` — pass (2026-10-05 19:19:48 +07:00): pnpm — exit 0
- `check-docs` — pass (2026-10-05 19:19:52 +07:00): pnpm — exit 0
- `check-typecheck` — pass (2026-10-05 19:19:58 +07:00): pnpm — exit 0
- `check-lint` — pass (2026-10-05 19:20:19 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-05 19:21:09 +07:00): pnpm — exit 0
