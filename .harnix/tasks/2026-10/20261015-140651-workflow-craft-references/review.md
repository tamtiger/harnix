# Bổ sung các craft references từ hai repo nguồn vào workflow skills của Harnix

- **ID:** 20261015-140651-workflow-craft-references
- **Mode:** lite
- **Epic:** 20261015-140650-harnix-craft-and-quality-adoption
- **Status:** completed/finishing
- **Created:** 2026-10-15 14:06:50 +07:00
- **Updated:** 2026-10-15 14:29:39 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Bổ sung các references: decision-discipline (5 quy tắc thẩm định), brownfield, commit-hygiene, so-what, technical-recap, scouting-isolation (Status Protocol) vào workflow skills.

## Relevant paths

- `package.json`
- `src/skills/catalog.ts`
- `src/skills/harnix-implement/SKILL.md`
- `src/skills/harnix-implement/references/brownfield.md`
- `src/skills/harnix-implement/references/commit-hygiene.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/skills/harnix-plan/references/decision-discipline.md`
- `src/skills/harnix-research/SKILL.md`
- `src/skills/harnix-research/references/scouting-isolation.md`
- `src/skills/harnix-verify/SKILL.md`
- `src/skills/harnix-verify/references/so-what.md`
- `src/skills/harnix-verify/references/technical-recap.md`
- `test/integration/commands/skills.test.ts`
- `test/unit/skills/catalog.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [x] `ac-1` (met): Tạo và wire thành công các references: decision-discipline (harnix-plan), brownfield và commit-hygiene (harnix-implement), so-what và technical-recap (harnix-verify), scouting-isolation (harnix-research).
- [x] `ac-2` (met): test/unit/skills/catalog.test.ts và test/integration/commands/skills.test.ts pass 100% với các references mới.
- [x] `ac-3` (met): Phiên bản package được bump thành 2.6.0-dev.2 qua pnpm version:sync.

## Required checks

- [x] `check-1` (focused): Kiểm tra danh mục skill references và integration command — pass (2026-10-15 14:29:04 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-15 14:28:43 +07:00)

## Evidence

- `check-1` — pass (2026-10-15 14:29:04 +07:00): pnpm vitest run test/unit/skills/catalog.test.ts test/integration/commands/skills.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-15 14:28:43 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
