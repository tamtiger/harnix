# Liệt kê task gọn, task treo và hint secretAdvisory

- **ID:** 20261030-110109-token-and-check-ergonomics
- **Mode:** lite
- **Epic:** 20261030-110106-workflow-ergonomics
- **Status:** completed/finishing
- **Created:** 2026-10-30 11:01:06 +07:00
- **Updated:** 2026-10-30 13:23:06 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Rà soát nhiều task ít token: tasks --brief phát JSON rút gọn, tasks --stale liệt kê task treo; secretAdvisory của --finish có hint ignore.

## Non-goals

- Không đổi cơ chế bất biến của check; --replace-check giữ nguyên.

## Relevant paths

- `src/cli-workflow-commands.ts`
- `src/commands/tasks.ts`
- `src/core/tasks/task-index.ts`
- `src/core/workflow/schema.ts`
- `src/core/workflow/secret-scan.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +28 / -28 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +6 / -0 |
| `src/cli-tasks-command.ts` | added | - |
| `src/cli-workflow-commands.ts` | modified | +3 / -23 |
| `src/core/tasks/task-index.ts` | modified | +40 / -5 |
| `src/core/workflow/init-task.ts` | modified | +6 / -1 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/secret-scan.ts` | modified | +6 / -1 |
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
| `src/utils/file-lock.ts` | modified | +4 / -8 |
| `test/unit/cli-helpers.test.ts` | modified | +7 / -0 |
| `test/unit/cli-tasks-command.test.ts` | added | - |
| `test/unit/core/tasks/task-index.test.ts` | modified | +49 / -0 |
| `test/unit/core/workflow/secret-scan.test.ts` | modified | +15 / -1 |
| `test/unit/core/workflow/similar-tasks.test.ts` | added | - |
| `test/unit/utils/file-lock.test.ts` | modified | +24 / -0 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |
| `test/workflow/cli-contract.test.ts` | modified | +8 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): harnix tasks --brief vẫn phát đúng một tài liệu JSON, mỗi task chỉ gồm id, status, checkpoint và updatedAt (không có title, goal), cùng kiểu với epic --brief; test shape và test cli-contract cập nhật.
- [x] `ac-2` (met): secretAdvisory của --finish giữ path và rule hiện có, thêm trường hint nhắc ba cách đã tồn tại (.gitignore, thu hẹp inputs của check, waiver harnix-secret-waiver), không in giá trị bí mật.
- [x] `ac-3` (met): harnix tasks --stale --days N chỉ liệt kê task planning hoặc ready không cập nhật quá N ngày; kết hợp với --status thì giao của hai bộ lọc; trường filter trong kết quả nêu stale và days.

## Required checks

- [x] `chk-token` (focused): Test tập trung cho tasks --brief, tasks --stale và hint secretAdvisory — pass (2026-10-30 13:21:17 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 13:22:38 +07:00)

## Evidence

- `chk-token` — pass (2026-10-30 13:21:17 +07:00): pnpm exec vitest run test/workflow test/unit/commands test/unit/core/workflow test/integration/commands — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-30 13:22:38 +07:00): pnpm test — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
