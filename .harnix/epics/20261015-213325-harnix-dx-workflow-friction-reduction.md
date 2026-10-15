# Epic: Tinh chỉnh trải nghiệm phát triển và giảm ma sát workflow Harnix

Khắc phục các rào cản về runner Python, nhận diện source glob của ready gate, tiện ích khởi tạo Epic, cảnh báo secret scan và cải thiện khả năng quan sát của workflow CLI.

- **Cập nhật:** 2026-10-15 21:33:25 +07:00

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261015-213326-fix-check-runner-python-equivalence` | Nhận diện tương đương lệnh kiểm thử Python và gợi ý runner trong check runner | `full` | `completed` |
| 2 | `20261015-213327-fix-ready-gate-glob-inputs-and-docs` | Mở rộng nhận diện glob source trong ready gate, báo lỗi batch và chuẩn hoá tài liệu | `full` | `completed` |
| 3 | `20261015-213328-improve-epic-cli-preflight-and-skill-output` | Cải tiến CLI khởi tạo Epic, nạp file UTF-8, chuyển đổi task và DX | `full` | `completed` |
| 4 | `20261015-213329-refine-secret-scan-and-planning-process` | Thu hẹp phạm vi secret scan, nâng cao chất lượng learning note và quy trình planning | `full` | `completed` |

## Task Overview & Scope

### 1. `20261015-213326-fix-check-runner-python-equivalence` — Nhận diện tương đương lệnh kiểm thử Python và gợi ý runner trong check runner

- **Trạng thái:** `completed`
- **Mục tiêu:** Mở rộng equivalentCommand để nhận diện pytest và python -m pytest (kể cả runner prefixes) là tương đương, hỗ trợ fallback và gợi ý runner khi gặp ENOENT.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261015-213327-fix-ready-gate-glob-inputs-and-docs` — Mở rộng nhận diện glob source trong ready gate, báo lỗi batch và chuẩn hoá tài liệu

- **Trạng thái:** `completed`
- **Mục tiêu:** Mở rộng coversSource cho các thư mục source phổ biến, gom toàn bộ lỗi của ready gate để báo một lần (batch reporting), làm rõ quy tắc checklist plan.md và dọn sạch vết tích schema v2.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261015-213328-improve-epic-cli-preflight-and-skill-output` — Cải tiến CLI khởi tạo Epic, nạp file UTF-8, chuyển đổi task và DX

- **Trạng thái:** `completed`
- **Mục tiêu:** Hỗ trợ nạp cấu hình từ file (--file) cho save/batch/epic, phát hiện lỗi mất dấu text integrity, hỗ trợ resume --force và resume --next, bổ sung set-title/set-goal, hiển thị nextTask trong status/preflight và cờ raw cho skill.
- **Tiêu chí nghiệm thu:** 7 tiêu chí

### 4. `20261015-213329-refine-secret-scan-and-planning-process` — Thu hẹp phạm vi secret scan, nâng cao chất lượng learning note và quy trình planning

- **Trạng thái:** `completed`
- **Mục tiêu:** Giới hạn secret scan vào các file thay đổi thực tế của task, hỗ trợ allowlist/waiver cho false-positive, bỏ hint gây nhiễu No learning captured, kiểm tra sanity check test files khi resume và hoàn thiện tài liệu skill harnix-plan.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
