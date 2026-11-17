# --outline nhận tên class và khóa bằng test hành vi overload, partial

- **ID:** 20261116-165145-repo-map-class-lookup
- **Mode:** lite
- **Epic:** 20261116-165141-repo-map-usability
- **Status:** completed/finishing
- **Created:** 2026-11-16 16:51:40 +07:00
- **Updated:** 2026-11-16 17:38:31 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

--outline chấp nhận tên class hoặc symbol khi không có file nào trùng đường dẫn, và hành vi với overload, partial class và tên trùng ở nhiều class được ghim bằng test.

## Non-goals

- Không đổi định dạng đã có của các trường hiện hành; chỉ thêm trường hoặc cờ mới.

## Relevant paths

- `src/core/repo-map/outline.ts`
- `src/core/repo-map/outline-helpers.ts`
- `src/commands/repo-map-internal.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +9 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +34 / -5 |
| `src/cli-workflow-commands.ts` | modified | +2 / -0 |
| `src/commands/repo-map-internal.ts` | modified | +24 / -33 |
| `src/commands/repo-map-root.ts` | added | - |
| `src/core/repo-map/class-lookup.ts` | added | - |
| `src/core/repo-map/compact.ts` | modified | +7 / -1 |
| `src/core/repo-map/impact.ts` | modified | +2 / -0 |
| `src/core/repo-map/outline-body.ts` | modified | +12 / -1 |
| `src/core/repo-map/path-hints.ts` | added | - |
| `src/core/repo-map/refs.ts` | modified | +36 / -6 |
| `src/core/repo-map/search-terms.ts` | modified | +13 / -0 |
| `src/core/repo-map/search.ts` | modified | +29 / -8 |
| `src/core/repo-map/service.ts` | modified | +40 / -6 |
| `src/core/repo-map/symbol-matches.ts` | added | - |
| `src/core/repo-map/tests.ts` | modified | +2 / -0 |
| `src/core/repo-map/types.ts` | modified | +18 / -0 |
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
| `test/integration/commands/repo-map-root.test.ts` | added | - |
| `test/integration/scenarios/repo-map-paths.test.ts` | added | - |
| `test/integration/scenarios/repo-map-refs-paging.test.ts` | added | - |
| `test/unit/cli-helpers.test.ts` | modified | +19 / -0 |
| `test/unit/core/repo-map/class-lookup.test.ts` | added | - |
| `test/unit/core/repo-map/compact.test.ts` | modified | +37 / -2 |
| `test/unit/core/repo-map/outline-body.test.ts` | modified | +15 / -0 |
| `test/unit/core/repo-map/path-hints.test.ts` | added | - |
| `test/unit/core/repo-map/refs.test.ts` | modified | +107 / -0 |
| `test/unit/core/repo-map/search-terms.test.ts` | modified | +14 / -1 |
| `test/unit/core/repo-map/search.test.ts` | modified | +29 / -0 |
| `test/unit/core/repo-map/service.test.ts` | modified | +50 / -1 |
| `test/unit/core/repo-map/symbol-matches.test.ts` | added | - |
| `test/workflow/cli-contract.test.ts` | modified | +2 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): `--outline <Tên>` khi `<Tên>` không phải đường dẫn trong bản đồ nhưng là tên class hoặc type được khai báo trong đúng một file thì trả outline của file đó; khai báo ở nhiều file (partial class) thì trả danh sách các file kèm dòng, không đoán.
- [x] `ac-2` (met): Test C# khóa hành vi hiện tại: overload của một method là các mục riêng có container và khoảng dòng riêng, cùng tên ở hai class khác nhau được phân biệt bằng container, và `--refs` trả cả file partial.

## Required checks

- [x] `chk-1` (focused): Test tập trung của repo-map-class-lookup — pass (2026-11-16 17:36:39 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-16 17:38:05 +07:00)

## Evidence

- `chk-1` — pass (2026-11-16 17:36:39 +07:00): pnpm exec vitest run test/unit/core/repo-map/outline.test.ts test/unit/core/repo-map/refs.test.ts test/unit/core/repo-map/extract-symbols.test.ts test/integration/commands/repo-map-internal.test.ts — exit 0
- `chk-2` — pass (2026-11-16 17:38:05 +07:00): pnpm test — exit 0
