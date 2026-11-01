# Hook context dedup bền theo session và an toàn khi chạy song song

- **ID:** 20261101-082448-context-hook-dedup
- **Mode:** full
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-02 00:16:17 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | r-compact: low, r-slots: low |

## Goal

Đóng D1/R2/R3/R11: một slot cache chung cho nhiều session, mất con trỏ sau compact, cắt giữa cặp surrogate.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/commands/internal-context.ts`
- `src/core/context/session-cache.ts`
- `src/utils/safe-slice.ts`
- `test/unit/core/context/session-cache.test.ts`
- `test/unit/utils/safe-slice.test.ts`
- `test/workflow/internal-context-boundary.test.ts`
- `test/workflow/internal-context-hooks.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +30 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +3 / -1 |
| `src/cli-hints.ts` | modified | +25 / -0 |
| `src/commands/archive.ts` | modified | +2 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +2 / -2 |
| `src/commands/context-report.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +27 / -4 |
| `src/commands/internal-context.ts` | modified | +7 / -22 |
| `src/commands/learning.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -2 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +4 / -12 |
| `src/commands/status.ts` | modified | +9 / -19 |
| `src/commands/tasks.ts` | modified | +2 / -2 |
| `src/commands/workflow-flags.ts` | modified | +19 / -6 |
| `src/core/context/session-cache.ts` | added | - |
| `src/core/epics/epic-location.ts` | modified | +9 / -0 |
| `src/core/epics/epic.ts` | modified | +3 / -2 |
| `src/core/tasks/read-tracker.ts` | modified | +6 / -2 |
| `src/core/workflow/epic-replay.ts` | added | - |
| `src/core/workflow/run-check.ts` | modified | +18 / -5 |
| `src/core/workflow/save.ts` | modified | +2 / -0 |
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
| `src/utils/project-discovery.ts` | modified | +8 / -0 |
| `src/utils/safe-slice.ts` | added | - |
| `test/integration/commands/workflow-command.test.ts` | modified | +6 / -12 |
| `test/integration/scenarios/epic-next-selection.test.ts` | added | - |
| `test/unit/cli-hints.test.ts` | modified | +19 / -0 |
| `test/unit/commands/internal-context.test.ts` | modified | +59 / -1 |
| `test/unit/core/context/session-cache.test.ts` | added | - |
| `test/unit/core/epics/epic-location.test.ts` | modified | +12 / -0 |
| `test/unit/core/tasks/read-tracker.test.ts` | modified | +37 / -6 |
| `test/unit/core/workflow/epic-replay.test.ts` | added | - |

_(6 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Dedup của hook context dùng một slot cache riêng cho mỗi session (tệp theo hash của sessionId trong .harnix/tmp/context-cache/, ghi atomic), nên hai session xen kẽ (A, B, A, B) trên cùng repo mỗi bên dedup đúng độc lập; số slot bị giới hạn và slot cũ nhất bị dọn để tmp/ không phình.
- [x] `ac-2` (met): Khi sự kiện không có sessionId, hook luôn inject payload đầy đủ và không đọc hay ghi cache; khi payload đổi (hash khác) thì session đó nhận lại payload; có test cho từng nhánh. Hành vi sau compact không nằm trong tiêu chí vì host không gửi tín hiệu compact (ghi thành residual risk).
- [x] `ac-3` (met): Cắt contentBudget và disclosure trong boundedContext không phá cặp surrogate và không cắt giữa lead: có test với ký tự ngoài BMP (emoji) nằm đúng biên cắt, kết quả không chứa surrogate lẻ.
- [x] `ac-4` (met): Các test và cổng hợp đồng mới (test:gates, cấu trúc test mirror src) xanh.

## Required checks

- [x] `chk-focused` (focused): Test tập trung của hook context: dedup theo session và cắt an toàn surrogate — pass (2026-11-02 00:14:40 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án xanh — pass (2026-11-02 00:16:12 +07:00)
- [x] `chk-gates` (focused): Cổng hợp đồng: cấu trúc test, kiến trúc, docs, golden — pass (2026-11-02 00:14:48 +07:00)

## Residual risks

- **r-compact** (low) — Host không gửi tín hiệu compact nên sau compact payload vẫn bị elide khi hash không đổi trong cùng session; chỉ đổi hash hoặc session mới inject lại. Không bịa tín hiệu, ngoài phạm vi.
- **r-slots** (low) — Giới hạn số slot làm một session cũ bị dọn có thể nhận lại payload một lần (an toàn, chỉ thừa).

## Evidence

- `chk-focused` — pass (2026-11-02 00:14:40 +07:00): pnpm exec vitest run test/unit/commands/internal-context.test.ts test/unit/commands/internal-context-cli.test.ts test/workflow/internal-context-hooks.test.ts test/workflow/internal-context-boundary... — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-02 00:14:48 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-02 00:16:12 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
