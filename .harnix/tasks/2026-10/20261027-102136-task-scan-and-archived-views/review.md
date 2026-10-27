# Quét task sống, xem task đã lưu trữ và epic qua nhiều bố cục

- **ID:** 20261027-102136-task-scan-and-archived-views
- **Mode:** full
- **Epic:** 20261027-102134-task-layout-bucket-archive
- **Status:** completed/finishing
- **Created:** 2026-10-27 10:21:36 +07:00
- **Updated:** 2026-10-27 14:10:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Làm harnix tasks, harnix epic, status, doctor, baseline-hint, learning và resume chỉ quét phần task và epic sống theo mặc định, có cờ để xem kho lưu trữ, và để epic gom thành viên từ cả bucket lẫn _archive mà chỉ quét các tháng từ tháng của epic trở đi.

## Non-goals

- Không đổi định dạng JSON hiện có của harnix tasks ngoài việc thêm trường mới
- Không tạo chỉ mục cache riêng

## Relevant paths

- `src/core/tasks/task-index.ts`
- `src/core/epics/epic.ts`
- `src/core/doctor/**`
- `src/core/workflow/baseline-hint.ts`
- `src/core/journal/learning-sources.ts`
- `src/commands/tasks.ts`
- `test/integration/commands/tasks.test.ts`
- `test/integration/commands/epic.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -0 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +4 / -4 |
| `docs/HARNIX_PRD.md` | modified | +4 / -3 |
| `package.json` | modified | +1 / -1 |
| `scripts/version-sync.mjs` | modified | +16 / -1 |
| `src/cli-workflow-commands.ts` | modified | +6 / -3 |
| `src/commands/epic.ts` | modified | +19 / -12 |
| `src/commands/resume.ts` | modified | +3 / -2 |
| `src/core/context/effective-context.ts` | modified | +2 / -1 |
| `src/core/doctor/project-tasks.ts` | modified | +9 / -11 |
| `src/core/doctor/restore-artifacts.ts` | modified | +8 / -7 |
| `src/core/epics/epic-location.ts` | added | - |
| `src/core/epics/epic.ts` | modified | +11 / -86 |
| `src/core/epics/members.ts` | added | - |
| `src/core/epics/migrate.ts` | modified | +5 / -4 |
| `src/core/journal/learning-sources.ts` | modified | +2 / -2 |
| `src/core/tasks/task-audit.ts` | modified | +2 / -2 |
| `src/core/tasks/task-index.ts` | modified | +23 / -23 |
| `src/core/tasks/task-location.ts` | added | - |
| `src/core/tasks/task-migration.ts` | modified | +3 / -2 |
| `src/core/tasks/task-resume.ts` | modified | +2 / -1 |
| `src/core/tasks/task-store.ts` | modified | +5 / -4 |
| `src/core/verification/input-digest.ts` | modified | +4 / -5 |
| `src/core/workflow/baseline-hint.ts` | modified | +6 / -8 |
| `src/core/workflow/context.ts` | modified | +2 / -1 |
| `src/core/workflow/epic-members.ts` | modified | +3 / -4 |
| `src/core/workflow/init-lineage.ts` | modified | +3 / -2 |
| `src/core/workflow/learn.ts` | modified | +3 / -2 |
| `src/core/workflow/obligations.ts` | modified | +3 / -2 |
| `src/core/workflow/plan-sync.ts` | modified | +3 / -2 |
| `src/core/workflow/ready-artifacts.ts` | modified | +2 / -1 |
| `src/core/workflow/save-files.ts` | modified | +8 / -4 |
| `src/core/workflow/save.ts` | modified | +4 / -3 |
| `src/core/workflow/target-task.ts` | modified | +2 / -2 |
| `src/core/workflow/transition.ts` | modified | +3 / -2 |
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
| `src/skills/harnix-verify/references/workflow-routing.md` | modified | +1 / -1 |

_(53 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): harnix tasks và harnix epic (danh sách) mặc định chỉ quét task và epic sống (bucket tháng và bố cục phẳng); cờ --archived quét kho _archive thay cho phần sống; summary.scanned phản ánh đúng phần đã quét và filter ghi cờ archived.
- [x] `ac-2` (met): collectEpicMembers và harnix epic <id> gồm cả thành viên đã lưu trữ và chỉ quét các tháng từ tháng của epic trở đi; kết quả bằng kết quả quét toàn bộ trên cùng dữ liệu; danh sách epic gom thành viên của mọi epic trong một lượt quét thay vì quét lại cho từng epic.
- [x] `ac-3` (met): doctor, status, resume, baseline-hint, restore-artifacts, learning-sources và --follow-up tìm thấy task và epic ở mọi bố cục (phẳng, bucket, _archive), không báo task-root-unreadable giả và không coi thư mục tháng hay _archive là task lỗi.
- [x] `ac-4` (met): Danh sách epic đọc mỗi task tối đa một lần dù có bao nhiêu epic và task được tải song song có giới hạn (test đếm số lần đọc); số đo harnix tasks --limit 3 và harnix epic trên bản sao 252 task xếp theo bucket tháng, trước và sau, được ghi vào decision trace-timing so với số đo phẳng 0,8 giây và 2,9 giây.

## Required checks

- [x] `chk-views` (focused): Test tasks và epic qua nhiều bố cục — pass (2026-10-27 14:09:46 +07:00)
- [x] `chk-gates` (focused): Contract tests (CLI, docs, golden, kiến trúc) — pass (2026-10-27 14:09:52 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-10-27 14:09:12 +07:00)

## Decisions

- **trace-timing** — Đo trên bản sao 257 task, 32 epic (Node 5 lần, lấy trung vị, bản build mới): harnix tasks --limit 3 là 341 ms ở bố cục phẳng và 305 ms ở bucket tháng; harnix epic là 322 ms phẳng và 291 ms bucket. Số đo bố cục phẳng trước thay đổi là 0,8 giây và 2,9 giây.
  - _Why:_ Tải task song song có giới hạn 16 và gom thành viên epic một lượt; phần còn lại chủ yếu là thời gian khởi động Node.
- **version-sync-retry** — scripts/version-sync.mjs thử lại rename tạm tối đa 6 lần khi Windows báo EPERM, EBUSY hoặc EACCES, giống atomicWriteFile.
  - _Why:_ Test version-sync --fold-dev lỗi EPERM không đều khi chạy cả suite và làm chk-suite đỏ giả.

## Evidence

- `chk-views` — pass (2026-10-27 14:09:46 +07:00): pnpm exec vitest run test/integration/commands/tasks.test.ts test/integration/commands/epic.test.ts test/unit/core/tasks/task-index.test.ts test/unit/core/tasks/task-location.test.ts test/unit/core... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-27 14:09:52 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-27 14:09:12 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
