# Hỗ trợ Multi-Workspace Root và liên kết cụm repository cho repo-map --events

- **ID:** 20261023-170409-multi-workspace-root-repo-map
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** completed/finishing
- **Created:** 2026-10-23 17:04:09 +07:00
- **Updated:** 2026-10-23 21:17:29 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Cho phép truyền nhiều path vào --workspace hoặc cấu hình linkedWorkspaces trong .harnix/config.yaml để tạo Cross-system Event Matrix E2E liền mạch.

## Relevant paths

- `src/cli-helpers.ts`
- `src/commands/repo-map-internal.ts`
- `src/core/config/config-schema.ts`
- `src/core/config/config-validate.ts`
- `src/core/repo-map/event-matrix.ts`
- `test/unit/core/repo-map/event-matrix.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +24 / -24 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +1 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +22 / -5 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +8 / -2 |
| `src/commands/workflow-flags.ts` | modified | +1 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -0 |
| `src/core/config/config-schema.ts` | modified | +8 / -0 |
| `src/core/config/config-validate.ts` | modified | +20 / -0 |
| `src/core/repo-map/event-discovery.ts` | modified | +35 / -3 |
| `src/core/repo-map/event-matrix.ts` | modified | +100 / -6 |
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
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +32 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +177 / -0 |
| `test/unit/utils/bounded-input.test.ts` | modified | +16 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Cho phép truyền nhiều path vào CLI: harnix repo-map --events --workspace <path1> <path2>...
- [x] `ac-2` (met): Hỗ trợ cấu hình linkedWorkspaces trong config.yaml để tự động quét các repo liên kết.
- [x] `ac-3` (met): Xuất ma trận event hợp nhất E2E chính xác giữa các repository độc lập.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite và test multi-workspace repo-map phải pass — pass (2026-10-23 21:17:16 +07:00)
- [x] `check-multi-workspace-events` (focused): Test unit multi-workspace root va linkedWorkspaces cho event matrix — pass (2026-10-23 21:15:36 +07:00)

## Evidence

- `check-multi-workspace-events` — pass (2026-10-23 21:15:36 +07:00): pnpm vitest run test/unit/core/repo-map/event-matrix.test.ts — exit 0
- `check-suite` — pass (2026-10-23 21:17:16 +07:00): pnpm test — exit 0
