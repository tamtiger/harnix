# Epic: Sửa các vấn đề dùng Harnix rút ra từ 47 session cũ

Giảm ma sát và rủi ro khi dùng Harnix dựa trên bằng chứng từ 47 session ở 7 repo: buộc kiểm chạy thật sau implement, giảm lỗi khai báo obligation, lấp khoảng trống bề mặt CLI và tăng tốc verify/finish.

- **Cập nhật:** 2026-11-24 11:10:18 +07:00

## Non-goals

- Không đổi hợp đồng đóng băng TaskRecord v3, hook protocol hay chuyển trạng thái
- Không thêm package, bin, daemon, telemetry hay nền tảng mới
- Không tự động commit, branch, push
- Không sửa lỗi shell của agent (heredoc) ngoài việc ghi hướng dẫn nếu cần

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261124-111019-exercise-gate` | Buộc kiểm chạy thật sau implement: cảnh báo ready, runbook repo, mode full/partial/code-only | `lite` | `completed` |
| 2 | `20261124-111020-obligation-friction` | Giảm ma sát khi khai báo obligation: gộp lỗi ready, hint đúng thứ tự, slug tự sinh | `lite` | `completed` |
| 3 | `20261124-111021-cli-surface-gaps` | Lấp khoảng trống bề mặt CLI: tạo epic bằng cờ, status --task, repo-map --refs | `lite` | `completed` |
| 4 | `20261124-111022-verify-speed-and-finish` | Tăng tốc phản hồi verify và gọn bước finish; đóng epic bằng bản minor | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261124-111019-exercise-gate` — Buộc kiểm chạy thật sau implement: cảnh báo ready, runbook repo, mode full/partial/code-only

- **Trạng thái:** `completed`
- **Mục tiêu:** Giảm số lần người dùng phải tự bắt lỗi sau khi task báo xong: ready dry-run cảnh báo khi tiêu chí có hành vi quan sát được mà không có check chạy thật, repo ghi sẵn cách chạy thật để agent khỏi bị nhắc lại, và evidence ghi rõ mức đã chạy.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261124-111020-obligation-friction` — Giảm ma sát khi khai báo obligation: gộp lỗi ready, hint đúng thứ tự, slug tự sinh

- **Trạng thái:** `completed`
- **Mục tiêu:** Agent không phải đoán thứ tự và cú pháp: lỗi ready/dry-run được gom một lần, hint của các lệnh sửa obligation in sẵn lệnh đúng, và --init tự sinh slug khi title có dấu.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261124-111021-cli-surface-gaps` — Lấp khoảng trống bề mặt CLI: tạo epic bằng cờ, status --task, repo-map --refs

- **Trạng thái:** `completed`
- **Mục tiêu:** Bỏ nhu cầu viết JSON thủ công để dựng epic, cho phép xem trạng thái task không active, và để repo-map --refs dùng được với workspace và với mã dạng chuỗi.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261124-111022-verify-speed-and-finish` — Tăng tốc phản hồi verify và gọn bước finish; đóng epic bằng bản minor

- **Trạng thái:** `completed`
- **Mục tiêu:** Giảm token và lượt thao tác lúc verify và finish: run-checks in tóm tắt gọn kèm tên test hỏng, status --checks hiện thời lượng, finish đề xuất commit và cảnh báo file ngoài paths; member cuối đóng epic.
- **Tiêu chí nghiệm thu:** 6 tiêu chí
