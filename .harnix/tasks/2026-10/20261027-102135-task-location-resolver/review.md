# Resolver vị trí task và epic duy nhất, ghi mới vào bucket theo tháng

- **ID:** 20261027-102135-task-location-resolver
- **Mode:** full
- **Epic:** 20261027-102134-task-layout-bucket-archive
- **Status:** completed/finishing
- **Created:** 2026-10-27 10:21:35 +07:00
- **Updated:** 2026-10-27 13:52:42 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 1 | version-sync-eperm: low |

## Goal

Tạo một module duy nhất quyết định vị trí vật lý của task và epic (bucket tháng, bố cục phẳng cũ, kho lưu trữ), chuyển toàn bộ nơi đang dựng đường dẫn tasks/<id> và epics/<id> sang module đó và ghi mới vào bucket tháng, vẫn đọc được mọi bố cục.

## Non-goals

- Không di chuyển task hiện có (thuộc task migration)
- Không thêm lệnh archive (thuộc task archive)

## Relevant paths

- `src/core/tasks/**`
- `src/core/workflow/**`
- `src/core/verification/input-digest.ts`
- `test/unit/core/tasks/**`
- `test/workflow/architecture.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -0 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -0 |
| `package.json` | modified | +1 / -1 |
| `src/commands/resume.ts` | modified | +3 / -2 |
| `src/core/context/effective-context.ts` | modified | +2 / -1 |
| `src/core/doctor/project-tasks.ts` | modified | +9 / -11 |
| `src/core/doctor/restore-artifacts.ts` | modified | +8 / -7 |
| `src/core/epics/epic-location.ts` | added | - |
| `src/core/epics/epic.ts` | modified | +15 / -48 |
| `src/core/epics/migrate.ts` | modified | +5 / -4 |
| `src/core/journal/learning-sources.ts` | modified | +2 / -2 |
| `src/core/tasks/task-audit.ts` | modified | +2 / -2 |
| `src/core/tasks/task-index.ts` | modified | +4 / -11 |
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
| `test/integration/commands/checks.test.ts` | modified | +3 / -2 |
| `test/integration/commands/context-report.test.ts` | modified | +7 / -3 |
| `test/integration/commands/doctor.test.ts` | modified | +10 / -6 |
| `test/integration/commands/learning.test.ts` | modified | +8 / -1 |
| `test/integration/commands/resume.test.ts` | modified | +14 / -7 |

_(42 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Task và epic mới được ghi vào bucket tháng (.harnix/tasks/<YYYY-MM>/<id>/ và .harnix/epics/<YYYY-MM>/<id>/) với tháng suy ra từ tiền tố ngày của ID; resolver tìm được task hoặc epic ở bucket tháng, ở bố cục phẳng cũ (gồm .harnix/epics/<id>/, <id>.json phẳng và roadmaps) và ở _archive theo thứ tự tất định.
- [x] `ac-2` (met): Không còn chuỗi dựng đường dẫn tasks/${id} hay epics/${id} rải rác trong src; mọi truy cập đi qua resolver và test kiến trúc chặn chuỗi đó quay lại.
- [x] `ac-3` (met): Đường dẫn logic .harnix/tasks/<id>/task.json trong evidence đã lưu (artifactPaths) và ngoại lệ input digest của task đang chạy vẫn khớp với task ở mọi bố cục, không làm đổi digest hay evidence cũ.
- [x] `ac-4` (met): Repo ở bố cục phẳng hiện tại vẫn đọc và ghi đúng; golden behavior-snapshot chỉ đổi khóa đường dẫn của task mới sang bucket tháng (nội dung giữ nguyên từng byte, kiểm bằng diff) và các test workflow hiện có vẫn xanh.

## Required checks

- [x] `chk-resolver` (focused): Test đơn vị của resolver vị trí task — pass (2026-10-27 13:48:53 +07:00)
- [x] `chk-arch` (focused): Test kiến trúc cấm dựng đường dẫn task rải rác — pass (2026-10-27 13:48:56 +07:00)
- [x] `chk-gates` (focused): Contract tests (CLI, docs, golden, kiến trúc) — pass (2026-10-27 13:49:03 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-10-27 13:52:20 +07:00)

## Decisions

- **golden-paths** — Golden behavior-snapshot chỉ đổi 8 khóa đường dẫn sang bucket tháng, giá trị giữ nguyên từng byte (đã đối chiếu bằng diff).
  - _Why:_ Task mới nay ghi vào bucket tháng; ac-4 được viết lại bằng một replan có lý do.

## Residual risks

- **version-sync-eperm** (low) — Test version-sync --fold-dev thỉnh thoảng lỗi EPERM khi rename file tạm trên Windows lúc chạy cả suite song song; chạy riêng thì xanh.

## Evidence

- skipped (2026-10-27 13:41:38 +07:00): Task contract revised at persisted replan: Task mới nay ghi vào bucket tháng nên khóa đường dẫn trong golden buộc phải đổi; giá trị giữ nguyên.
- `chk-resolver` — pass (2026-10-27 13:48:53 +07:00): pnpm exec vitest run test/unit/core/tasks/task-location.test.ts test/unit/core/epics/epic-location.test.ts — exit 0
- `chk-arch` — pass (2026-10-27 13:48:56 +07:00): pnpm exec vitest run test/workflow/architecture.test.ts — exit 0
- `chk-gates` — pass (2026-10-27 13:49:03 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-10-27 13:52:20 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
