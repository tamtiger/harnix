# Epic: Khắc phục toàn diện các phát hiện và nợ kỹ thuật từ đợt review

Giải quyết 5 vấn đề: ngân sách token always-loaded, hiệu năng test legacy-history, an toàn resolve lệnh Windows, phân loại learning backlog, và công thái học test-structure.

- **Cập nhật:** 2026-10-21 10:11:19 +07:00

## Non-goals

- Không thay đổi hợp đồng đóng băng của TaskRecord schema v3
- Không bổ sung lệnh public mới ngoài 17 lệnh hiện có

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261021-101120-token-budget-diet` | Cắt giảm ngân sách token của khối hướng dẫn luôn nạp (always-loaded) | `lite` | `completed` |
| 2 | `20261021-101121-legacy-history-performance` | Tối ưu hiệu năng legacy-history.test.ts bằng fixture cô lập | `lite` | `completed` |
| 3 | `20261021-101122-windows-executable-resolution` | Tra cứu PATH cho executable có đuôi mở rộng trên Windows | `lite` | `completed` |
| 4 | `20261021-101123-learning-backlog-curation` | Gợi ý tự động thăng hạng learning tại --finish và phân loại learning backlog | `lite` | `completed` |
| 5 | `20261021-101124-test-structure-guidance` | Cải thiện hướng dẫn cấu trúc test mirror để tránh bẫy huỷ task | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261021-101120-token-budget-diet` — Cắt giảm ngân sách token của khối hướng dẫn luôn nạp (always-loaded)

- **Trạng thái:** `completed`
- **Mục tiêu:** Rút gọn template activation.ts và agents.ts từ 1.493 tokens xuống ~1.300 tokens, giải phóng dư địa an toàn dưới trần 1.500 tokens
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 2. `20261021-101121-legacy-history-performance` — Tối ưu hiệu năng legacy-history.test.ts bằng fixture cô lập

- **Trạng thái:** `completed`
- **Mục tiêu:** Chuyển legacy-history.test.ts sang đọc fixture đóng băng cô lập để giảm thời gian chạy từ 13.7s xuống <1s
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 3. `20261021-101122-windows-executable-resolution` — Tra cứu PATH cho executable có đuôi mở rộng trên Windows

- **Trạng thái:** `completed`
- **Mục tiêu:** check-runner tra cứu đường dẫn đầy đủ trên PATH cho executable có phần mở rộng (.exe, .com) trên Windows để tránh libuv tìm trong cwd
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 4. `20261021-101123-learning-backlog-curation` — Gợi ý tự động thăng hạng learning tại --finish và phân loại learning backlog

- **Trạng thái:** `completed`
- **Mục tiêu:** Bổ sung cơ chế gợi ý thăng hạng (promotable candidate hint) tự động trong kết quả --finish khi có candidate chín muồi, đồng thời chốt 5 quy tắc bất biến vào learned.md và dọn dẹp draft rác
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 5. `20261021-101124-test-structure-guidance` — Cải thiện hướng dẫn cấu trúc test mirror để tránh bẫy huỷ task

- **Trạng thái:** `completed`
- **Mục tiêu:** Bổ sung hướng dẫn kiểm tra quy tắc mirror cấu trúc test file trong workflow guide và test-structure message
- **Tiêu chí nghiệm thu:** 1 tiêu chí
