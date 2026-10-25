# Tai cau truc tinh gon workflow.md thanh Lean Operational Cheat Sheet

- **ID:** 20261025-125311-refactor-lean-workflow-cheat-sheet
- **Mode:** lite
- **Epic:** 20261025-123400-developer-resilience-and-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-10-25 12:53:07 +07:00
- **Updated:** 2026-10-25 13:51:19 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Toi uu hoa workflow.md giam 60% token footprint va chuyen ly thuyet vao references

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +16 / -0 |
| `README.md` | modified | +5 / -3 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-workflow-commands.ts` | modified | +2 / -2 |
| `src/commands/learning.ts` | modified | +42 / -2 |
| `src/core/journal/learning-prune.ts` | modified | +6 / -3 |
| `src/core/journal/learning-quality.ts` | modified | +6 / -3 |
| `src/core/workflow/epic-context.ts` | added | - |
| `src/core/workflow/facts-hint.ts` | added | - |
| `src/core/workflow/preflight.ts` | modified | +7 / -42 |
| `src/skills/catalog.ts` | modified | +12 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-implement/references/commit-hygiene.md` | modified | +5 / -0 |
| `src/skills/harnix-implement/references/feedback.md` | modified | - |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/epic.md` | modified | - |
| `src/skills/harnix-plan/references/migration.md` | modified | - |
| `src/skills/harnix-plan/references/multi-repo.md` | modified | - |
| `src/skills/harnix-plan/references/ready-review.md` | modified | - |
| `src/skills/harnix-plan/references/replan.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/references/multi-lens.md` | modified | - |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +5 / -1 |
| `src/skills/harnix-verify/references/agent-transport.md` | added | - |
| `src/skills/harnix-verify/references/cookbook-commands.md` | added | - |
| `src/skills/harnix-verify/references/cookbook-notes.md` | added | - |
| `src/skills/harnix-verify/references/evidence.md` | modified | +1 / -0 |
| `src/skills/harnix-verify/references/finish-cancel.md` | modified | - |
| `src/skills/harnix-verify/references/gates.md` | added | - |
| `src/skills/harnix-verify/references/task-state.md` | added | - |
| `src/skills/harnix-verify/references/workflow-routing.md` | added | - |
| `src/templates/harnix/workflow.md` | modified | +42 / -118 |
| `test/README.md` | modified | - |
| `test/integration/commands/learning.test.ts` | modified | +12 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +6 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/support/workflow-guidance.ts` | added | - |
| `test/unit/core/journal/learning-prune.test.ts` | modified | +14 / -0 |
| `test/unit/core/journal/learning-quality.test.ts` | modified | +6 / -0 |

_(12 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): workflow.md giảm tối thiểu 60% token (≤ 2.466 tokens, đo bằng 4 ký tự/token) với cấu trúc Lean Cheat Sheet và Cookbook tập trung.
- [x] `ac-2` (met): Cac reference cua skills chua day du noi dung huong dan chuyen sau khong bi mat mat.
- [x] `ac-3` (met): pnpm selfhost:sync va tat ca test suite/gates xanh hoan toan.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite phải xanh — pass (2026-10-25 13:51:07 +07:00)
- [x] `chk-workflow-selfhost` (focused): Kiem tra selfhost va do dai workflow template — pass (2026-10-25 13:44:33 +07:00)
- [x] `chk-lean-workflow` (focused): Do kich thuoc lean workflow va reference chi tiet — pass (2026-10-25 13:44:36 +07:00)

## Evidence

- `chk-workflow-selfhost` — pass (2026-10-25 13:44:33 +07:00): pnpm vitest run test/workflow/self-host.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-lean-workflow` — pass (2026-10-25 13:44:36 +07:00): pnpm vitest run test/workflow/lean-workflow.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-25 13:51:07 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
