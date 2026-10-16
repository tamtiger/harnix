# Tự động hóa và giảm boilerplate với Workflow Action Batching

- **ID:** 20261016-113459-workflow-batching-and-shortcuts
- **Mode:** lite
- **Epic:** 20261016-113456-harnix-dx-and-microservices-enhancement
- **Status:** completed/finishing
- **Created:** 2026-10-16 11:34:56 +07:00
- **Updated:** 2026-10-16 14:19:22 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 1/1 passed |

## Goal

Hỗ trợ gộp các thao tác workflow thường dùng giảm round-trip của LLM và tối ưu trải nghiệm Windows CLI.

## Relevant paths

- `src/core/workflow/**`
- `src/commands/**`
- `test/**`

## Acceptance criteria

- [x] `ac-1` (met): Cho phép gộp các cờ thao tác workflow (như criterion met và transition) trong cùng một lệnh CLI.
- [x] `ac-2` (met): harnix status --summary và --explain hiển thị ngữ cảnh và tiến trình của Epic hiện tại (vị trí task và tổng số task).
- [x] `ac-3` (met): Cờ --file trong workflow cho phép nạp payload an toàn và đầy đủ thông qua đường dẫn tệp.
- [x] `ac-4` (met): Workflow CLI kiểm tra tính nhất quán giữa các cờ gộp và từ chối các kết hợp chuyển trạng thái không hợp lệ.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-16 14:19:09 +07:00)

## Evidence

- `check-suite` — pass (2026-10-16 14:19:09 +07:00): pnpm test — exit 0
