# Flatten cấu trúc src/guides/, mở rộng ngôn ngữ/framework và cập nhật Catalog Auto-Detection

- **ID:** 20260925-141702-guides-flatten-catalog-detection-expansion
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-25T07:20:16.302Z
- **Updated:** 2026-09-25T08:44:11.430Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Flatten toàn bộ 21 guide files thành *.md, bổ sung 5 ngôn ngữ mới và 8 frameworks mới kèm context chuẩn của từng stack, cập nhật detection và tests.

## Non-goals

- Không thay đổi frozen schema contracts của TaskRecord.
- Không thêm third-party parser runtime dependencies.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-catalog-and-detection` (met): Cập nhật types.ts, catalog.ts và detection.ts cho tất cả các stack mới
- `ac-flatten-guide-structure` (met): Toàn bộ 21 files trong src/guides/ được flatten thành *.md và cập nhật catalog.ts, spec paths
- `ac-guide-quality-and-tests` (met): Mỗi guide mới đạt chuẩn >= 2.000 ký tự, >= 3 H2 sections và toàn bộ tests pass 100%
- `ac-stack-expansion-guides` (met): Bổ sung 5 ngôn ngữ mới (rust, kotlin, swift, dart, cpp) và 8 frameworks mới kèm context chuẩn của từng stack

## Required checks

- `check-full-build-and-test` (full): Chạy full build, typecheck, lint và unit tests toàn hệ thống — pass (2026-09-25T08:44:00.032Z)
- `check-guides-catalog-tests` (focused): Chạy unit tests cho catalog, detection và rules — pass (2026-09-25T08:44:00.032Z)

## Decisions

- **dec-flatten-folder-structure** — Flatten thư mục src/guides/ từ category/name/engineering.md thành category/name.md
  - _Why:_ Tránh tạo các thư mục rườm rà chỉ chứa đúng 1 file engineering.md, giúp điều hướng và tra cứu nhanh hơn
- **dec-manifest-glob-detection** — Sử dụng manifest glob và content matching không đưa thêm parser bên thứ ba
  - _Why:_ Bảo đảm zero runtime dependency và tuân thủ non-negotiable boundaries của Harnix

## Evidence

- `check-guides-catalog-tests` — pass (2026-09-25T08:44:00.032Z): 40/40 tests pass cho catalog, detection và rules (34 guide files map 1-1, >= 2.000 chars, >= 3 H2).
- `check-full-build-and-test` — pass (2026-09-25T08:44:00.032Z): Full gate: tsup build thành công, tsc typecheck thành công, eslint sạch 0 lỗi, 294 unit tests pass 100%.
