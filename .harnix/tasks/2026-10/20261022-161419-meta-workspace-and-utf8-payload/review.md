# Chuẩn hóa Meta-Workspace Discovery và UTF-8 Payload Handoff

- **ID:** 20261022-161419-meta-workspace-and-utf8-payload
- **Mode:** lite
- **Epic:** 20261022-153552-repomap-csharp-workspace-fixes
- **Status:** completed/finishing
- **Created:** 2026-10-22 16:14:19 +07:00
- **Updated:** 2026-10-22 16:28:12 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Chuẩn hóa Meta-Workspace Discovery và UTF-8 Payload Handoff

## Relevant paths

- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-lifecycle-handlers.ts`
- `src/core/repo-map/workspace.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +11 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +11 / -3 |
| `src/commands/repo-map-internal.ts` | modified | +46 / -4 |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -2 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +31 / -11 |
| `src/core/repo-map/event-discovery.ts` | modified | +11 / -10 |
| `src/core/repo-map/extract.ts` | modified | +8 / -1 |
| `src/core/repo-map/inventory.ts` | modified | +2 / -1 |
| `src/core/repo-map/outline.ts` | modified | +1 / -1 |
| `src/core/repo-map/workspace.ts` | modified | +46 / -0 |
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
| `src/templates/harnix/activation.ts` | modified | +1 / -1 |
| `src/templates/harnix/workflow.md` | modified | +1 / -1 |
| `test/integration/commands/repo-map-internal.test.ts` | modified | +16 / -10 |
| `test/integration/commands/workflow-handlers.test.ts` | modified | +31 / -0 |
| `test/integration/scenarios/status-workspace.test.ts` | modified | +19 / -5 |
| `test/unit/core/repo-map/event-discovery.test.ts` | modified | +39 / -0 |
| `test/unit/core/repo-map/event-matrix.test.ts` | modified | +2 / -2 |
| `test/unit/core/repo-map/extract.test.ts` | modified | +15 / -0 |
| `test/unit/core/repo-map/graph.test.ts` | modified | +14 / -0 |
| `test/unit/core/repo-map/inventory.test.ts` | modified | +21 / -0 |
| `test/unit/core/repo-map/outline.test.ts` | modified | +8 / -0 |
| `test/workflow/version-sync.test.ts` | modified | +4 / -4 |

## Acceptance criteria

- [x] `ac-1` (met): Quy trình phát hiện Meta-Workspace trong repo-map (workspace.ts) và tác vụ trạng thái Git (code-impact.ts, git-status.ts) xử lý an toàn thư mục meta-workspace không có .git ở root, không làm gián đoạn lệnh và phân biệt rõ ràng giữa workspace mode và project mode.
- [x] `ac-2` (met): Lệnh harnix workflow --init hỗ trợ cờ --file <path> để nạp spec task từ file UTF-8 trực tiếp mà không bị lỗi encoding tiếng Việt trên Windows PowerShell.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite và coverage của dự án phải pass — pass (2026-10-22 16:27:31 +07:00)
- [x] `check-meta-workspace` (focused): Kiểm tra xử lý meta-workspace không có .git ở root và phân định cache sub-repos — pass (2026-10-22 16:22:45 +07:00)
- [x] `check-workflow-init-file` (focused): Kiểm tra workflow --init hỗ trợ cờ --file nạp spec UTF-8 an toàn — pass (2026-10-22 16:27:54 +07:00)

## Evidence

- `check-meta-workspace` — pass (2026-10-22 16:22:45 +07:00): pnpm vitest run test/unit/core/repo-map/workspace-root-cache.test.ts test/unit/core/repo-map/workspace.test.ts — exit 0
- `check-workflow-init-file` — pass (2026-10-22 16:27:54 +07:00): pnpm vitest run test/integration/commands/workflow-handlers.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-22 16:27:31 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
