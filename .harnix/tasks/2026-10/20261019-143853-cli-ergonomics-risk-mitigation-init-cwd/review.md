# Bổ sung cờ CLI còn thiếu: --mitigation, --init --cwd, cwd cho --with-check, --task cho --set-criterion và cờ bỏ decision/criterion

- **ID:** 20261019-143853-cli-ergonomics-risk-mitigation-init-cwd
- **Mode:** full
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:38:47 +07:00
- **Updated:** 2026-10-19 16:34:45 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Điền các khoảng trống của CLI workflow: --add-risk nhận --mitigation, --init chạy được ở thư mục gốc đa repo qua --cwd, --with-check nhận cwd, --set-criterion dùng được với --task, và có cờ bỏ decision hoặc criterion khi còn planning.

## Non-goals

- Không đổi schema TaskRecord v3; mitigation phải lưu trong cấu trúc hiện có.

## Relevant paths

- `docs/HARNIX_WORKFLOW.md`
- `src/cli-workflow-commands.ts`
- `src/commands/workflow-command.ts`
- `src/commands/workflow-edit-handlers.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-handlers.ts`
- `src/core/workflow/brief.ts`
- `src/core/workflow/index.ts`
- `src/core/workflow/init-spec.ts`
- `src/core/workflow/init-task.ts`
- `src/core/workflow/plan-edit.ts`
- `src/core/workflow/plan-remove.ts`
- `src/core/workflow/schema.ts`
- `src/templates/harnix/workflow.md`
- `test/workflow/behavior-snapshot.golden.json`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): workflow --add-risk nhận --mitigation và gộp vào text của rủi ro dạng "<text> (Mitigation: <m>)" mà không đổi schema TaskRecord v3; --mitigation ngoài --add-risk bị từ chối.
- [x] `ac-2` (met): workflow --init --cwd <path> lấy lệnh test của package đó từ verify-plan đệ quy, sinh check-suite scope full kèm cwd và inputs mặc định <path>/**; thiếu lệnh test của package thì báo lỗi yêu cầu --command.
- [x] `ac-3` (met): --with-check nhận thêm khóa cwd=<path>; scope= đã hỗ trợ sẵn.
- [x] `ac-4` (met): Toàn bộ test suite của dự án và test:gates pass.
- [x] `ac-5` (met): workflow --set-criterion hỗ trợ --task <task-id> để sửa tiêu chí của task thành viên chưa kết thúc mà không đổi active pointer; --task vẫn bị từ chối với --transition, --finish, --cancel, --run-check, --evidence.
- [x] `ac-6` (met): Có --remove-decision <id> và --remove-criterion <id> (cùng nhận --task và --brief) chỉ dùng được khi task còn planning; --remove-criterion gỡ tiêu chí khỏi mọi check và bị từ chối khi tiêu chí đã có bằng chứng ghi hoặc một check bắt buộc sẽ không còn phủ tiêu chí nào.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-19 16:33:25 +07:00)
- [x] `chk-focus` (focused): Test cờ workflow mới và hợp đồng CLI — pass (2026-10-19 16:32:07 +07:00)
- [x] `chk-gates-2` (focused): Replacement for chk-gates — pass (2026-10-19 16:32:11 +07:00)

## Decisions

- **dec-1** — Mitigation lưu trong text của rủi ro, không thêm field mitigation vào TaskResidualRisk.
  - _Why:_ Thêm field là đổi schema TaskRecord v3, vi phạm nonGoal của epic.
- **dec-2** — check-1 scope focused là cố ý khi lệnh không phải lệnh test của dự án; không đổi mặc định đó.
  - _Why:_ init-task.ts chỉ coi là suite (full) khi lệnh trùng lệnh test của verify-plan.
- **dec-3** — Hai cờ mới --remove-decision và --remove-criterion chỉ hoạt động trong planning; không xóa dữ liệu đã đóng băng.
  - _Why:_ Tránh phá bất biến của obligations sau ready, nhưng cho phép dọn quyết định hoặc tiêu chí đã bị thay thế khi lập kế hoạch.

## Evidence

- `chk-focus` — pass (2026-10-19 16:32:07 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/commands test/integration/commands/workflow-flags.test.ts test/workflow/cli-contract.test.ts — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `chk-gates` — fail (2026-10-19 16:07:55 +07:00): pnpm test:gates — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-19 16:31:44 +07:00): Task contract revised at persisted replan: Test file vượt 400 dòng do reflow Prettier, đã sửa; chạy lại gates với lệnh vitest tường minh
- `chk-gates-2` — pass (2026-10-19 16:32:11 +07:00): pnpm exec vitest run test/unit/test-structure.test.ts test/workflow/cli-contract.test.ts test/workflow/architecture.test.ts test/workflow/docs-task-contract.test.ts test/workflow/skill-sources.test... — exit 0
- `check-suite` — pass (2026-10-19 16:33:25 +07:00): pnpm test — exit 0
