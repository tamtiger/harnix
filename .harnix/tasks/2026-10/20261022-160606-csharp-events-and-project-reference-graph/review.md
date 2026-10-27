# Nâng cấp C#/.NET Parser cho Kafka Topics và ProjectReference Dependency Graph

- **ID:** 20261022-160606-csharp-events-and-project-reference-graph
- **Mode:** lite
- **Epic:** 20261022-153552-repomap-csharp-workspace-fixes
- **Status:** completed/finishing
- **Created:** 2026-10-22 16:06:06 +07:00
- **Updated:** 2026-10-22 16:14:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Nâng cấp C#/.NET Parser cho Kafka Topics và ProjectReference Dependency Graph

## Relevant paths

- `src/core/repo-map/event-discovery.ts`
- `src/core/repo-map/extract.ts`
- `src/core/repo-map/graph.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +11 / -3 |
| `src/commands/repo-map-internal.ts` | modified | +46 / -4 |
| `src/core/repo-map/event-discovery.ts` | modified | +11 / -10 |
| `src/core/repo-map/extract.ts` | modified | +8 / -1 |
| `src/core/repo-map/inventory.ts` | modified | +2 / -1 |
| `src/core/repo-map/outline.ts` | modified | +1 / -1 |
| `src/core/repo-map/workspace.ts` | modified | +46 / -0 |
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
| `test/integration/commands/repo-map-internal.test.ts` | modified | +16 / -10 |
| `test/integration/scenarios/status-workspace.test.ts` | modified | +19 / -5 |
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +39 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +2 / -2 |
| `test/unit/core/repo-map/extract.test.ts` | modified | +15 / -0 |
| `test/unit/core/repo-map/graph.test.ts` | modified | +14 / -0 |
| `test/unit/core/repo-map/inventory.test.ts` | modified | +21 / -0 |
| `test/unit/core/repo-map/outline.test.ts` | modified | +8 / -0 |
| `test/workflow/version-sync.test.ts` | modified | +4 / -4 |

## Acceptance criteria

- [x] `ac-1` (met): Bộ bóc tách sự kiện (event-discovery.ts) hỗ trợ nhận diện các mẫu pub/sub trong C#/.NET: bắt được [CapSubscribe(Class.Const)] hoặc string literal, nhận diện producer calls như _kafkaProducer.ProduceAsync(...) hoặc _eventBus.PublishAsync(...), và quét các class định nghĩa topic constants (*Topic*.cs, *Consts*.cs) để resolve hằng số sang topic string.
- [x] `ac-2` (met): Bộ trích xuất phụ thuộc (extract.ts và graph.ts) bóc tách <ProjectReference Include='...'> từ các file .csproj và phân giải đúng liên kết phụ thuộc giữa các project .NET trong đồ thị dependency impact.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite và coverage của dự án phải pass — pass (2026-10-22 16:13:33 +07:00)
- [x] `check-csharp-events` (focused): Kiểm tra nhận diện Kafka/CAP topic trong C# bao gồm attribute constant, producer calls và topic constants resolution — pass (2026-10-22 16:11:43 +07:00)
- [x] `check-csharp-project-references` (focused): Kiểm tra bóc tách ProjectReference trong .csproj và phân giải dependency graph .NET — pass (2026-10-22 16:11:51 +07:00)

## Evidence

- `check-csharp-events` — pass (2026-10-22 16:11:43 +07:00): pnpm vitest run test/unit/core/repo-map/event-discovery.test.ts test/unit/core/repo-map/event-matrix.test.ts — exit 0
- `check-csharp-project-references` — pass (2026-10-22 16:11:51 +07:00): pnpm vitest run test/unit/core/repo-map/extract.test.ts test/unit/core/repo-map/graph.test.ts — exit 0
- `check-suite` — pass (2026-10-22 16:13:33 +07:00): pnpm test — exit 0
