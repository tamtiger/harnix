# Refactor: một nguồn duy nhất cho action/flag, module git dùng chung, bộ lọc learning dạng bảng

- **ID:** 20261025-174421-refactor-single-source-and-git
- **Mode:** full
- **Epic:** 20261025-174418-hardening-and-token-diet
- **Status:** completed/finishing
- **Created:** 2026-10-25 17:44:21 +07:00
- **Updated:** 2026-10-25 19:41:58 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Gom các danh sách action và flag phải đồng bộ tay về một bảng ACTIONS để sinh thông báo lỗi, hint, BRIEF_ACTIONS và schema; đưa mọi lời gọi git qua module dùng chung; biến bộ lọc learning thành bảng quy tắc có test bảng, giữ nguyên hành vi quan sát được.

## Non-goals

- Không đổi hành vi public ngoài các lỗi đã sửa ở hai task trước
- Không regenerate golden

## Relevant paths

- `src/commands/workflow-flags.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/core/workflow/brief.ts`
- `src/core/workflow/schema.ts`
- `src/utils/git.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +6 / -6 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +6 / -0 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +13 / -3 |
| `src/cli-hints.ts` | added | - |
| `src/cli-program.ts` | modified | +7 / -6 |
| `src/cli-workflow-commands.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +5 / -2 |
| `src/commands/learning.ts` | modified | +2 / -1 |
| `src/commands/skills.ts` | modified | +7 / -1 |
| `src/commands/status.ts` | modified | +5 / -4 |
| `src/commands/workflow-command.ts` | modified | +2 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +12 / -27 |
| `src/commands/workflow-flags.ts` | modified | +30 / -48 |
| `src/commands/workflow-handlers.ts` | modified | +3 / -1 |
| `src/core/doctor/restore-artifacts.ts` | modified | +2 / -1 |
| `src/core/global/reconcile.ts` | modified | +1 / -0 |
| `src/core/journal/learning-safety.ts` | modified | +42 / -10 |
| `src/core/managed/decision.ts` | modified | +5 / -2 |
| `src/core/managed/project-files.ts` | modified | +4 / -0 |
| `src/core/repo-map/store.ts` | modified | +1 / -1 |
| `src/core/stack/verify-plan.ts` | modified | +4 / -6 |
| `src/core/tasks/read-tracker.ts` | added | - |
| `src/core/tasks/task-store.ts` | modified | +4 / -1 |
| `src/core/workflow/actions.ts` | added | - |
| `src/core/workflow/baseline.ts` | modified | +7 / -1 |
| `src/core/workflow/brief.ts` | modified | +5 / -30 |
| `src/core/workflow/completion.ts` | modified | +13 / -1 |
| `src/core/workflow/criterion.ts` | modified | +8 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +8 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +7 / -1 |
| `src/core/workflow/plan-remove.ts` | modified | +21 / -3 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -1 |
| `src/core/workflow/reset-breaker.ts` | modified | +11 / -4 |
| `src/core/workflow/run-check.ts` | modified | +8 / -1 |
| `src/core/workflow/run-checks.ts` | modified | +4 / -1 |
| `src/core/workflow/save.ts` | modified | +44 / -2 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +7 / -1 |
| `src/core/workflow/text-integrity.ts` | modified | +6 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |

_(42 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Một bảng ACTIONS duy nhất sinh thông báo lỗi, FLAG_OWNERS hint, BRIEF_ACTIONS và mô tả transport; thêm cờ mới chỉ cần sửa bảng đó và test bề mặt
- [x] `ac-2` (met): Mọi lời gọi git trong src đi qua module dùng chung với safeGitArgs, timeout và maxBuffer
- [x] `ac-3` (met): Golden behavior-snapshot và cli-contract không đổi sau refactor
- [x] `ac-4` (met): Bộ lọc learning-safety được viết thành bảng quy tắc (loại, mẫu, bước chuẩn hóa) có test dạng bảng, và hành vi lọc giữ nguyên so với cuối task P1

## Required checks

- [x] `chk-actions` (focused): Test bề mặt action/flag và checklist — pass (2026-10-25 19:39:45 +07:00)
- [x] `chk-git` (focused): Test module git dùng chung — pass (2026-10-25 19:39:50 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 19:41:51 +07:00)
- [x] `chk-learning-table` (focused): Test dạng bảng cho bộ lọc learning-safety — pass (2026-10-25 19:39:53 +07:00)

## Evidence

- `chk-actions` — pass (2026-10-25 19:39:45 +07:00): pnpm exec vitest run test/workflow/action-checklist.test.ts test/workflow/cli-contract.test.ts — exit 0
- `chk-git` — pass (2026-10-25 19:39:50 +07:00): pnpm exec vitest run test/unit/utils/git.test.ts — exit 0
- `chk-learning-table` — pass (2026-10-25 19:39:53 +07:00): pnpm exec vitest run test/unit/core/journal/learning-safety.test.ts — exit 0
- `check-suite` — pass (2026-10-25 19:41:51 +07:00): pnpm test — exit 0
