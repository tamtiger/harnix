# Cảnh báo chuyển Task ngầm trong Workflow Preflight và chuẩn hóa cờ --file

- **ID:** 20261023-145123-workflow-preflight-switch-detection-and-safe-stdin
- **Mode:** lite
- **Epic:** 20261023-141853-enterprise-dotnet-and-context-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-23 14:51:23 +07:00
- **Updated:** 2026-10-23 16:08:22 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Bổ sung cờ --expected-task trong workflow preflight để phát hiện và cảnh báo kịp thời khi active task bị chuyển đổi ngoài ý muốn trong cùng session; đồng thời chuẩn hóa hỗ trợ cờ --file cho toàn bộ các lệnh nhận payload JSON trong workflow-handlers.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +15 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +8 / -2 |
| `src/commands/workflow-flags.ts` | modified | +1 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +13 / -3 |
| `src/core/config/config-schema.ts` | modified | +3 / -3 |
| `src/core/config/config-validate.ts` | modified | +3 / -0 |
| `src/core/config/config.ts` | modified | +2 / -0 |
| `src/core/context/effective-context.ts` | modified | +30 / -7 |
| `src/core/repo-map/event-discovery.ts` | modified | +52 / -5 |
| `src/core/repo-map/event-matrix.ts` | modified | +68 / -2 |
| `src/core/repo-map/extract.ts` | modified | +5 / -1 |
| `src/core/repo-map/impact.ts` | modified | +62 / -3 |
| `src/core/repo-map/inventory.ts` | modified | +7 / -1 |
| `src/core/repo-map/tests.ts` | modified | +27 / -0 |
| `src/core/stack/detection.ts` | modified | +8 / -4 |
| `src/core/stack/harnix-ignore.ts` | added | - |
| `src/core/stack/verify-plan.ts` | modified | +13 / -0 |
| `src/core/stack/workspace-detection.ts` | modified | +112 / -44 |
| `src/core/workflow/obligations.ts` | modified | +5 / -1 |
| `src/core/workflow/preflight.ts` | modified | +11 / -0 |
| `src/core/workflow/replace-check.ts` | modified | +5 / -1 |
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
| `test/unit/core/context/effective-context.test.ts` | modified | +67 / -0 |
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +42 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +66 / -0 |
| `test/unit/core/repo-map/impact.test.ts` | modified | +21 / -0 |
| `test/unit/core/repo-map/inventory.test.ts` | modified | +17 / -0 |
| `test/unit/core/repo-map/tests.test.ts` | modified | +30 / -0 |
| `test/unit/core/stack/detection.test.ts` | modified | +15 / -0 |
| `test/unit/core/stack/harnix-ignore.test.ts` | added | - |
| `test/unit/core/stack/verify-plan.test.ts` | modified | +26 / -0 |
| `test/unit/core/stack/workspace-detection.test.ts` | modified | +32 / -0 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |
| `test/workflow/internal-context-boundary.test.ts` | modified | +1 / -0 |
| `test/workflow/internal-context-hooks.test.ts` | modified | +15 / -5 |

_(2 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): workflow --preflight hỗ trợ --expected-task <task-id>; trả về taskSwitched: true và nextStage: stop khi active task khác expectedTask.
- [x] `ac-2` (met): Chuẩn hóa hỗ trợ --file <path> cho workflow --cancel, --learn và các handler còn lại, đảm bảo đọc an toàn file UTF-8 trên Windows.
- [x] `ac-3` (met): Test suite bao phủ đầy đủ kịch bản switch task trong preflight và đọc file payload trên Windows không lỗi encoding.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-23 16:08:02 +07:00)
- [x] `check-preflight-switch` (focused): Verify preflight switch detection and safe UTF-8 file input — pass (2026-10-23 16:06:07 +07:00)

## Evidence

- `check-preflight-switch` — pass (2026-10-23 16:06:07 +07:00): pnpm vitest run test/workflow/preflight-switch-and-file.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-23 16:08:02 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
