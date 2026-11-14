# Siết suite gate: loại kẽ hở wildcard và cwd làm pass giả

- **ID:** 20261113-220242-suite-gate-hardening
- **Mode:** full
- **Epic:** 20261113-220240-harnix-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 22:02:39 +07:00
- **Updated:** 2026-11-14 10:49:48 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Một check suite chỉ được chấp nhận khi inputs và cwd thật sự phủ toàn bộ source và test của dự án (hoặc đúng package được kiểm).

## Non-goals

- Không đổi công thức input digest và không đổi luật circuit breaker (P3-2).

## Relevant paths

- `src/core/workflow/suite-gate.ts`
- `src/core/workflow/suite-command.ts`
- `docs/IMPLEMENTATION_PLAN.md`

## Relevant specs

- `docs/IMPLEMENTATION_PLAN.md#4`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +6 / -5 |
| `CHANGELOG.md` | modified | +14 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -3 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +5 / -3 |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +3 / -3 |
| `scripts/token-budget-usage.mjs` | modified | +45 / -2 |
| `src/commands/workflow-flags.ts` | modified | +3 / -1 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +13 / -2 |
| `src/core/doctor/finding-codes-global.ts` | modified | +1 / -0 |
| `src/core/doctor/finding-codes-project.ts` | modified | +1 / -0 |
| `src/core/doctor/global-inspect.ts` | modified | +8 / -4 |
| `src/core/doctor/global-linked.ts` | added | - |
| `src/core/doctor/global.ts` | modified | +60 / -21 |
| `src/core/doctor/project-runtime.ts` | modified | +19 / -3 |
| `src/core/global/uninstall.ts` | modified | +4 / -1 |
| `src/core/platform/facts.ts` | modified | +2 / -2 |
| `src/core/platform/records.ts` | modified | +1 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +3 / -1 |
| `src/core/workflow/obligations.ts` | modified | +3 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +3 / -1 |
| `src/core/workflow/run-check.ts` | modified | +4 / -0 |
| `src/core/workflow/save.ts` | modified | +4 / -1 |
| `src/core/workflow/schema.ts` | modified | +2 / -2 |
| `src/core/workflow/suite-command.ts` | modified | +23 / -2 |
| `src/core/workflow/suite-gate.ts` | modified | +26 / -15 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/templates/harnix/token-budgets.json` | modified | +1 / -0 |
| `src/templates/harnix/token-budgets.ts` | modified | +2 / -0 |
| `src/templates/harnix/workflow.md` | modified | +1 / -1 |
| `test/README.md` | modified | +2 / -2 |
| `test/integration/commands/workflow-error-hints.test.ts` | added | - |
| `test/unit/commands/workflow-lifecycle-handlers.test.ts` | modified | +17 / -0 |
| `test/unit/core/doctor/global-inspect.test.ts` | modified | +28 / -1 |
| `test/unit/core/doctor/global-linked.test.ts` | added | - |

_(11 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): coversSourceAndTest không coi chuỗi * là wildcard toàn repo, không chấp nhận input file đơn hay thư mục không thuộc nhóm source làm tree nguồn (P2-1).
- [x] `ac-2` (met): acceptsSuiteCommand xét cwd: lệnh root chạy với cwd của một package chỉ được chấp nhận khi trùng lệnh test của đúng package đó (P2-2).
- [x] `ac-3` (met): Hợp đồng đóng băng được cập nhật đồng bộ: IMPLEMENTATION_PLAN mục 4.5, AGENTS.md, workflow template và golden chỉ đổi đúng chuỗi mới.

## Required checks

- [x] `chk-focused` (focused): Test suite-gate và suite-command — pass (2026-11-14 10:47:33 +07:00)
- [x] `chk-gates` (focused): Các test hợp đồng nhanh (CLI, tài liệu, cấu trúc test, ngân sách token, golden) — pass (2026-11-14 10:47:43 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-11-14 10:49:29 +07:00)

## Decisions

- **dec-source** — Nguồn của task: báo cáo review toàn bộ Harnix ngày 2026-11-13 (research.md của epic).
  - _Why:_ Mỗi tiêu chí là một phát hiện đã được nhóm review nêu kèm file:dòng; phải đối chiếu lại với mã hiện tại trước khi chuyển sang ready.
- **dec-suite-package-cwd** — Check có cwd package phải trùng lệnh test của đúng package theo verify-plan, thay vì chỉ so lệnh gốc
  - _Why:_ Lệnh test gốc chạy ở cwd con chỉ kiểm package đó nên không chứng minh cả suite.

## Evidence

- `chk-focused` — pass (2026-11-14 10:47:33 +07:00): pnpm exec vitest run test/unit/core/workflow/suite-gate.test.ts test/unit/core/workflow/suite-command.test.ts --coverage.enabled=false — exit 0
- `chk-gates` — pass (2026-11-14 10:47:43 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-11-14 10:49:29 +07:00): pnpm test — exit 0
