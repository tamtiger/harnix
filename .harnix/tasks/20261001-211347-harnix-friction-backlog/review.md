# Sửa các lỗi và thiếu sót hướng dẫn của Harnix gặp khi vận hành thật

- **ID:** 20261001-211347-harnix-friction-backlog
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-01 21:13:47 +07:00
- **Updated:** 2026-10-02 14:29:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Gom và xử lý các lỗi do chính Harnix gây ra cho agent khi chạy workflow thật (mã, thông báo lỗi, hướng dẫn, thiết kế): danh sách nằm ở bảng backlog trong prd.md và được bổ sung sau mỗi task đã chạy. Task giữ ở planning cho tới khi người dùng chốt mục nào sửa, mục nào từ chối.

## Non-goals

- Không sửa lỗi môi trường ngoài Harnix (heredoc của Bash tool, WebFetch trả cả trang).
- Không đổi schema TaskRecord v3.
- Không commit hay push tự động.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-triage` (met): Mỗi mục trong bảng backlog của prd.md được sửa (có test hoặc kiểm chứng lặp lại được) hoặc bị từ chối kèm lý do ghi trong prd.md.

## Required checks

- `chk-suite` (full): Project suite gate — pass (2026-10-02 14:27:42 +07:00)
- `chk-diagnostics` (focused): Unit tests for error message improvements — pass (2026-10-02 14:28:18 +07:00)
- `chk-cli-workflow` (focused): Unit tests for CLI workflow improvements — pass (2026-10-02 14:28:27 +07:00)
- `chk-reconcile-update` (focused): Unit tests for reconcile and update dry-run — pass (2026-10-02 14:28:36 +07:00)
- `chk-extract` (focused): Unit tests for C# using extraction in repo map — pass (2026-10-02 14:28:44 +07:00)

## Evidence

- `chk-diagnostics` — pass (2026-10-02 14:28:18 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-cli-workflow` — pass (2026-10-02 14:28:27 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-reconcile-update` — pass (2026-10-02 14:28:36 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-extract` — pass (2026-10-02 14:28:44 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-02 14:27:42 +07:00): pwsh.exe — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
