# Khắc phục lỗi đếm ngoặc nhọn với regex literal và kiểu inline trong repo-map --outline

- **ID:** 20261016-100208-fix-repo-map-outline-regex-and-inline-types
- **Mode:** lite
- **Follow-up of:** 20261016-090023-serena-symbolic-navigation-adoption
- **Status:** completed/finishing
- **Created:** 2026-10-16 10:02:08 +07:00
- **Updated:** 2026-10-16 10:08:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Đảm bảo extractFileSymbols và findBraceBlockEnd trong src/core/repo-map/outline.ts bỏ qua dấu ngoặc nhọn trong regex literal và kiểu tham số/trả về inline của TypeScript

## Relevant paths

- `src/core/repo-map/outline.ts`
- `test/unit/core/repo-map/outline.test.ts`

## Relevant specs

- `.harnix/spec/guides/typescript.md`

## Acceptance criteria

- [x] `ac-1` (met): Bỏ qua dấu ngoặc nhọn và ký tự escape bên trong regex literal khi tính độ sâu ngoặc nhọn và tìm dòng kết thúc khối
- [x] `ac-2` (met): Tính chính xác endLine cho hàm và phương thức có kiểu đối tượng inline trong danh sách tham số hoặc kiểu trả về Promise<{...}>

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-16 10:07:47 +07:00)
- [x] `check-outline` (focused): Unit test cho outline.ts — pass (2026-10-16 10:06:44 +07:00)

## Decisions

- **dec-outline-regex-and-paren-braces** — Trong bộ phân tích từ vựng outline.ts, loại bỏ chuỗi trước rồi đến regex literal rồi mới đến comment dòng //, đồng thời bỏ qua cặp ngoặc nhọn { } bên trong danh sách tham số ( ) và chỉ kiểm tra kết thúc khối sau khi quét hết dòng.
  - _Why:_ Tránh đếm nhầm dấu { trong regex literal hoặc trong kiểu tham số/trả về inline của TypeScript

## Evidence

- `check-outline` — pass (2026-10-16 10:06:44 +07:00): pnpm vitest run test/unit/core/repo-map/outline.test.ts — exit 0
- `check-suite` — pass (2026-10-16 10:07:47 +07:00): pnpm test — exit 0
