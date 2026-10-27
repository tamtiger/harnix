# Bổ sung Reference dotnet-microservices và thiết lập Active Skill Triggers cho Multi-Agent

- **ID:** 20261023-170410-dotnet-microservices-reference-and-active-triggers
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** completed/finishing
- **Created:** 2026-10-23 17:04:10 +07:00
- **Updated:** 2026-10-23 21:36:24 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Soạn thảo reference chuyên đề dotnet-microservices.md; cập nhật các file SKILL.md thiết lập Active Triggers bắt buộc agent/subagent nạp reference chuyên sâu khi gặp điều kiện (đặc biệt khi dispatch subagent/multi-agent bắt buộc nạp epic.md/scouting-isolation.md).

## Relevant paths

- `src/skills/catalog.ts`
- `src/skills/harnix-implement/SKILL.md`
- `src/skills/harnix-implement/references/dotnet-microservices.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/skills/harnix-research/SKILL.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +30 / -0 |
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
| `src/skills/catalog.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/references/invariant-debugging.md` | added | - |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/references/concurrency-isolation.md` | added | - |
| `src/skills/harnix-implement/SKILL.md` | modified | +3 / -4 |
| `src/skills/harnix-implement/references/dotnet-microservices.md` | added | - |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/references/zero-downtime-evolution.md` | added | - |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/references/injection-traversal-guardrails.md` | added | - |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/references/multi-step-tree-search.md` | added | - |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/references/verification-blindspots.md` | added | - |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/technique-skills.ts` | modified | +42 / -6 |
| `src/utils/bounded-input.ts` | modified | +8 / -1 |
| `test/integration/commands/skills.test.ts` | modified | +6 / -1 |
| `test/integration/commands/workflow-flags.test.ts` | modified | +3 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +46 / -0 |
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +32 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +177 / -0 |
| `test/unit/skills/catalog.test.ts` | modified | +1 / -1 |
| `test/unit/skills/technique-skills.test.ts` | modified | +24 / -0 |
| `test/unit/utils/bounded-input.test.ts` | modified | +16 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Soạn thảo reference chuyên đề dotnet-microservices.md chuẩn cấu trúc (DDD layers, Kafka consumer, NSubstitute mocks, ProjectReference, .harnixignore).
- [x] `ac-2` (met): Cập nhật các file SKILL.md bổ sung Active Triggers bắt buộc agent nạp reference chuyên sâu; đặc biệt khi dispatch subagent / multi-agent BẮT BUỘC nạp epic.md / scouting-isolation.md.
- [x] `ac-3` (met): Kiểm thử xác thực định dạng reference và các trigger trong SKILL.md.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite và test skills/references phải pass — pass (2026-10-23 21:36:09 +07:00)
- [x] `check-triggers-and-references` (focused): Xác thực references của workflow skills và budget tokens — pass (2026-10-23 21:31:53 +07:00)

## Evidence

- `check-triggers-and-references` — pass (2026-10-23 21:31:53 +07:00): pnpm vitest run test/workflow/instruction-budget.test.ts test/unit/skills/technique-skills.test.ts — exit 0
- `check-suite` — pass (2026-10-23 21:36:09 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
