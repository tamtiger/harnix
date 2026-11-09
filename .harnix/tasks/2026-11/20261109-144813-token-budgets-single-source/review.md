# Đưa mọi trần token về một nơi và đo mức dùng

- **ID:** 20261109-144813-token-budgets-single-source
- **Mode:** lite
- **Epic:** 20261109-144812-skills-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-09 14:48:12 +07:00
- **Updated:** 2026-11-09 15:04:20 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Một module hằng số giữ mọi trần token (skill 2000, harnix-plan 1700, reference 1200, workflow 2500, khối luôn nạp 1500, đường nạp trực tiếp 3600, đường nạp task Full 11000); test và script đo cùng đọc từ đó, và có test trần cho từng reference.

## Relevant paths

- `scripts/measure-tokens.mjs`
- `src/templates/harnix/activation.ts`
- `src/templates/harnix/token-budgets.ts`
- `test/workflow/instruction-budget.test.ts`
- `test/workflow/lean-workflow.test.ts`
- `test/workflow/measure-tokens.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +5 / -1 |
| `scripts/token-budget-usage.mjs` | added | - |
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
| `src/templates/harnix/activation.ts` | modified | +2 / -1 |
| `src/templates/harnix/token-budgets.json` | added | - |
| `src/templates/harnix/token-budgets.ts` | added | - |
| `test/unit/templates/harnix/token-budgets.test.ts` | added | - |
| `test/workflow/instruction-budget.test.ts` | modified | +37 / -14 |
| `test/workflow/lean-workflow.test.ts` | modified | +4 / -5 |
| `test/workflow/measure-tokens.test.ts` | modified | +46 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): src/templates/harnix/token-budgets.ts là nơi duy nhất giữ các trần (skill 2000, harnix-plan 1700, reference 1200, workflow 2500, khối luôn nạp 1500, đường nạp trực tiếp 3600, đường nạp task Full 11000); instruction-budget.test.ts, lean-workflow.test.ts, measure-tokens.mjs và chú thích trong activation.ts đọc từ đó, và phép tính 40% của mốc 6166 bị bỏ.
- [x] `ac-2` (met): Có test trần cho từng file reference (1200 token); reference đang vượt (epic.md, domain-briefs.md) nằm trong một danh sách miễn trừ chỉ được co lại, kèm member sẽ gỡ từng file; một file reference mới vượt trần làm test đỏ.
- [x] `ac-3` (met): pnpm measure:tokens in thêm mức đã dùng (phần trăm so với trần) cho skill, reference và workflow.md, để thấy file nào sát trần.
- [x] `ac-4` (met): Tài liệu và snapshot đồng bộ: AGENTS.md, docs/HARNIX_WORKFLOW.md, docs/HARNIX_PRD.md và docs/IMPLEMENTATION_PLAN.md nếu bề mặt công khai đổi; pnpm selfhost:sync khi template workflow đổi; behavior-snapshot.golden.json chỉ đổi đúng chuỗi mới; bump 2.30.0-dev.N (member cuối đóng 2.30.0 bằng --fold-dev) kèm CHANGELOG trước verifying.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 15:02:14 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 15:02:22 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 15:03:50 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 15:02:14 +07:00): pnpm exec vitest run test/workflow/instruction-budget.test.ts test/workflow/lean-workflow.test.ts test/workflow/measure-tokens.test.ts — exit 0
- `chk-gates` — pass (2026-11-09 15:02:22 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-09 15:03:50 +07:00): pnpm test — exit 0
