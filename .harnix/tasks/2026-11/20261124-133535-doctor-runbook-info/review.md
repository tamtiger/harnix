# Hạ finding exercise-runbook-missing xuống info để doctor không đỏ CI

- **ID:** 20261124-133535-doctor-runbook-info
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-24 13:35:35 +07:00
- **Updated:** 2026-11-24 13:44:16 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 1 | risk-info-hidden: low |

## Goal

Finding exercise-runbook-missing chỉ là gợi ý nên không được làm harnix doctor thoát exit 1 ở repo có entry point chạy được mà thiếu .harnix/spec/exercise.md.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +5 / -4 |
| `docs/HARNIX_PRD.md` | modified | +2 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +4 / -1 |
| `src/cli-workflow-commands.ts` | modified | +8 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +3 / -2 |
| `src/commands/status-mode.ts` | modified | +3 / -0 |
| `src/commands/status.ts` | modified | +14 / -5 |
| `src/commands/workflow-command.ts` | modified | +11 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +13 / -8 |
| `src/commands/workflow-flags.ts` | modified | +13 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +1 / -0 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +20 / -1 |
| `src/core/doctor/exercise-runbook-finding.ts` | added | - |
| `src/core/doctor/finding-codes-project.ts` | modified | +1 / -0 |
| `src/core/doctor/project.ts` | modified | +2 / -0 |
| `src/core/platform/user-path-hints.ts` | added | - |
| `src/core/platform/user-paths.ts` | modified | +3 / -2 |
| `src/core/repo-map/refs.ts` | modified | +3 / -1 |
| `src/core/spec/exercise-runbook.ts` | added | - |
| `src/core/stack/verify-plan.ts` | modified | +5 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +1 / -1 |
| `src/core/tasks/transition-hint.ts` | modified | +1 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -0 |
| `src/core/workflow/check-duration.ts` | added | - |
| `src/core/workflow/exercise-advisory.ts` | added | - |
| `src/core/workflow/finish-advice.ts` | added | - |
| `src/core/workflow/finish.ts` | modified | +4 / -0 |
| `src/core/workflow/index.ts` | modified | +3 / -1 |
| `src/core/workflow/init-epic.ts` | added | - |
| `src/core/workflow/init-task.ts` | modified | +22 / -4 |
| `src/core/workflow/ready.ts` | modified | +6 / -1 |
| `src/core/workflow/run-check.ts` | modified | +1 / -1 |
| `src/core/workflow/schema.ts` | modified | +2 / -0 |
| `src/core/workflow/target-task.ts` | modified | +19 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +2 / -1 |
| `src/skills/harnix-exercise/references/detection.md` | modified | +2 / -0 |
| `src/skills/harnix-exercise/references/evidence.md` | modified | +2 / -0 |
| `src/skills/harnix-exercise/references/runbook.md` | added | - |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |

_(33 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): harnix doctor trên một dự án chỉ có finding exercise-runbook-missing có ok true và exit code 0; finding vẫn xuất hiện trong báo cáo với severity info, mã vẫn nằm trong DOCTOR_FINDING_CODES và tài liệu ghi đúng mức info.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-24 13:44:06 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh — pass (2026-11-24 13:41:29 +07:00)

## Decisions

- **dec-info-level** — Hạ exercise-runbook-missing xuống severity info thay vì warning
  - _Why:_ doctor đã hỗ trợ info và ok chỉ tính errors và warnings, nên info giữ finding trong báo cáo mà không đổi exit code; không cần cờ hay ngoại lệ mới trong doctorExitCode; AGENTS.md cho phép finding mới ra mức nhẹ trước.

## Residual risks

- **risk-info-hidden** (low) — Finding info có thể bị bỏ qua vì doctor không đỏ; chấp nhận vì đây chỉ là gợi ý và skill harnix-exercise đã nhắc runbook.

## Evidence

- `chk-focused` — pass (2026-11-24 13:41:29 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-11-24 13:44:06 +07:00): pnpm test — exit 0
