# Phát hiện bỏ qua thư mục worktree của công cụ và để harnix update làm mới config.yaml

- **ID:** 20261020-135925-config-detection-refresh
- **Mode:** full
- **Epic:** 20261020-135200-harness-hardening-followups
- **Status:** completed/finishing
- **Created:** 2026-10-20 13:59:25 +07:00
- **Updated:** 2026-10-20 15:42:13 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Trên payment-hub, config.yaml chỉ ghi 1 trong 9 package thật vì init chỉ phát hiện một lần và không lệnh nào làm mới; đồng thời phát hiện hiện tại còn lẫn các thư mục worktree của công cụ (.kilo/worktrees/*). Sửa danh sách bỏ qua dùng chung và cho harnix update (không thêm lệnh hay cờ mới) làm mới config.yaml theo kiểu chỉ thêm.

## Non-goals

- Không xóa hay sửa mục packages, languages, technologies mà người dùng đã có.
- Không thêm lệnh hay cờ public mới và không đổi harnix init.
- Không đổi schema config v2.

## Relevant paths

- `README.md`
- `docs/HARNIX_PRD.md`
- `src/commands/update.ts`
- `src/core/stack/detection.ts`
- `src/core/repo-map/inventory.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Phát hiện stack và package (`detectProject`) bỏ qua các thư mục công cụ `.kilo`, `.worktrees`, `.cursor`, `.idea`, `.vs`, `out` và `.claude`/`.codex`/`.gemini`/`.agents` ở mọi độ sâu bằng một danh sách bỏ qua dùng chung với repo-map inventory; fixture có package thật cùng package nằm trong `.kilo/worktrees/x` và `.worktrees/y` chỉ cho ra package thật.
- [x] `ac-2` (met): `harnix update` (không cờ mới) phát hiện lại và hợp nhất vào `.harnix/config.yaml` theo kiểu chỉ thêm: thêm package, language, technology phát hiện được mà config chưa có; giữ nguyên mọi mục đã có và các khóa khác; ghi nguyên tử, giữ quyền file; kết quả có mục `configRefreshed` (các mục đã thêm, tối đa 20 đường dẫn kèm `+N more`); `update --dry-run` báo mục sẽ thêm mà không ghi.
- [x] `ac-3` (met): Làm mới là idempotent và an toàn: chạy lần hai không đổi file; config không hợp lệ hoặc project không init thì lỗi rõ ràng như `update` hiện nay và không ghi; sau khi hợp nhất, các file managed (AGENTS bootstrap, guide chọn theo config) được reconcile cùng lần chạy; một lỗi phát hiện không làm `update` thất bại (bỏ qua êm, `configRefreshed` rỗng).
- [x] `ac-4` (met): Finding `config-packages-drift` của doctor (task doctor-config-packages-drift) nêu cách xử lý là chạy `harnix update`; README và PRD mô tả hành vi; toàn bộ test suite, lint, typecheck và `test:gates` pass.

## Required checks

- [x] `chk-focus` (focused): Test danh sách bỏ qua dùng chung và update --refresh-config — pass (2026-10-20 15:38:40 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 15:38:45 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 15:40:23 +07:00)

## Decisions

- **dec-1** — Tích hợp làm mới vào harnix update (người dùng yêu cầu không thêm lệnh), chỉ thêm và không xóa; task cuối theo ID đóng epic: pnpm version:sync 2.14.0 --summary <text> --kind fixed --fold-dev, còn member workspace-status-and-gate-hardening dùng 2.14.0-dev.5.
  - _Why:_ update trở thành lệnh có thể ghi config.yaml nên phải chỉ thêm, idempotent, báo trong configRefreshed và có dry-run; chính sách phiên bản epic dành bản phát hành cho member cuối theo ID.

## Evidence

- `chk-focus` — pass (2026-10-20 15:38:40 +07:00): pnpm exec vitest run test/unit/core/stack test/unit/commands/update.test.ts test/integration/scenarios/update-refresh-config.test.ts test/unit/core/doctor — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-20 15:38:45 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-20 15:40:23 +07:00): pnpm test — exit 0
