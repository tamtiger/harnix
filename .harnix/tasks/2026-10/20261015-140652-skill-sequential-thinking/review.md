# Xây dựng technique skill thứ 6: harnix-sequential-thinking

- **ID:** 20261015-140652-skill-sequential-thinking
- **Mode:** lite
- **Epic:** 20261015-140650-harnix-craft-and-quality-adoption
- **Status:** completed/finishing
- **Created:** 2026-10-15 14:06:50 +07:00
- **Updated:** 2026-10-15 14:35:36 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Xây dựng technique skill harnix-sequential-thinking thuần markdown, frontmatter chuẩn Harnix, cập nhật catalog, PRD, workflow và tests.

## Relevant paths

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `package.json`
- `src/skills/harnix-sequential-thinking/SKILL.md`
- `src/skills/technique-skills.ts`
- `test/unit/skills/technique-skills.test.ts`
- `test/workflow/skill-sources.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [x] `ac-1` (met): Tạo skill src/skills/harnix-sequential-thinking/SKILL.md tuân thủ frontmatter chuẩn, ngân sách token <= 1200 và heading Evidence and Rationale.
- [x] `ac-2` (met): Đăng ký technique skill thứ 6 trong src/skills/technique-skills.ts và test/unit/skills/technique-skills.test.ts, test/workflow/skill-sources.test.ts pass 100%.
- [x] `ac-3` (met): Phiên bản package được bump thành 2.6.0-dev.3 qua pnpm version:sync.

## Required checks

- [x] `check-1` (focused): Kiểm tra technique skills catalog và skill sources — pass (2026-10-15 14:33:59 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-15 14:35:23 +07:00)

## Evidence

- `check-1` — pass (2026-10-15 14:33:59 +07:00): pnpm vitest run test/unit/skills/technique-skills.test.ts test/workflow/skill-sources.test.ts — exit 0
- `check-suite` — pass (2026-10-15 14:35:23 +07:00): pnpm test — exit 0
