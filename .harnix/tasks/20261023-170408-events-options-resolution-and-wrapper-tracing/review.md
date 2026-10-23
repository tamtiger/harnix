# AST C# Constant/Options Resolution và cấu hình Producer Wrappers cho repo-map --events

- **ID:** 20261023-170408-events-options-resolution-and-wrapper-tracing
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** planning/planning
- **Created:** 2026-10-23 17:04:08 +07:00
- **Updated:** 2026-10-23 17:08:03 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/1 passed |

## Goal

Phân tích AST C# bóc tách chuỗi thực tế từ constant/Options class; hỗ trợ cấu hình events.producerWrappers trong config.yaml; loại bỏ triệt để các biến rác dynamic (eto.EventName, splitTopics, dataKafka).

## Acceptance criteria

- [ ] `ac-1` (pending): Trích xuất chính xác giá trị chuỗi từ const string và default property initializer của class *Options.cs.
- [ ] `ac-2` (pending): Hỗ trợ cấu hình events.producerWrappers trong config.yaml để nhận diện caller hàm wrapper là Publisher thực tế.
- [ ] `ac-3` (pending): Loại bỏ hoàn toàn các identifier biến rác (eto.EventName, splitTopics, checkResult.CancelEto, ObjectMapper.Map).

## Required checks

- [ ] `check-suite` (full): Toàn bộ test suite và test AST C# events phải pass — chưa chạy / not yet run

## Evidence

_None recorded yet._
