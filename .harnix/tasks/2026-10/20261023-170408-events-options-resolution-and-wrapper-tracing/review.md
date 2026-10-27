# AST C# Constant/Options Resolution và cấu hình Producer Wrappers cho repo-map --events

- **ID:** 20261023-170408-events-options-resolution-and-wrapper-tracing
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** completed/finishing
- **Created:** 2026-10-23 17:04:08 +07:00
- **Updated:** 2026-10-23 21:09:50 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Phân tích AST C# bóc tách chuỗi thực tế từ constant/Options class; hỗ trợ cấu hình events.producerWrappers trong config.yaml; loại bỏ triệt để các biến rác dynamic (eto.EventName, splitTopics, dataKafka).

## Relevant paths

- `src/core/config/config-schema.ts`
- `src/core/config/config-validate.ts`
- `src/core/config/config.ts`
- `src/core/repo-map/event-discovery.ts`
- `src/core/repo-map/event-matrix.ts`
- `test/unit/core/repo-map/event-discovery.test.ts`
- `test/unit/core/repo-map/event-matrix.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +24 / -24 |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +8 / -2 |
| `src/commands/workflow-flags.ts` | modified | +1 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -0 |
| `src/core/config/config-schema.ts` | modified | +6 / -0 |
| `src/core/config/config-validate.ts` | modified | +10 / -0 |
| `src/core/repo-map/event-discovery.ts` | modified | +35 / -3 |
| `src/core/repo-map/event-matrix.ts` | modified | +39 / -4 |
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
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +81 / -0 |
| `test/unit/utils/bounded-input.test.ts` | modified | +16 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Trích xuất chính xác giá trị chuỗi từ const string và default property initializer của class *Options.cs.
- [x] `ac-2` (met): Hỗ trợ cấu hình events.producerWrappers trong config.yaml để nhận diện caller hàm wrapper là Publisher thực tế.
- [x] `ac-3` (met): Loại bỏ hoàn toàn các identifier biến rác (eto.EventName, splitTopics, checkResult.CancelEto, ObjectMapper.Map).

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite và test AST C# events phải pass — pass (2026-10-23 21:09:25 +07:00)
- [x] `check-csharp-event-discovery` (focused): Test unit boc tach topic AST C# va loai bo bien rac dynamic — pass (2026-10-23 21:07:34 +07:00)
- [x] `check-csharp-event-matrix` (focused): Test unit event matrix boc tach Options va producer wrappers — pass (2026-10-23 21:07:42 +07:00)

## Evidence

- `check-csharp-event-discovery` — pass (2026-10-23 21:07:34 +07:00): pnpm vitest run test/unit/core/repo-map/event-discovery.test.ts — exit 0
- `check-csharp-event-matrix` — pass (2026-10-23 21:07:42 +07:00): pnpm vitest run test/unit/core/repo-map/event-matrix.test.ts — exit 0
- `check-suite` — pass (2026-10-23 21:09:25 +07:00): pnpm test — exit 0
