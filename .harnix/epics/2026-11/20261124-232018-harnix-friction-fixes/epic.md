# Epic: Giảm ma sát dùng Harnix: chạy check, advisory, gợi ý technique, chi phí context, git và scaffold

Sửa các vấn đề dùng Harnix rút ra từ phản hồi một epic thực tế và phân tích 88 phiên: chạy check bớt ma sát, advisory sớm không chặn, gợi ý technique đến được agent, giảm chi phí context mỗi lượt, bớt nhiễu git và sinh khung prd/plan.

- **Cập nhật:** 2026-11-24 23:20:18 +07:00

## Next task

- `20261124-232019-run-check-ergonomics` — Chạy check bớt ma sát: run-check không nhắc lệnh, log lỗi đầy đủ, batch finish có run-checks (`planning`)

## Members (6 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261124-232019-run-check-ergonomics` | Chạy check bớt ma sát: run-check không nhắc lệnh, log lỗi đầy đủ, batch finish có run-checks | `lite` | `planning` |
| 2 | `20261124-232020-workflow-advisories` | Advisory không chặn: sửa code trước in_progress, tiêu chí nháp cũ, thiếu Could-Not-Verify, dòng premortem | `lite` | `planning` |
| 3 | `20261124-232021-technique-surfacing` | Đưa gợi ý technique đến agent: techniqueHint và bỏ quy tắc Full luôn gợi ý | `lite` | `planning` |
| 4 | `20261124-232022-context-cost` | Giảm chi phí context mỗi lượt: bỏ Status khỏi băm, learningMax, gom note gần trùng | `lite` | `planning` |
| 5 | `20261124-232023-git-hygiene` | Giảm nhiễu git: .harnix/.gitignore và .gitattributes do init và update ghi | `lite` | `planning` |
| 6 | `20261124-232024-scaffold-docs` | Sinh khung prd và plan cho task Full đang planning, đóng epic bằng bản minor | `lite` | `planning` |

## Task Overview & Scope

### 1. `20261124-232019-run-check-ergonomics` — Chạy check bớt ma sát: run-check không nhắc lệnh, log lỗi đầy đủ, batch finish có run-checks

- **Trạng thái:** `planning`
- **Mục tiêu:** Bỏ ma sát khi chạy check: --run-check lấy lệnh từ khai báo, log lỗi đầy đủ đọc lại được, và chuỗi hoàn tất task chạy được trong một lệnh batch.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261124-232020-workflow-advisories` — Advisory không chặn: sửa code trước in_progress, tiêu chí nháp cũ, thiếu Could-Not-Verify, dòng premortem

- **Trạng thái:** `planning`
- **Mục tiêu:** Cảnh báo sớm nhưng không chặn: sửa code trước in_progress, tiêu chí nháp đã cũ, bằng chứng chỉ code-only mà chưa ghi rủi ro, và câu hỏi premortem ở ready-review.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261124-232021-technique-surfacing` — Đưa gợi ý technique đến agent: techniqueHint và bỏ quy tắc Full luôn gợi ý

- **Trạng thái:** `planning`
- **Mục tiêu:** Làm cho gợi ý technique skill thật sự đến được agent: một dòng chỉ cách nạp khi có gợi ý, và bớt gợi ý lặp vô ích.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261124-232022-context-cost` — Giảm chi phí context mỗi lượt: bỏ Status khỏi băm, learningMax, gom note gần trùng

- **Trạng thái:** `planning`
- **Mục tiêu:** Giảm chi phí context mỗi lượt: không chèn lại khối hook chỉ vì đổi trạng thái, cho đặt giới hạn ghi chú học và gom note gần trùng.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 5. `20261124-232023-git-hygiene` — Giảm nhiễu git: .harnix/.gitignore và .gitattributes do init và update ghi

- **Trạng thái:** `planning`
- **Mục tiêu:** Bớt nhiễu git cho repo dùng Harnix: file ignore và line ending của riêng .harnix do init và update ghi, mà không đụng file gốc của người dùng.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 6. `20261124-232024-scaffold-docs` — Sinh khung prd và plan cho task Full đang planning, đóng epic bằng bản minor

- **Trạng thái:** `planning`
- **Mục tiêu:** Giúp soạn prd.md và plan.md không cần heredoc: sinh khung từ criteria và check đã khai báo hoặc nạp file UTF-8 cho task Full đang planning; member cuối đóng epic.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
