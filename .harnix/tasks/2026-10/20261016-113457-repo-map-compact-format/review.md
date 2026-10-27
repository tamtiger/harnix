# Hỗ trợ định dạng Compact và Outline cho harnix repo-map query

- **ID:** 20261016-113457-repo-map-compact-format
- **Mode:** lite
- **Epic:** 20261016-113456-harnix-dx-and-microservices-enhancement
- **Status:** completed/finishing
- **Created:** 2026-10-16 11:34:56 +07:00
- **Updated:** 2026-10-16 13:45:40 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Thêm cờ --format <json|compact|outline> vào repo-map --query giúp cắt giảm 70% token context cho LLM.

## Relevant paths

- `src/commands/repo-map-internal.ts`
- `src/core/repo-map/search.ts`
- `src/core/repo-map/service.ts`
- `src/core/repo-map/types.ts`
- `test/**`

## Acceptance criteria

- [x] `ac-1` (met): Lệnh harnix repo-map --query hỗ trợ cờ --format compact và --format outline; định dạng compact trả về danh sách rút gọn { path, score, symbols: string[] }, giảm trên 65% ký tự so với định dạng json mặc định trên cùng fixture.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — pass (2026-10-16 13:44:55 +07:00)
- [x] `check-compact` (focused): Kiểm thử định dạng compact và outline của repo-map query — pass (2026-10-16 13:41:20 +07:00)

## Evidence

- `check-compact` — pass (2026-10-16 13:41:20 +07:00): pnpm vitest run test/unit/core/repo-map/compact.test.ts — exit 0
- `check-suite` — pass (2026-10-16 13:44:55 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
