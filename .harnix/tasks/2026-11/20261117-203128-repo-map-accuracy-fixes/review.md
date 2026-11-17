# Sửa độ chính xác repo-map: --tests, --outline --offset, --refs chuỗi, help JSON

- **ID:** 20261117-203128-repo-map-accuracy-fixes
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-17 20:31:28 +07:00
- **Updated:** 2026-11-17 20:44:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Sửa --tests bỏ sót test PHP và nhầm view test_*.php, thêm --offset cho --outline, đánh dấu tham chiếu trong chuỗi ở --refs, ghi rõ output JSON trong help.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +2 / -1 |
| `src/cli-workflow-commands.ts` | modified | +8 / -2 |
| `src/commands/repo-map-internal.ts` | modified | +3 / -0 |
| `src/core/repo-map/extract.ts` | modified | +21 / -7 |
| `src/core/repo-map/outline-helpers.ts` | modified | +18 / -0 |
| `src/core/repo-map/outline-markdown.ts` | added | - |
| `src/core/repo-map/outline.ts` | modified | +11 / -29 |
| `src/core/repo-map/refs.ts` | modified | +7 / -4 |
| `src/core/repo-map/service.ts` | modified | +3 / -1 |
| `src/core/repo-map/test-content.ts` | added | - |
| `src/core/repo-map/tests.ts` | modified | +3 / -0 |
| `src/core/repo-map/types.ts` | modified | +4 / -0 |
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
| `test/unit/cli-helpers.test.ts` | modified | +4 / -1 |
| `test/unit/core/repo-map/extract.test.ts` | modified | +2 / -0 |
| `test/unit/core/repo-map/outline-markdown.test.ts` | added | - |
| `test/unit/core/repo-map/refs.test.ts` | modified | +29 / -0 |
| `test/unit/core/repo-map/service.test.ts` | modified | +36 / -0 |
| `test/unit/core/repo-map/test-content.test.ts` | added | - |
| `test/unit/core/repo-map/tests.test.ts` | modified | +16 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): repo-map --tests liệt kê test tham chiếu tên lớp của target qua references (không cần new/typeof) và không coi view test_*.php dưới thư mục views/templates là test
- [x] `ac-2` (met): repo-map --outline nhận --offset và trả nextOffset để phân trang đủ ký hiệu của file lớn
- [x] `ac-3` (met): repo-map --refs gắn kind string cho dòng chỉ chứa ký hiệu trong chuỗi ký tự, help ghi rõ output là JSON một dòng

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-17 20:43:54 +07:00)
- [x] `check-focused` (focused): Test repo-map và cli-helpers — pass (2026-11-17 20:41:47 +07:00)

## Evidence

- `check-focused` — pass (2026-11-17 20:41:47 +07:00): pnpm exec vitest run --coverage.enabled=false test/unit/core/repo-map test/unit/cli-helpers.test.ts test/integration/commands/repo-map-internal.test.ts test/unit/cli.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-17 20:43:54 +07:00): pnpm test — exit 0
