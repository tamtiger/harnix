# --query trả đúng symbol khớp từ khóa và cho loại file không phải source

- **ID:** 20261116-165143-repo-map-query-symbols
- **Mode:** lite
- **Epic:** 20261116-165141-repo-map-usability
- **Status:** completed/finishing
- **Created:** 2026-11-16 16:51:40 +07:00
- **Updated:** 2026-11-16 17:20:14 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Kết quả --query cho biết symbol nào khớp từ khóa kèm số dòng thay vì 50 tên đầu theo thứ tự chữ cái, và có tùy chọn bỏ file tài liệu.

## Non-goals

- Không đổi định dạng đã có của các trường hiện hành; chỉ thêm trường hoặc cờ mới.

## Relevant paths

- `src/core/repo-map/search.ts`
- `src/core/repo-map/compact.ts`
- `src/core/repo-map/types.ts`
- `src/commands/repo-map-internal.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +16 / -1 |
| `src/cli-workflow-commands.ts` | modified | +1 / -0 |
| `src/commands/repo-map-internal.ts` | modified | +18 / -20 |
| `src/commands/repo-map-root.ts` | added | - |
| `src/core/repo-map/compact.ts` | modified | +6 / -0 |
| `src/core/repo-map/impact.ts` | modified | +2 / -0 |
| `src/core/repo-map/outline-body.ts` | modified | +12 / -1 |
| `src/core/repo-map/path-hints.ts` | added | - |
| `src/core/repo-map/search.ts` | modified | +29 / -8 |
| `src/core/repo-map/service.ts` | modified | +29 / -4 |
| `src/core/repo-map/symbol-matches.ts` | added | - |
| `src/core/repo-map/tests.ts` | modified | +2 / -0 |
| `src/core/repo-map/types.ts` | modified | +14 / -0 |
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
| `test/unit/cli-helpers.test.ts` | modified | +10 / -0 |
| `test/unit/core/repo-map/compact.test.ts` | modified | +27 / -0 |
| `test/unit/core/repo-map/outline-body.test.ts` | modified | +15 / -0 |
| `test/unit/core/repo-map/path-hints.test.ts` | added | - |
| `test/unit/core/repo-map/search.test.ts` | modified | +29 / -0 |
| `test/unit/core/repo-map/service.test.ts` | modified | +50 / -1 |
| `test/unit/core/repo-map/symbol-matches.test.ts` | added | - |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Mỗi kết quả của `--query` có danh sách `matchedSymbols` gồm tên, loại, container và dòng bắt đầu của các symbol có tên khớp từ khóa (tối đa 5), được xếp theo mức khớp chứ không theo thứ tự chữ cái.
- [x] `ac-2` (met): Một file có symbol trùng khít tên với từ khóa được xếp cao hơn file chỉ chứa từ khóa trong danh sách identifier hoặc tiêu đề.
- [x] `ac-3` (met): Cờ `--source-only` bỏ khỏi kết quả `--query` các file có kind tài liệu, manifest và config; không có cờ thì kết quả cũ không đổi.

## Required checks

- [x] `chk-1` (focused): Test tập trung của repo-map-query-symbols — pass (2026-11-16 17:16:27 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-16 17:20:09 +07:00)

## Evidence

- `chk-1` — pass (2026-11-16 17:16:27 +07:00): pnpm exec vitest run test/unit/core/repo-map/search.test.ts test/unit/core/repo-map/compact.test.ts test/integration/commands/repo-map-internal.test.ts — exit 0
- `chk-2` — pass (2026-11-16 17:20:09 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
