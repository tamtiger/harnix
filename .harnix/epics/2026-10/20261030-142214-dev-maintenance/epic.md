# Epic: Giảm ma sát khi phát triển Harnix

Sửa các điểm gây ma sát khi phát triển đã gặp trong epic workflow-ergonomics: tài liệu hợp đồng bị hỏng, golden ghi sai định dạng, changelog lặp ý, footprint và thời gian test.

- **Cập nhật:** 2026-10-30 15:20:35 +07:00

## Non-goals

- Không đổi hợp đồng đóng băng của task, evidence hay hook.
- Không nới mức trần footprint hay ngân sách token chỉ để test qua.

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261030-142217-footprint-skill-references` | Bỏ giới hạn footprint của setup | `lite` | `completed` |
| 2 | `20261030-142218-speed-up-slow-tests` | Giảm tranh chấp khi chạy cả suite test | `lite` | `completed` |
| 3 | `20261030-142214-fix-plan-slug-line` | Sửa dòng 444 bị hỏng của IMPLEMENTATION_PLAN | `lite` | `completed` |
| 4 | `20261030-142215-golden-prettier-output` | Golden ghi đúng định dạng Prettier | `lite` | `completed` |
| 5 | `20261030-142216-changelog-fold-optional-summary` | Changelog --fold-dev không lặp ý của bản dev | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261030-142217-footprint-skill-references` — Bỏ giới hạn footprint của setup

- **Trạng thái:** `completed`
- **Mục tiêu:** Quyết định của người dùng (2026-10-30): footprint của harnix setup không còn bị giới hạn byte; mục tiêu tối ưu là token của skill và reference. measure:footprint chỉ còn đo và in số liệu.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 2. `20261030-142218-speed-up-slow-tests` — Giảm tranh chấp khi chạy cả suite test

- **Trạng thái:** `completed`
- **Mục tiêu:** Đo cho thấy file test chạy riêng nhanh hơn trong suite 4 đến 13 lần (git 2.2 s so với 29 s, learning-automation 10.7 s so với 43 s) và cả suite nhanh nhất ở 8 worker (68 s) so với 12 worker mặc định (89 s): thời gian mất do tranh chấp tài nguyên, không do nội dung test.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 3. `20261030-142214-fix-plan-slug-line` — Sửa dòng 444 bị hỏng của IMPLEMENTATION_PLAN

- **Trạng thái:** `completed`
- **Mục tiêu:** Khôi phục mục (10) về --slug trong docs/IMPLEMENTATION_PLAN.md: dòng 444 bị chèn nhầm tiêu đề tài liệu và mất phần cuối của mục, có từ v2.22.1.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 4. `20261030-142215-golden-prettier-output` — Golden ghi đúng định dạng Prettier

- **Trạng thái:** `completed`
- **Mục tiêu:** HARNIX_UPDATE_GOLDEN=1 hiện ghi JSON thụt lề 2 và làm phình diff cả trăm dòng; phải ghi đúng định dạng Prettier của repo để diff chỉ còn thay đổi thật.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 5. `20261030-142216-changelog-fold-optional-summary` — Changelog --fold-dev không lặp ý của bản dev

- **Trạng thái:** `completed`
- **Mục tiêu:** version:sync --fold-dev luôn thêm một gạch đầu dòng tóm tắt dù các bản dev đã mô tả đủ; cho phép đóng epic mà không thêm bullet lặp.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

## Supporting Artifacts

- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.
