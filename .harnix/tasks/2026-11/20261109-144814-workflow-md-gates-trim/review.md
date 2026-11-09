# Gọn workflow.md và các khối luôn nạp, đẩy chi tiết Gates sang reference

- **ID:** 20261109-144814-workflow-md-gates-trim
- **Mode:** lite
- **Epic:** 20261109-144812-skills-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-09 14:48:12 +07:00
- **Updated:** 2026-11-09 15:16:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Đưa workflow.md về khoảng 2200 token bằng cách rút mỗi mục Gates còn một dòng trỏ vào harnix-verify --reference gates, không mất quy tắc nào, và có chỗ cho --remove-check, lệnh gộp evidence + criterion và quy ước thời điểm review.

## Relevant paths

- `.harnix/workflow.md`
- `src/skills/harnix-verify/references/gates.md`
- `src/templates/harnix/workflow.md`
- `test/workflow/lean-workflow.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
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
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +4 / -0 |
| `src/skills/harnix-verify/references/gates.md` | modified | +2 / -1 |
| `src/templates/harnix/activation.ts` | modified | +2 / -1 |
| `src/templates/harnix/token-budgets.json` | added | - |
| `src/templates/harnix/token-budgets.ts` | added | - |
| `src/templates/harnix/workflow.md` | modified | +19 / -26 |
| `test/unit/templates/harnix/token-budgets.test.ts` | added | - |
| `test/workflow/gates-parity.test.ts` | added | - |
| `test/workflow/instruction-budget.test.ts` | modified | +37 / -14 |
| `test/workflow/lean-workflow.test.ts` | modified | +4 / -5 |
| `test/workflow/measure-tokens.test.ts` | modified | +46 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): src/templates/harnix/workflow.md ≤ 2200 token (trần 2500): mỗi mục Gates còn một dòng nêu tên cổng và trỏ vào harnix skill harnix-verify --reference gates; mọi quy tắc bị rút đều còn trong gates.md (test parity bắt quy tắc bị mất).
- [x] `ac-2` (met): Cookbook trong workflow.md có --remove-check, --evidence ... --criterion --met và một dòng quy ước thời điểm review (task đơn lẻ sau implement, epic sau khi implement hết member) mà vẫn ≤ 2200 token.
- [x] `ac-3` (met): Các khối luôn nạp (steering Kiro/Antigravity, khối Claude, khối Codex, bootstrap AGENTS.md) giữ nguyên ≤ 1500 token; pnpm selfhost:sync cho kết quả đồng bộ và .harnix/workflow.md khớp template.
- [x] `ac-4` (met): Tài liệu và snapshot đồng bộ: AGENTS.md, docs/HARNIX_WORKFLOW.md, docs/HARNIX_PRD.md và docs/IMPLEMENTATION_PLAN.md nếu bề mặt công khai đổi; pnpm selfhost:sync khi template workflow đổi; behavior-snapshot.golden.json chỉ đổi đúng chuỗi mới; bump 2.30.0-dev.N (member cuối đóng 2.30.0 bằng --fold-dev) kèm CHANGELOG trước verifying.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 15:14:02 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 15:14:11 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 15:15:58 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 15:14:02 +07:00): pnpm exec vitest run test/workflow — exit 0
- `chk-gates` — pass (2026-11-09 15:14:11 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-09 15:15:58 +07:00): pnpm test — exit 0
