# Đo token đúng, nâng sàn test và đồng bộ tài liệu

- **ID:** 20261113-220246-token-and-docs-hygiene
- **Mode:** lite
- **Epic:** 20261113-220240-harnix-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 22:02:39 +07:00
- **Updated:** 2026-11-14 02:41:26 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Các số đo và sàn kiểm tra phản ánh đúng thực tế, và tài liệu không còn mâu thuẫn với code; member cuối đóng epic bằng release 2.33.0.

## Non-goals

- Không tách file sát trần (A4, A5, A11) và không gom helper trùng (A7); để task sau.

## Relevant paths

- `scripts/measure-tokens.mjs`
- `scripts/token-budget-usage.mjs`
- `src/templates/harnix/token-budgets.json`
- `test/unit/test-structure.test.ts`
- `vitest.config.ts`
- `docs`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +5 / -4 |
| `CHANGELOG.md` | modified | +30 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +5 / -3 |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +3 / -3 |
| `scripts/token-budget-usage.mjs` | modified | +45 / -2 |
| `src/commands/workflow-flags.ts` | modified | +3 / -1 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +13 / -2 |
| `src/core/doctor/finding-codes-global.ts` | modified | +1 / -0 |
| `src/core/doctor/finding-codes-project.ts` | modified | +1 / -0 |
| `src/core/doctor/global-inspect.ts` | modified | +8 / -4 |
| `src/core/doctor/global-linked.ts` | added | - |
| `src/core/doctor/global.ts` | modified | +60 / -21 |
| `src/core/doctor/project-runtime.ts` | modified | +19 / -3 |
| `src/core/global/uninstall.ts` | modified | +4 / -1 |
| `src/core/platform/facts.ts` | modified | +2 / -2 |
| `src/core/platform/records.ts` | modified | +1 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +3 / -1 |
| `src/core/workflow/obligations.ts` | modified | +3 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +3 / -1 |
| `src/core/workflow/run-check.ts` | modified | +4 / -0 |
| `src/core/workflow/save.ts` | modified | +4 / -1 |
| `src/core/workflow/schema.ts` | modified | +2 / -2 |
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
| `src/templates/harnix/token-budgets.json` | modified | +1 / -0 |
| `src/templates/harnix/token-budgets.ts` | modified | +2 / -0 |
| `src/templates/harnix/workflow.md` | modified | +1 / -1 |
| `test/README.md` | modified | +2 / -2 |
| `test/integration/commands/workflow-error-hints.test.ts` | added | - |
| `test/unit/commands/workflow-lifecycle-handlers.test.ts` | modified | +17 / -0 |
| `test/unit/core/doctor/global-inspect.test.ts` | modified | +28 / -1 |
| `test/unit/core/doctor/global-linked.test.ts` | added | - |
| `test/unit/core/doctor/global.test.ts` | modified | +11 / -0 |
| `test/unit/core/doctor/project-runtime.test.ts` | modified | +16 / -1 |

_(6 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): measure:tokens dùng đúng trần techniqueSkill cho skill technique (TOK-02) và báo thêm tổng mô tả của các skill harnix-* trong danh sách skill, có trần trong token-budgets.json (TOK-01).
- [x] `ac-2` (met): Sàn BASELINE trong test-structure.test.ts và ngưỡng trong vitest.config.ts được nâng sát số đo thật, không hạ ngưỡng nào (A8, P3-3).
- [x] `ac-3` (met): Tài liệu được sửa theo phát hiện: schema.ts mô tả đúng bố cục epic, sơ đồ phụ thuộc trong AGENTS.md/PRD/IMPLEMENTATION_PLAN không nhắc src/migration và nêu src/catalog, src/guides, HARNIX_WORKFLOW.md khớp công thức digest chuẩn hóa CRLF (A2, A9, P3-7).

## Required checks

- [x] `chk-focused` (focused): Test ngân sách token, cấu trúc test và tài liệu — pass (2026-11-13 22:49:10 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-11-13 22:51:07 +07:00)

## Decisions

- **dec-source** — Nguồn của task: báo cáo review toàn bộ Harnix ngày 2026-11-13 (research.md của epic).
  - _Why:_ Mỗi tiêu chí là một phát hiện đã được nhóm review nêu kèm file:dòng; phải đối chiếu lại với mã hiện tại trước khi chuyển sang ready.

## Evidence

- `chk-focused` — pass (2026-11-13 22:49:10 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-11-13 22:51:07 +07:00): pnpm test — exit 0
