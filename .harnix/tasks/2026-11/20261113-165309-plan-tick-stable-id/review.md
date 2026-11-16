# Lệnh --tick chọn mục plan theo id ổn định

- **ID:** 20261113-165309-plan-tick-stable-id
- **Mode:** lite
- **Epic:** 20261113-165307-agent-feedback-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 16:53:07 +07:00
- **Updated:** 2026-11-13 17:10:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

--tick chọn mục checklist theo id check hoặc slice khớp chính xác, in tên mục sẽ tick và hỗ trợ --brief, để thứ tự không bị lệch sau mỗi lần tick.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.
- Không chặn lệnh của agent; chỉ nhắc hoặc cảnh báo.

## Relevant paths

- `src/commands/workflow-handlers.ts`
- `src/core/workflow/actions.ts`
- `src/core/workflow/plan-sync.ts`
- `src/core/workflow/schema.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/commands/pretool-hint.ts` | modified | +29 / -1 |
| `src/commands/workflow-command.ts` | modified | +1 / -1 |
| `src/commands/workflow-handlers.ts` | modified | +1 / -1 |
| `src/configurators/claude.ts` | modified | +1 / -1 |
| `src/core/platform/facts.ts` | modified | +1 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -1 |
| `src/core/workflow/plan-sync.ts` | modified | +27 / -5 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +1 / -1 |
| `test/platform/claude-global.test.ts` | modified | +1 / -1 |
| `test/platform/settings-json-fidelity.test.ts` | modified | +3 / -3 |
| `test/unit/commands/pretool-hint.test.ts` | modified | +30 / -0 |
| `test/unit/core/workflow/plan-sync.test.ts` | modified | +49 / -3 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Selector là id check dạng `chk-3` khớp chính xác theo `[chk-id]`: `chk-1` không tick mục `chk-10`, và selector mơ hồ bị từ chối thay vì tick nhiều mục.
- [x] `ac-2` (met): Selector số vẫn dùng được nhưng kết quả liệt kê tên từng mục đã tick, và lệnh nhận --brief.

## Required checks

- [x] `chk-1` (focused): Test tập trung của plan-tick-stable-id — pass (2026-11-13 17:08:25 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-13 17:09:56 +07:00)

## Evidence

- `chk-1` — pass (2026-11-13 17:08:25 +07:00): pnpm exec vitest run test/unit/core/workflow/plan-sync.test.ts test/unit/core/workflow/actions.test.ts test/workflow/cli-contract.test.ts — exit 0
- `chk-2` — pass (2026-11-13 17:09:56 +07:00): pnpm test — exit 0
