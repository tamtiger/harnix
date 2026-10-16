# Chuyển các lệnh ghi workflow sang mặc định brief và bảo đảm an toàn UTF-8 trên Windows

- **ID:** 20261016-163146-workflow-default-brief-and-encoding-safety
- **Mode:** lite
- **Epic:** 20261016-163142-enterprise-dx-and-event-driven
- **Status:** completed/finishing
- **Created:** 2026-10-16 16:31:42 +07:00
- **Updated:** 2026-10-16 17:19:12 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Tiết kiệm tối đa token context cho AI bằng cách mặc định hóa brief output và hoàn thiện chỉ dẫn chống lỗi font Windows.

## Relevant paths

- `src/commands/**`
- `src/core/workflow/**`
- `test/**`

## Acceptance criteria

- [x] `ac-1` (met): Các lệnh workflow thay đổi state mặc định chỉ in brief status thay vì toàn bộ task JSON.
- [x] `ac-2` (met): Bổ sung cờ --full cho workflow nếu cần in toàn bộ task record và giữ --brief tương thích ngược.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — pass (2026-10-16 17:19:00 +07:00)
- [x] `check-brief-default` (focused): Kiểm thử mặc định brief và cờ --full cho workflow — pass (2026-10-16 17:17:35 +07:00)

## Evidence

- `check-brief-default` — pass (2026-10-16 17:17:35 +07:00): pnpm vitest run test/unit/commands/workflow-handler-utils.test.ts test/integration/commands/workflow-command.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-16 17:19:00 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
