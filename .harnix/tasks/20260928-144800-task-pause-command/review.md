# Bổ sung lệnh harnix pause để tạm hoãn active task an toàn

- **ID:** 20260928-144800-task-pause-command
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28T07:49:17.584Z
- **Updated:** 2026-09-28T08:11:19.688Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Bổ sung lệnh public harnix pause [--dry-run] vào Harnix CLI và cập nhật các skill/rules để cho phép người dùng và coding agent tạm gác active task một cách an toàn mà không vi phạm nguyên tắc 'Never edit .active directly'.

## Non-goals

- Không cho phép nhiều active task cùng lúc (giữ nguyên Invariant 1).
- Không tự động commit, stash hay xóa working tree của Git.
- Không thay đổi trạng thái của task sang completed hay cancelled khi pause.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-pause-core-logic` (met): Module task-pause.ts xử lý logic xóa con trỏ active pointer một cách atomic, hỗ trợ dryRun, kiểm tra trạng thái active task và fail closed nếu task không hợp lệ.
- `ac-cli-pause-command` (met): CLI hỗ trợ lệnh harnix pause [--dry-run] trả về JSON schema chuẩn, với outcome paused, would-pause hoặc no-active-task.
- `ac-skills-and-docs` (met): Cập nhật tài liệu (docs/HARNIX_WORKFLOW.md, docs/HARNIX_PRD.md) và các skills (harnix-brainstorm, harnix-continue) để hướng dẫn agent sử dụng harnix pause khi người dùng muốn tạm hoãn task.
- `ac-tests-and-verification` (met): Đầy đủ unit tests và integration tests cho lệnh harnix pause, toàn bộ test suite pass sạch.

## Required checks

- `check-unit-tests` (focused): Unit tests cho core task pause logic — pass (2026-09-28T08:09:04.877Z)
- `check-integration-tests` (focused): Integration tests cho CLI harnix pause — pass (2026-09-28T08:09:27.870Z)
- `check-skills-and-docs` (focused): Kiểm tra tính đầy đủ của tài liệu và skills — pass (2026-09-28T08:09:54.772Z)
- `check-full-verification` (full): Toàn bộ test suite và typecheck pass — pass (2026-09-28T08:10:49.866Z)

## Evidence

- `check-unit-tests` — pass (2026-09-28T08:09:04.877Z): Tat ca 4 unit tests cho core task pause logic deu pass.
- `check-integration-tests` — pass (2026-09-28T08:09:27.870Z): Integration test cho CLI harnix pause (dry-run, active pause, no-active) pass 100%.
- `check-skills-and-docs` — pass (2026-09-28T08:09:54.772Z): Tài liệu và skills đã được cập nhật đầy đủ và đồng bộ chuẩn quy tắc Harnix.
- `check-full-verification` — pass (2026-09-28T08:10:49.866Z): Toan bo typecheck, unit tests va integration tests pass 100%.
