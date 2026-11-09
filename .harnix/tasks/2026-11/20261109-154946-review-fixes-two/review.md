# Sửa các phát hiện review của epic skills-workflow-refactor

- **ID:** 20261109-154946-review-fixes-two
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-09 15:49:46 +07:00
- **Updated:** 2026-11-09 15:58:54 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Khép các phát hiện review: pointer epic-git đủ rộng, bảng sở hữu quy tắc ghi đúng chủ và test kiểm nội dung, quy tắc --task và git checkout trở lại workflow.md, README liệt kê domain-briefs-operations, measureInstructionFiles có test, và ghi decision về việc nâng trần.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +15 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `docs/RULE_OWNERSHIP.md` | added | - |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +5 / -1 |
| `scripts/token-budget-usage.mjs` | added | - |
| `src/skills/catalog.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-arch-review/references/domain-briefs-operations.md` | added | - |
| `src/skills/harnix-arch-review/references/domain-briefs.md` | modified | +1 / -32 |
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
| `src/skills/technique-skills.ts` | modified | +2 / -0 |
| `src/templates/harnix/activation.ts` | modified | +2 / -1 |
| `src/templates/harnix/token-budgets.json` | added | - |
| `src/templates/harnix/token-budgets.ts` | added | - |
| `src/templates/harnix/workflow.md` | modified | +19 / -24 |
| `test/integration/commands/skills.test.ts` | modified | +2 / -1 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/skills/catalog.test.ts` | modified | +1 / -4 |
| `test/unit/skills/technique-skills.test.ts` | modified | +8 / -3 |
| `test/unit/templates/harnix/token-budgets.test.ts` | added | - |
| `test/workflow/gates-parity.test.ts` | added | - |
| `test/workflow/instruction-budget.test.ts` | modified | +37 / -14 |
| `test/workflow/lean-workflow.test.ts` | modified | +4 / -5 |
| `test/workflow/measure-tokens.test.ts` | modified | +69 / -0 |
| `test/workflow/reference-rules.test.ts` | modified | +1 / -1 |
| `test/workflow/rule-ownership.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Dòng trỏ trong harnix-plan/SKILL.md tới reference epic-git nêu cả chuyển task với cây làm việc chưa sạch, quy tắc Git branching và worktree/subagent, để agent chuyển task bình thường biết cần nạp nó.
- [x] `ac-2` (met): docs/RULE_OWNERSHIP.md ghi đúng chủ của nhóm Secret (secret-scan.ts và mục Agent transport của workflow.md, không phải mục Secrets không tồn tại của AGENTS.md); test rule-ownership kiểm thêm rằng file chủ chứa cụm từ đặc trưng của quy tắc, để chủ sai làm test đỏ.
- [x] `ac-3` (met): workflow.md có lại quy tắc --task <id> (sửa task chưa kết thúc khác mà không đổi pointer) và cụm never pipe git checkout trong Commit discipline, mà vẫn không quá trần 2500 và gần 2200 token.
- [x] `ac-4` (met): README.md liệt kê domain-briefs-operations cạnh domain-briefs; measureInstructionFiles có test trên một cây tạm và comment nói rõ con số đo file thô nên xấp xỉ so với gate.
- [x] `ac-5` (met): Một decision của task ghi việc nâng trần (skill 1800 sang 2000, harnix-plan 1630 sang 1700) là quyết định đã thống nhất của epic skills-workflow-refactor, không phải nâng để qua test.
- [x] `ac-6` (met): Tài liệu và snapshot đồng bộ: pnpm selfhost:sync khi template workflow đổi, golden chỉ đổi đúng chuỗi mới, bump patch 2.30.1 kèm CHANGELOG trước verifying.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-09 15:58:10 +07:00)
- [x] `chk-focus` (focused): Test tập trung của các sửa review — pass (2026-11-09 15:56:35 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 15:56:43 +07:00)

## Decisions

- **dec-ceilings-agreed** — Việc nâng trần skill 1800 lên 2000 và harnix-plan 1630 lên 1700 là quyết định đã thống nhất của epic skills-workflow-refactor, không nâng để một thay đổi qua test.
  - _Why:_ Người dùng yêu cầu nâng trần kèm refactor; hai trần đường nạp được hạ (4000 xuống 3600, 15000 xuống 11000) để tổng chi phí không phình.

## Evidence

- `chk-focus` — pass (2026-11-09 15:56:35 +07:00): pnpm exec vitest run test/workflow test/unit/skills test/unit/templates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 15:56:43 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-09 15:58:10 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
