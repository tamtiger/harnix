# Sửa các lỗi và thiếu sót hướng dẫn của Harnix gặp khi vận hành thật

- **ID:** 20261001-211347-harnix-friction-backlog
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-10-01 21:13:47 +07:00
- **Updated:** 2026-10-01 21:13:47 +07:00

**Verdict:** PENDING — 0/1 acceptance criteria met

## Goal

Gom và xử lý các lỗi do chính Harnix gây ra cho agent khi chạy workflow thật (mã, thông báo lỗi, hướng dẫn, thiết kế): danh sách nằm ở bảng backlog trong prd.md và được bổ sung sau mỗi task đã chạy. Task giữ ở planning cho tới khi người dùng chốt mục nào sửa, mục nào từ chối.

## Non-goals

- Không sửa lỗi môi trường ngoài Harnix (heredoc của Bash tool, WebFetch trả cả trang).
- Không đổi schema TaskRecord v3.
- Không commit hay push tự động.

## Acceptance criteria

- `ac-triage` (pending): Mỗi mục trong bảng backlog của prd.md được sửa (có test hoặc kiểm chứng lặp lại được) hoặc bị từ chối kèm lý do ghi trong prd.md.

## Required checks

- `chk-suite` (full): Project suite gate — chưa chạy / not yet run

## Evidence

_None recorded yet._
