# Tối ưu hóa Token Hook: Chuyển sang Lean Context Injection tránh tràn mã nguồn vào prompt

- **ID:** 20261023-145111-lean-context-injection-and-token-optimization
- **Mode:** lite
- **Epic:** 20261023-141853-enterprise-dotnet-and-context-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-23 14:51:11 +07:00
- **Updated:** 2026-10-23 15:54:00 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Tái cấu trúc hook renderInternalContext sang Lean Context: mặc định chỉ chèn metadata và task structure tóm tắt (< 300 tokens) thay vì dump toàn bộ raw source code của tất cả các file trong relevantPaths; bổ sung tùy chọn contextMode: lean | full trong cấu hình.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/config/config-schema.ts` | modified | +3 / -3 |
| `src/core/config/config-validate.ts` | modified | +3 / -0 |
| `src/core/config/config.ts` | modified | +2 / -0 |
| `src/core/context/effective-context.ts` | modified | +30 / -7 |
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
| `test/unit/core/context/effective-context.test.ts` | modified | +67 / -0 |
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +42 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +66 / -0 |
| `test/unit/core/repo-map/impact.test.ts` | modified | +21 / -0 |
| `test/unit/core/repo-map/inventory.test.ts` | modified | +17 / -0 |
| `test/unit/core/repo-map/tests.test.ts` | modified | +30 / -0 |
| `test/unit/core/stack/detection.test.ts` | modified | +15 / -0 |
| `test/unit/core/stack/harnix-ignore.test.ts` | added | - |
| `test/unit/core/stack/verify-plan.test.ts` | modified | +26 / -0 |
| `test/unit/core/stack/workspace-detection.test.ts` | modified | +32 / -0 |
| `test/workflow/internal-context-boundary.test.ts` | modified | +1 / -0 |
| `test/workflow/internal-context-hooks.test.ts` | modified | +15 / -5 |
| `test/workflow/legacy-history.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): renderInternalContext mặc định trả về lean metadata context (Task ID, status, goal, relevant paths outline) thay vì raw file bodies.
- [x] `ac-2` (met): Hỗ trợ cấu hình context.mode: 'lean' | 'full' trong .harnix/config.yaml để người dùng chủ động cấu hình khi cần full dump.
- [x] `ac-3` (met): Test suite kiểm tra định dạng và kích thước payload của hook không vượt quá budget lean token và tương thích an toàn với các platform hooks.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite phải xanh — pass (2026-10-23 15:53:23 +07:00)
- [x] `check-lean-context` (focused): Kiểm tra lean metadata context và tùy chọn config context.mode — pass (2026-10-23 15:51:03 +07:00)

## Evidence

- `check-lean-context` — pass (2026-10-23 15:51:03 +07:00): pnpm vitest run test/unit/core/context/effective-context.test.ts test/workflow/internal-context-boundary.test.ts test/workflow/internal-context-hooks.test.ts — exit 0
- `check-suite` — pass (2026-10-23 15:53:23 +07:00): pnpm test — exit 0
