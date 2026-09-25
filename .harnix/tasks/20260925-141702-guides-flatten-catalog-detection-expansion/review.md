# Flatten cấu trúc src/guides/, mở rộng ngôn ngữ/framework và cập nhật Catalog Auto-Detection

- **ID:** 20260925-141702-guides-flatten-catalog-detection-expansion
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-25T07:20:16.302Z
- **Updated:** 2026-09-25T07:20:16.302Z

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Flatten toàn bộ 21 guide files thành *.md, bổ sung 5 ngôn ngữ mới và 8 frameworks mới kèm context chuẩn của từng stack, cập nhật detection và tests.

## Non-goals

- Không thay đổi frozen schema contracts của TaskRecord.
- Không thêm third-party parser runtime dependencies.

## Acceptance criteria

- `ac-catalog-and-detection` (pending): Cập nhật types.ts, catalog.ts và detection.ts cho tất cả các stack mới
- `ac-flatten-guide-structure` (pending): Toàn bộ 21 files trong src/guides/ được flatten thành *.md và cập nhật catalog.ts, spec paths
- `ac-guide-quality-and-tests` (pending): Mỗi guide mới đạt chuẩn >= 2.000 ký tự, >= 3 H2 sections và toàn bộ tests pass 100%
- `ac-stack-expansion-guides` (pending): Bổ sung 5 ngôn ngữ mới (rust, kotlin, swift, dart, cpp) và 8 frameworks mới kèm context chuẩn của từng stack

## Required checks

- `check-guides-catalog-tests` (focused): Chạy unit tests cho catalog, detection và rules — chưa chạy / not yet run

## Evidence

_None recorded yet._
