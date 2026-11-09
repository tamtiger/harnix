# Refactor skill chính plan, implement, verify và reference của chúng

- **ID:** 20261109-144815-main-skills-refactor
- **Mode:** lite
- **Epic:** 20261109-144812-skills-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-09 14:48:12 +07:00
- **Updated:** 2026-11-09 15:26:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Gọn harnix-verify (≤ 1700, tách phần finish/cancel còn dòng trỏ), harnix-plan (≤ 1550, trần 1700) và harnix-implement (≤ 1700) mà không mất quy tắc nào; tách phần Multi-Agent Worktree khỏi epic.md để mỗi reference ≤ 1200.

## Relevant paths

- `src/skills/harnix-implement/SKILL.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/skills/harnix-plan/references/epic.md`
- `src/skills/harnix-verify/SKILL.md`
- `src/skills/harnix-verify/references/finish-cancel.md`
- `test/workflow/skill-sources.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +5 / -1 |
| `scripts/token-budget-usage.mjs` | added | - |
| `src/skills/catalog.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +4 / -4 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-plan/references/epic-git.md` | added | - |
| `src/skills/harnix-plan/references/epic.md` | modified | +5 / -19 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +5 / -5 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +4 / -0 |
| `src/skills/harnix-verify/references/gates.md` | modified | +2 / -1 |
| `src/templates/harnix/activation.ts` | modified | +2 / -1 |
| `src/templates/harnix/token-budgets.json` | added | - |
| `src/templates/harnix/token-budgets.ts` | added | - |
| `src/templates/harnix/workflow.md` | modified | +19 / -26 |
| `test/integration/commands/skills.test.ts` | modified | +2 / -1 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/skills/catalog.test.ts` | modified | +1 / -4 |
| `test/unit/skills/technique-skills.test.ts` | modified | +3 / -2 |
| `test/unit/templates/harnix/token-budgets.test.ts` | added | - |
| `test/workflow/gates-parity.test.ts` | added | - |
| `test/workflow/instruction-budget.test.ts` | modified | +37 / -14 |
| `test/workflow/lean-workflow.test.ts` | modified | +4 / -5 |
| `test/workflow/measure-tokens.test.ts` | modified | +46 / -0 |
| `test/workflow/reference-rules.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): harnix-verify/SKILL.md ≤ 1700, harnix-plan/SKILL.md ≤ 1550 và harnix-implement/SKILL.md ≤ 1700 token; phần finish và cancel của harnix-verify chỉ còn dòng trỏ vào reference finish-cancel; các test skill-sources và needle xanh, nghĩa là không mất quy tắc nào.
- [x] `ac-2` (met): harnix-plan/references/epic.md ≤ 1200 token sau khi tách phần Multi-Agent Worktree sang một reference riêng; mỗi reference mới có đúng một dòng trỏ tới nó trong SKILL.md hoặc epic.md; epic.md ra khỏi danh sách miễn trừ trần reference.
- [x] `ac-3` (met): Description của các skill (trigger) không đổi, và dòng phiên bản của mỗi SKILL.md đã cập nhật theo checklist sửa SKILL.md.
- [x] `ac-4` (met): Tài liệu và snapshot đồng bộ: AGENTS.md, docs/HARNIX_WORKFLOW.md, docs/HARNIX_PRD.md và docs/IMPLEMENTATION_PLAN.md nếu bề mặt công khai đổi; pnpm selfhost:sync khi template workflow đổi; behavior-snapshot.golden.json chỉ đổi đúng chuỗi mới; bump 2.30.0-dev.N (member cuối đóng 2.30.0 bằng --fold-dev) kèm CHANGELOG trước verifying.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 15:23:55 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 15:24:04 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 15:25:31 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 15:23:55 +07:00): pnpm exec vitest run test/workflow — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 15:24:04 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-09 15:25:31 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
