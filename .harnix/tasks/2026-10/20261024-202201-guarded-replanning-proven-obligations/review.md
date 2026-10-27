# Guarded Replanning cho Phép Sửa/Waive Tiêu chí và Thay Thế Check Đã Pass tại Checkpoint Replan

- **ID:** 20261024-202201-guarded-replanning-proven-obligations
- **Mode:** lite
- **Epic:** 20261024-202200-harnix-dx-workflow-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-24 20:22:00 +07:00
- **Updated:** 2026-10-24 20:52:55 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Cho phép sửa text, waive tiêu chí acceptance criteria và replace check đã pass tại checkpoint replan kèm --reason hợp lệ; tự động invalidate evidence pass cũ và reset trạng thái criteria liên quan về pending.

## Non-goals

- Không cho phép sửa đổi obligations ngoài checkpoint replan
- Không bỏ qua yêu cầu contractRevision.reason tối thiểu 10 ký tự

## Relevant paths

- `src/core/workflow/obligations.ts`
- `src/core/workflow/replace-check.ts`
- `test/unit/core/workflow/obligations.test.ts`
- `test/unit/core/workflow/replace-check.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/obligations.ts` | modified | +50 / -25 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -2 |
| `src/core/workflow/set-criterion.ts` | modified | +1 / -1 |
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
| `test/unit/core/workflow/obligations.test.ts` | modified | +51 / -59 |
| `test/unit/core/workflow/replace-check.test.ts` | modified | +12 / -3 |
| `test/unit/core/workflow/set-criterion.test.ts` | modified | +11 / -5 |
| `test/workflow/task-contract-v3.test.ts` | modified | +18 / -4 |

## Acceptance criteria

- [x] `ac-1` (met): Tại checkpoint replan với contractRevision.reason hợp lệ (10-1000 ký tự), cho phép cập nhật nội dung text của tiêu chí hoặc chuyển sang waived (kèm waiverReason), tự động gỡ các pass evidenceId cũ và chuyển trạng thái về pending đối với tiêu chí được sửa.
- [x] `ac-2` (met): Lệnh workflow --replace-check cho phép thay thế một check đã có pass evidence khi task đang ở checkpoint replan kèm --reason hợp lệ, retire check cũ và kích hoạt check thay thế mới.
- [x] `ac-3` (met): Toàn bộ các quy tắc bảo vệ frozen contract khác vẫn được duy trì nghiêm ngặt ngoài checkpoint replan (chặn sửa tiêu chí và check đã pass trong planning draft có check evidence, hoặc khi không có contractRevision).

## Required checks

- [x] `chk-unit-obligations` (focused): Unit tests cho cơ chế bảo vệ và nới lỏng replan của obligations — pass (2026-10-24 20:41:40 +07:00)
- [x] `chk-unit-replace-check` (focused): Unit tests cho việc thay thế check đã pass tại checkpoint replan — pass (2026-10-24 20:41:49 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite bảo đảm không hồi quy — pass (2026-10-24 20:51:09 +07:00)

## Evidence

- `chk-unit-obligations` — pass (2026-10-24 20:41:40 +07:00): pnpm vitest run test/unit/core/workflow/obligations.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-unit-replace-check` — pass (2026-10-24 20:41:49 +07:00): pnpm vitest run test/unit/core/workflow/replace-check.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-24 20:51:09 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
