# Nâng cấp Repo-Map cho C# .NET: Affected Tests qua Symbol, Project Impact và lọc Event Topic

- **ID:** 20261023-145100-csharp-repomap-tests-impact-and-events
- **Mode:** lite
- **Epic:** 20261023-141853-enterprise-dotnet-and-context-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-23 14:51:00 +07:00
- **Updated:** 2026-10-23 15:40:06 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Nâng cấp toàn diện bộ phân tích mã nguồn C# .NET trong repo-map: (1) repo-map --tests bổ sung quét symbol reference (tìm class name và interface trong test files) để phát hiện test đặt theo use case; (2) repo-map --impact liên kết file .cs với .csproj sở hữu để mở rộng graph dependencies; (3) repo-map --events lọc bỏ tham số nhiễu (stoppingToken, Arg.Any, payload) và hỗ trợ resolve constant class topic.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/repo-map/event-discovery.ts` | modified | +52 / -5 |
| `src/core/repo-map/event-matrix.ts` | modified | +68 / -2 |
| `src/core/repo-map/extract.ts` | modified | +5 / -1 |
| `src/core/repo-map/impact.ts` | modified | +62 / -3 |
| `src/core/repo-map/inventory.ts` | modified | +7 / -1 |
| `src/core/repo-map/tests.ts` | modified | +27 / -0 |
| `src/core/stack/detection.ts` | modified | +8 / -4 |
| `src/core/stack/harnix-ignore.ts` | added | - |
| `src/core/stack/verify-plan.ts` | modified | +13 / -0 |
| `src/core/stack/workspace-detection.ts` | modified | +112 / -44 |
| `src/core/workflow/obligations.ts` | modified | +5 / -1 |
| `src/core/workflow/replace-check.ts` | modified | +5 / -1 |
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
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +42 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +66 / -0 |
| `test/unit/core/repo-map/impact.test.ts` | modified | +21 / -0 |
| `test/unit/core/repo-map/inventory.test.ts` | modified | +17 / -0 |
| `test/unit/core/repo-map/tests.test.ts` | modified | +30 / -0 |
| `test/unit/core/stack/detection.test.ts` | modified | +15 / -0 |
| `test/unit/core/stack/harnix-ignore.test.ts` | added | - |
| `test/unit/core/stack/verify-plan.test.ts` | modified | +26 / -0 |
| `test/unit/core/stack/workspace-detection.test.ts` | modified | +32 / -0 |
| `test/workflow/legacy-history.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): findAffectedTests cho C# .NET phát hiện các file test chứa symbol của class mục tiêu (new ClassName, Mock<IInterface>) khi không trùng tên file.
- [x] `ac-2` (met): repo-map --impact cho file .cs mở rộng đồ thị phụ thuộc thông qua ProjectReference của .csproj bao chứa nó.
- [x] `ac-3` (met): repo-map --events tự động loại trừ file test (test/, tests/, *Tests.cs) khỏi Event Matrix, triệt tiêu mã mock (Arg.Any, Mock.Of).
- [x] `ac-4` (met): repo-map --events chuẩn hóa signature C# Kafka/CAP: bỏ qua consumer.Consume(CancellationToken/stoppingToken); loại trừ các identifier biến động (createdEto, payload, data, new, object) khi không phải topic string literal.
- [x] `ac-5` (met): repo-map --events resolve hằng số class (như KafkaTopics.WebhookFinished) sang giá trị string thực tế từ định nghĩa const string trong solution.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite phải xanh — pass (2026-10-23 15:39:39 +07:00)
- [x] `check-csharp-tests` (focused): findAffectedTests phát hiện test cho C# qua symbol reference — pass (2026-10-23 15:36:57 +07:00)
- [x] `check-csharp-impact` (focused): repo-map --impact mở rộng đồ thị phụ thuộc C# qua .csproj ProjectReference — pass (2026-10-23 15:36:59 +07:00)
- [x] `check-csharp-events` (focused): Lọc test, chuẩn hóa Kafka signature và resolve constant class topic — pass (2026-10-23 15:37:02 +07:00)

## Evidence

- `check-csharp-tests` — pass (2026-10-23 15:36:57 +07:00): pnpm vitest run test/unit/core/repo-map/tests.test.ts — exit 0
- `check-csharp-impact` — pass (2026-10-23 15:36:59 +07:00): pnpm vitest run test/unit/core/repo-map/impact.test.ts — exit 0
- `check-csharp-events` — pass (2026-10-23 15:37:02 +07:00): pnpm vitest run test/unit/core/repo-map/event-discovery.test.ts test/unit/core/repo-map/event-matrix.test.ts — exit 0
- `check-suite` — pass (2026-10-23 15:39:39 +07:00): pnpm test — exit 0
