# Bổ sung guides theo đối chiếu ECC rules

- **ID:** 20261006-100252-bo-sung-guides-theo-oi-chieu-ecc-rules
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-06 10:02:52 +07:00
- **Updated:** 2026-10-06 10:07:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Cập nhật src/guides (common, ngôn ngữ, framework) bằng các quy tắc kiểm tra được còn thiếu so với ECC, giữ nguyên ngân sách 600 token và giới hạn bullet, kèm test hồi quy cho nội dung sửa sai.

## Acceptance criteria

- `ac-1` (met): Các guide trong src/guides chứa các bổ sung đã kiểm chứng từ ECC, sửa bullet Rust expect và bullet Vue destructure lỗi thời, và vẫn qua test định dạng guide (600 token, tối đa 10 constraint, 6 mistake).

## Required checks

- `check-1` (focused): Verify Bổ sung guides theo đối chiếu ECC rules — pass (2026-10-06 10:06:26 +07:00)

## Decisions

- **d1-no-new-guides** — Không thêm guide mới (nuxt, react-native, ruby...) trong task này; cần catalog và stack detection nên thuộc task riêng.
  - _Why:_ Giữ phạm vi nội dung, tránh bề mặt mới.
- **d2-ecc-mostly-subset** — ECC rules phần lớn là tập con của guides Harnix; chỉ các quy tắc kiểm tra được còn thiếu mới đáng thêm, và mỗi bổ sung phải nằm trong giới hạn 600 token, 10 constraint, 6 mistake.
  - _Why:_ Tránh sao chép sở thích phong cách hoặc quy tắc gắn với agent ECC.

## Evidence

- `check-1` — pass (2026-10-06 10:06:26 +07:00): pnpm test — exit 0
