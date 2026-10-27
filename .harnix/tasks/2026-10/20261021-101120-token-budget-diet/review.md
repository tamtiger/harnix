# Cắt giảm ngân sách token của khối hướng dẫn luôn nạp (always-loaded)

- **ID:** 20261021-101120-token-budget-diet
- **Mode:** lite
- **Epic:** 20261021-101119-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-21 10:11:19 +07:00
- **Updated:** 2026-10-21 10:36:40 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Rút gọn template activation.ts và agents.ts từ 1.493 tokens xuống ~1.300 tokens, giải phóng dư địa an toàn dưới trần 1.500 tokens

## Non-goals

- Không lược bỏ các luật an toàn cốt lõi

## Relevant paths

- `src/templates/harnix/activation.ts`
- `src/templates/harnix/agents.ts`
- `test/workflow/activation-instructions.test.ts`
- `test/workflow/instruction-budget.test.ts`
- `test/workflow/persistence-guidance.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
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
| `src/templates/harnix/activation.ts` | modified | +2 / -2 |
| `src/templates/harnix/agents.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Khối always-loaded instruction đo bằng measure:tokens và instruction-budget.test.ts giảm xuống dưới 1.350 tokens mà vẫn bảo đảm đầy đủ các chuỗi quy tắc kiểm tra trong activation-instructions.test.ts và persistence-guidance.test.ts

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-21 10:36:11 +07:00)
- [x] `check-budget` (focused): Đo lường ngân sách instruction và bảo đảm toàn vẹn các chuỗi quy tắc bắt buộc — pass (2026-10-21 10:34:37 +07:00)

## Evidence

- `check-budget` — pass (2026-10-21 10:34:37 +07:00): pnpm exec vitest run test/workflow/instruction-budget.test.ts test/workflow/activation-instructions.test.ts test/workflow/persistence-guidance.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-21 10:36:11 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
