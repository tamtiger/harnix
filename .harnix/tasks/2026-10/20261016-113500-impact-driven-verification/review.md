# Kiểm thử thông minh theo độ ảnh hưởng với verify-plan --impact

- **ID:** 20261016-113500-impact-driven-verification
- **Mode:** lite
- **Epic:** 20261016-113456-harnix-dx-and-microservices-enhancement
- **Status:** completed/finishing
- **Created:** 2026-10-16 11:34:56 +07:00
- **Updated:** 2026-10-16 14:32:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 1/1 passed |

## Goal

Tích hợp repo-map --impact vào verify-plan để tự động chạy tập test hẹp bị ảnh hưởng trong chu kỳ implement.

## Relevant paths

- `src/core/stack/**`
- `src/core/repo-map/**`
- `test/**`

## Acceptance criteria

- [x] `ac-1` (met): verify-plan --impact xác định chính xác danh sách test bị ảnh hưởng dựa trên diff mã nguồn và repo-map graph.
- [x] `ac-2` (met): verify-plan --impact tích hợp mượt mà với quy trình kiểm thử của dự án, hỗ trợ cấu hình cwd và các runner phổ biến.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-16 14:31:49 +07:00)

## Evidence

- `check-suite` — pass (2026-10-16 14:31:49 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
