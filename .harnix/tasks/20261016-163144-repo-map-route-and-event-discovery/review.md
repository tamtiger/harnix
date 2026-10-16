# Bóc tách metadata HTTP Route và Messaging Topic cho repo-map

- **ID:** 20261016-163144-repo-map-route-and-event-discovery
- **Mode:** lite
- **Epic:** 20261016-163142-enterprise-dx-and-event-driven
- **Status:** completed/finishing
- **Created:** 2026-10-16 16:31:42 +07:00
- **Updated:** 2026-10-16 16:54:53 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

repo-map tự động bóc tách các attribute và cấu hình Event/Messaging (CAP, Kafka, RabbitMQ) và HTTP Endpoints.

## Relevant paths

- `src/core/repo-map/**`
- `test/unit/core/repo-map/**`

## Acceptance criteria

- [x] `ac-1` (met): Trích xuất HTTP routes từ các controller/endpoint attributes như [HttpGet], [HttpPost], [Route].
- [x] `ac-2` (met): Trích xuất Messaging topics từ các attribute và cấu hình [CapSubscribe], [Topic], Subscribe(...).

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — pass (2026-10-16 16:54:39 +07:00)
- [x] `check-event-discovery` (focused): Kiểm thử bóc tách HTTP Route và Messaging Topic cho repo-map — pass (2026-10-16 16:53:11 +07:00)

## Evidence

- `check-event-discovery` — pass (2026-10-16 16:53:11 +07:00): pnpm vitest run test/unit/core/repo-map/event-discovery.test.ts — exit 0
- `check-suite` — pass (2026-10-16 16:54:39 +07:00): pnpm test — exit 0
