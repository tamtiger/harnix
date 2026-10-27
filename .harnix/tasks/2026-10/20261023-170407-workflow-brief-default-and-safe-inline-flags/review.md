# Mặc định Brief Mode cho Workflow Commands và Tự động ép UTF-8 trên Windows

- **ID:** 20261023-170407-workflow-brief-default-and-safe-inline-flags
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** completed/finishing
- **Created:** 2026-10-23 17:04:07 +07:00
- **Updated:** 2026-10-23 21:01:22 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Đổi mặc định của toàn bộ các lệnh ghi workflow sang Brief Output (chỉ in id, status, checkpoint, updatedAt); thêm cờ --full khi cần in trọn vẹn JSON; hỗ trợ inline flags --note, --reason; và tự động ép UTF-8 cho stdin trên Windows win32.

## Relevant paths

- `src/commands/workflow-command.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-handler-utils.ts`
- `src/commands/workflow-handlers.ts`
- `src/core/workflow/brief.ts`
- `test/unit/commands/workflow-handlers.test.ts`
- `test/workflow/preflight-switch-and-file.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +24 / -24 |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +8 / -2 |
| `src/commands/workflow-flags.ts` | modified | +1 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -0 |
| `src/core/workflow/transition.ts` | modified | +5 / -1 |
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
| `src/utils/bounded-input.ts` | modified | +8 / -1 |
| `test/integration/commands/workflow-flags.test.ts` | modified | +3 / -0 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +46 / -0 |
| `test/unit/utils/bounded-input.test.ts` | modified | +16 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Các lệnh workflow ghi trạng thái mặc định chỉ in { id, status, checkpoint, updatedAt } mà không cần truyền cờ --brief.
- [x] `ac-2` (met): Truyền cờ --full in toàn bộ task record JSON như hành vi cũ.
- [x] `ac-3` (met): Hỗ trợ cờ inline --reason và --note cho các transition/replan mà không bị lỗi encoding tiếng Việt trên PowerShell.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-23 21:00:56 +07:00)
- [x] `check-workflow-brief` (focused): Unit test workflow handlers tra ve brief mac dinh va full khi co co --full — pass (2026-10-23 20:58:59 +07:00)
- [x] `check-safe-inline-flags` (focused): Test workflow cac co inline --reason va --note voi UTF-8 va tieng Viet — pass (2026-10-23 20:59:09 +07:00)

## Evidence

- `check-workflow-brief` — pass (2026-10-23 20:58:59 +07:00): pnpm vitest run test/unit/commands/workflow-handlers.test.ts — exit 0
- `check-safe-inline-flags` — pass (2026-10-23 20:59:09 +07:00): pnpm vitest run test/workflow/preflight-switch-and-file.test.ts — exit 0
- `check-suite` — pass (2026-10-23 21:00:56 +07:00): pnpm test — exit 0
