# Cảnh báo task gần giống khi tạo task mới

- **ID:** 20261030-110107-task-sprawl-guard
- **Mode:** lite
- **Epic:** 20261030-110106-workflow-ergonomics
- **Status:** completed/finishing
- **Created:** 2026-10-30 11:01:06 +07:00
- **Updated:** 2026-10-30 11:38:52 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Khi tạo task mới, cảnh báo nếu title hoặc goal gần giống task đang mở hoặc đã hoàn thành, qua một helper dùng chung để doctor tái dùng.

## Non-goals

- Không tự động hủy hay gộp task.

## Relevant paths

- `src/core/journal/learning-similarity.ts`
- `src/core/workflow/actions.ts`
- `src/core/workflow/init-lineage.ts`
- `src/core/workflow/init-task.ts`
- `src/core/workflow/schema.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -0 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/init-task.ts` | modified | +6 / -1 |
| `src/core/workflow/similar-tasks.ts` | added | - |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/unit/core/workflow/similar-tasks.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Helper dùng chung trong src/core/workflow (tái dùng foldObservation, observationTokens và jaccard của learning-similarity) coi hai task gần giống khi Jaccard trên token đã fold từ 0.6 trở lên (hằng số có tên, test ở 0.59 và 0.6); workflow --init in notice trên stderr nêu id task gần giống về title hoặc goal: với task planning/ready gợi ý --set-goal hoặc resume, với task completed gợi ý --follow-up <id>; vẫn tạo task. Doctor dùng lại đúng helper này.

## Required checks

- [x] `chk-sprawl` (focused): Test tập trung cho helper task gần giống và cảnh báo của --init — pass (2026-10-30 11:37:00 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 11:38:23 +07:00)

## Decisions

- **helper-first** — Task này đi đầu epic và sở hữu helper task gần giống; member doctor chỉ tái dùng.
  - _Why:_ Hai nơi dùng cùng ngưỡng thì không cho kết quả khác nhau.

## Evidence

- `chk-sprawl` — pass (2026-10-30 11:37:00 +07:00): pnpm exec vitest run test/workflow test/unit/commands test/unit/core/workflow test/integration/commands — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-30 11:38:23 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
