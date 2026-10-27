# Tối ưu hóa Verify Plan trên .NET và hỗ trợ cấu hình .harnixignore

- **ID:** 20261023-145051-verify-plan-deduplication-and-harnixignore
- **Mode:** lite
- **Epic:** 20261023-141853-enterprise-dotnet-and-context-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-23 14:50:51 +07:00
- **Updated:** 2026-10-23 15:28:24 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Khắc phục hiện tượng chạy test trùng lặp (double testing) trong verify-plan --recursive khi solution cha đã chứa các project con, đồng thời bổ sung cơ chế đọc file cấu hình .harnixignore ở project root để loại trừ các thư mục rác / scratch script / công cụ nội bộ khỏi stack detection và verify plan.

## Relevant paths

- `src/core/repo-map/inventory.ts`
- `src/core/stack/detection.ts`
- `src/core/stack/verify-plan.ts`
- `src/core/stack/workspace-detection.ts`
- `test/unit/core/stack/verify-plan.test.ts`
- `test/unit/core/stack/workspace-detection.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/repo-map/inventory.ts` | modified | +7 / -1 |
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
| `test/unit/core/repo-map/inventory.test.ts` | modified | +17 / -0 |
| `test/unit/core/stack/detection.test.ts` | modified | +15 / -0 |
| `test/unit/core/stack/harnix-ignore.test.ts` | added | - |
| `test/unit/core/stack/verify-plan.test.ts` | modified | +26 / -0 |
| `test/unit/core/stack/workspace-detection.test.ts` | modified | +32 / -0 |
| `test/workflow/legacy-history.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): verify-plan --recursive gộp test command ở cấp .sln cao nhất, tự động loại trừ các test project con đã được solution cover để tránh double testing.
- [x] `ac-2` (met): Harnix hỗ trợ đọc file .harnixignore ở project root (hỗ trợ glob pattern) và bỏ qua các đường dẫn tương ứng trong stack detection, workspace detection và repo-map inventory.
- [x] `ac-3` (met): Test suite bao phủ trường hợp solution .NET đa tầng, kiểm chứng không còn cảnh báo sai cho thư mục như SignTest khi được khai báo trong .harnixignore hoặc không có test.

## Required checks

- [x] `check-harnixignore` (focused): Kiểm tra cơ chế bỏ qua file theo cấu hình .harnixignore — pass (2026-10-23 15:05:50 +07:00)
- [x] `check-suite-v2` (full): Replacement for check-suite — pass (2026-10-23 15:28:05 +07:00)
- [x] `check-workspace-dedup` (focused): Kiểm tra khử trùng lặp test giữa solution và test projects — pass (2026-10-23 15:05:41 +07:00)

## Evidence

- `check-workspace-dedup` — pass (2026-10-23 15:05:41 +07:00): pnpm vitest run test/unit/core/stack/workspace-detection.test.ts test/unit/core/stack/verify-plan.test.ts — exit 0
- `check-harnixignore` — pass (2026-10-23 15:05:50 +07:00): pnpm vitest run test/unit/core/stack/detection.test.ts test/unit/core/repo-map/inventory.test.ts — exit 0
- `check-suite` — fail (2026-10-23 15:14:25 +07:00): pnpm test — exit 1 _(2 earlier reruns not shown; see task.json for full history)_
- skipped (2026-10-23 15:26:07 +07:00): Task contract revised at persisted replan: Bổ sung package.json vào inputs và thử lại toàn bộ test suite sau khi đồng bộ SKILL.md
- `check-suite-v2` — pass (2026-10-23 15:28:05 +07:00): pnpm test — exit 0
