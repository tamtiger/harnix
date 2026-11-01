# Ổn định test song song và cô lập mock

- **ID:** 20261101-082450-test-stability
- **Mode:** lite
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** completed/finishing
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 23:59:57 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 1 | risk-restoremocks: low |

## Goal

Đóng B7/E2: test 6 writer chập chờn khi tải cao, `isolate: false` không ép `restoreMocks`.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/core/tasks/read-tracker.ts`
- `test/unit/core/tasks/read-tracker.test.ts`
- `test/unit/core/workflow/plan-edit.test.ts`
- `vitest.config.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +3 / -1 |
| `src/cli-hints.ts` | modified | +25 / -0 |
| `src/commands/archive.ts` | modified | +2 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +2 / -2 |
| `src/commands/context-report.ts` | modified | +2 / -2 |
| `src/commands/learning.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -2 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +2 / -2 |
| `src/commands/tasks.ts` | modified | +2 / -2 |
| `src/commands/workflow-flags.ts` | modified | +19 / -6 |
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
| `test/integration/commands/workflow-command.test.ts` | modified | +6 / -12 |
| `test/unit/cli-hints.test.ts` | modified | +19 / -0 |
| `test/unit/core/tasks/read-tracker.test.ts` | modified | +37 / -6 |
| `test/unit/core/workflow/epic-replay.test.ts` | added | - |
| `test/unit/core/workflow/run-check.test.ts` | modified | +21 / -16 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |
| `test/workflow/cli-contract.test.ts` | modified | +36 / -0 |
| `vitest.config.ts` | modified | +2 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Khi nhiều writer thua xung đột liên tiếp, `retryOnTaskConflict` vẫn thành công trong giới hạn `MAX_TASK_ATTEMPTS` mới (>5, có lý do) với backoff tăng dần, và vẫn ném `TaskConflictError` khi hết lượt; test xác định tiêm `pause` chứng minh điều này.
- [x] `ac-2` (met): `vitest.config.ts` bật `restoreMocks: true` và toàn bộ suite vẫn xanh, không hạ ngưỡng coverage; nếu phá quá nhiều test thì hoàn tác và ghi residual risk.

## Required checks

- [x] `chk-focused` (focused): Test retry xung đột và ghi song song — pass (2026-11-01 23:58:31 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án xanh — pass (2026-11-01 23:59:53 +07:00)

## Decisions

- **dec-retry** — MAX_TASK_ATTEMPTS 5 -> 12 (xuất ra để test).
  - _Why:_ 6 writer đồng thời mỗi vòng thua tối đa 5 người khác, tải cao kéo dài vòng nên 5 lượt đôi khi cạn; 12 lượt với backoff tăng dần đủ dư mà vẫn lộ xung đột kẹt thật.
- **dec-restoremocks** — Bật restoreMocks: true; suite 344 file xanh, không phải sửa test nào, ngưỡng coverage giữ nguyên.
  - _Why:_ Không test nào vỡ nên không cần hoãn.

## Residual risks

- **risk-restoremocks** (low) — Nếu bật restoreMocks phá nhiều test thì hoãn sang task riêng (xem decision).

## Evidence

- `chk-focused` — pass (2026-11-01 23:58:31 +07:00): pnpm exec vitest run test/unit/core/tasks/read-tracker.test.ts test/unit/core/workflow/plan-edit.test.ts — exit 0
- `chk-suite` — pass (2026-11-01 23:59:53 +07:00): pnpm test — exit 0
