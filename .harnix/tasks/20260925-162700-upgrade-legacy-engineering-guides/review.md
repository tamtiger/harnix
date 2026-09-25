# Nâng cấp và chuẩn hóa toàn diện nội dung 21 Engineering Guides cũ

- **ID:** 20260925-162700-upgrade-legacy-engineering-guides
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-25T09:27:00.000Z
- **Updated:** 2026-09-25T09:41:23.642Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Nâng cấp và chuẩn hóa toàn diện nội dung 21 guide files cũ lên cùng đẳng cấp chiều sâu kỹ thuật (từ 3.200 - 4.800 ký tự với 4 đề mục H2 chuyên sâu), giàu tính chỉ dẫn thực chiến và bám sát các phiên bản mới nhất của từng hệ sinh thái.

## Non-goals

- Không thay đổi cấu trúc đường dẫn file hoặc schema đã được chuẩn hóa.
- Không thêm runtime dependencies từ bên thứ ba.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-upgrade-language-common-guides` (met): 8 guide ngôn ngữ và common được nâng cấp nội dung chuyên sâu, đạt >= 3.000 ký tự và 4 đề mục H2
- `ac-upgrade-framework-runtime-guides` (met): 7 guide runtime, library và framework được nâng cấp kiến trúc thực chiến hiện đại, đạt >= 3.200 ký tự và 4 đề mục H2
- `ac-upgrade-database-guides` (met): 6 guide cơ sở dữ liệu được nâng cấp chuẩn truy vấn, indexing, an toàn giao dịch và connection pooling, đạt >= 3.000 ký tự và 4 đề mục H2
- `ac-guide-quality-and-verification` (met): Toàn bộ 21 files không chứa nội dung giữ chỗ tạm thời, toàn bộ unit test, lint, typecheck và build pass 100%

## Required checks

- `check-full-build-and-test` (full): Chạy full build, typecheck, lint và unit tests toàn hệ thống — pass (2026-09-25T09:41:10.768Z)
- `check-guides-catalog-tests` (focused): Chạy unit tests cho catalog, detection và rules — pass (2026-09-25T09:41:10.768Z)

## Decisions

- **dec-comprehensive-guide-upgrade** — Nâng cấp toàn bộ 21 guides cũ lên chuẩn 4 đề mục H2 và chiều sâu thực chiến tương đương 13 guide mới
  - _Why:_ Đảm bảo tính nhất quán chất lượng cao và giá trị chỉ dẫn chuyên sâu cho toàn bộ 34 stack trong hệ thống Harnix

## Evidence

- `check-guides-catalog-tests` — pass (2026-09-25T09:41:10.768Z): 40/40 tests pass cho catalog, detection va rules (34 guide files map 1-1, >= 2.000 chars, >= 3 H2).
- `check-full-build-and-test` — pass (2026-09-25T09:41:10.768Z): Full gate: tsup build thanh cong, tsc typecheck thanh cong, eslint sach 0 loi, 294 unit tests pass 100%.
