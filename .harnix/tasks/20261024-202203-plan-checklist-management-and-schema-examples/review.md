# Lệnh harnix workflow --tick cho plan.md, Đồng bộ Schema Examples và Chốt chặn Checklist

- **ID:** 20261024-202203-plan-checklist-management-and-schema-examples
- **Mode:** lite
- **Epic:** 20261024-202200-harnix-dx-workflow-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-24 21:24:00 +07:00
- **Updated:** 2026-10-24 22:08:19 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Giải quyết Vấn đề 3 & 4: (1) Bổ sung lệnh workflow --tick <index|pattern|all> để đánh dấu hoàn thành [x] trong plan.md an toàn; (2) Chuyển advisory warning checklist plan.md thành strict gate khi chuyển sang verifying; (3) Bổ sung decisions và residualRisks vào nested schema cùng ví dụ envelope tối thiểu.

## Non-goals

- Không thay đổi logic verify checklist ngoài lệnh transition
- Không thay đổi định dạng schema taskRecord gốc

## Relevant paths

- `src/core/workflow/plan-sync.ts`
- `src/core/workflow/transition.ts`
- `src/core/workflow/schema.ts`
- `test/unit/core/workflow/plan-sync.test.ts`
- `test/unit/core/workflow/transition.test.ts`
- `test/unit/core/workflow/schema.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +2 / -1 |
| `docs/HARNIX_PRD.md` | modified | +5 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +6 / -3 |
| `package.json` | modified | +1 / -1 |
| `src/cli-workflow-commands.ts` | modified | +16 / -2 |
| `src/commands/status.ts` | modified | +42 / -0 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flags.ts` | modified | +4 / -2 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +21 / -5 |
| `src/core/workflow/check-output.ts` | modified | +7 / -1 |
| `src/core/workflow/completion.ts` | modified | +12 / -2 |
| `src/core/workflow/index.ts` | modified | +2 / -0 |
| `src/core/workflow/init-task.ts` | modified | +5 / -4 |
| `src/core/workflow/obligations.ts` | modified | +50 / -25 |
| `src/core/workflow/plan-sync.ts` | modified | +107 / -1 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -2 |
| `src/core/workflow/schema.ts` | modified | +50 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +1 / -1 |
| `src/core/workflow/transition.ts` | modified | +12 / -1 |
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
| `test/unit/commands/status.test.ts` | modified | +27 / -1 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +1 / -0 |
| `test/unit/core/tasks/task-validate-contracts.test.ts` | modified | +24 / -0 |
| `test/unit/core/workflow/check-output.test.ts` | modified | +1 / -0 |
| `test/unit/core/workflow/index.test.ts` | modified | +3 / -0 |
| `test/unit/core/workflow/obligations.test.ts` | modified | +51 / -59 |
| `test/unit/core/workflow/plan-sync.test.ts` | modified | +111 / -1 |
| `test/unit/core/workflow/replace-check.test.ts` | modified | +12 / -3 |
| `test/unit/core/workflow/schema.test.ts` | modified | +12 / -0 |
| `test/unit/core/workflow/set-criterion.test.ts` | modified | +11 / -5 |
| `test/unit/core/workflow/transition.test.ts` | modified | +16 / -2 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +52 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +8 / -1 |
| `test/workflow/task-contract-v3.test.ts` | modified | +18 / -4 |

## Acceptance criteria

- [x] `ac-1` (met): Hỗ trợ cờ workflow --tick <item> cho phép đánh dấu - [x] vào checklist của plan.md trực tiếp từ CLI mà không cần sửa file thủ công bằng regex/sed.
- [x] `ac-2` (met): Chốt chặn chuyển trạng thái workflow --transition verifying/verifying từ chối nếu plan.md còn mục checklist chưa tick (- [ ]), kèm thông báo lỗi hướng dẫn dùng --tick.
- [x] `ac-3` (met): Lệnh harnix workflow --schema bổ sung decisions: ['id', 'text', 'rationale'] và residualRisks: ['id', 'text', 'severity'] vào nested, đồng thời cung cấp cấu trúc envelope ví dụ tối thiểu hợp lệ.

## Required checks

- [x] `check-suite-v2` (full): Replacement for check-suite — pass (2026-10-24 22:07:49 +07:00)
- [x] `chk-unit-plan-sync` (focused): Kiểm thử lệnh workflow --tick cập nhật checklist plan.md — pass (2026-10-24 22:04:49 +07:00)
- [x] `chk-unit-schema` (focused): Kiểm thử schema bổ sung decisions/residualRisks và ví dụ — pass (2026-10-24 22:05:08 +07:00)
- [x] `chk-unit-transition` (focused): Kiểm thử gate transition verifying chặn checklist chưa tick — pass (2026-10-24 22:05:00 +07:00)

## Evidence

- `chk-unit-plan-sync` — pass (2026-10-24 22:04:49 +07:00): pnpm vitest run test/unit/core/workflow/plan-sync.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-unit-transition` — pass (2026-10-24 22:05:00 +07:00): pnpm vitest run test/unit/core/workflow/transition.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-unit-schema` — pass (2026-10-24 22:05:08 +07:00): pnpm vitest run test/unit/core/workflow/schema.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-24 22:04:00 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-24 22:05:29 +07:00): Task contract revised at persisted replan: Kích hoạt lại bộ kiểm thử suite sau khi bổ sung test coverage cho tickWorkflow
- `check-suite-v2` — pass (2026-10-24 22:07:49 +07:00): pnpm test — exit 0
