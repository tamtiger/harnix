# Xây dựng ma trận liên kết Publisher và Consumer chéo microservices

- **ID:** 20261016-163145-repo-map-cross-service-event-matrix
- **Mode:** lite
- **Epic:** 20261016-163142-enterprise-dx-and-event-driven
- **Status:** completed/finishing
- **Created:** 2026-10-16 16:31:42 +07:00
- **Updated:** 2026-10-16 17:04:30 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Hỗ trợ lệnh harnix repo-map --events để kết nối các luồng publish và subscribe topic giữa các service.

## Relevant paths

- `src/core/repo-map/**`
- `src/commands/**`
- `test/**`

## Acceptance criteria

- [x] `ac-1` (met): Bổ sung cờ harnix repo-map --events tổng hợp ma trận Publisher và Subscriber theo từng Topic.
- [x] `ac-2` (met): Hỗ trợ quét chéo toàn bộ các service con khi kết hợp cờ --workspace.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — pass (2026-10-16 17:04:04 +07:00)
- [x] `check-event-matrix` (focused): Kiểm thử ma trận kết nối microservices cho repo-map --events — pass (2026-10-16 17:02:51 +07:00)

## Evidence

- `check-event-matrix` — pass (2026-10-16 17:02:51 +07:00): pnpm vitest run test/unit/core/repo-map/event-matrix.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-16 17:04:04 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
