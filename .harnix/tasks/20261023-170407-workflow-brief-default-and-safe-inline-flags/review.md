# Mặc định Brief Mode cho Workflow Commands và Tự động ép UTF-8 trên Windows

- **ID:** 20261023-170407-workflow-brief-default-and-safe-inline-flags
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** planning/planning
- **Created:** 2026-10-23 17:04:07 +07:00
- **Updated:** 2026-10-23 17:08:03 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/1 passed |

## Goal

Đổi mặc định của toàn bộ các lệnh ghi workflow sang Brief Output (chỉ in id, status, checkpoint, updatedAt); thêm cờ --full khi cần in trọn vẹn JSON; hỗ trợ inline flags --note, --reason; và tự động ép UTF-8 cho stdin trên Windows win32.

## Acceptance criteria

- [ ] `ac-1` (pending): Các lệnh workflow ghi trạng thái mặc định chỉ in { id, status, checkpoint, updatedAt } mà không cần truyền cờ --brief.
- [ ] `ac-2` (pending): Truyền cờ --full in toàn bộ task record JSON như hành vi cũ.
- [ ] `ac-3` (pending): Hỗ trợ cờ inline --reason và --note cho các transition/replan mà không bị lỗi encoding tiếng Việt trên PowerShell.

## Required checks

- [ ] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
