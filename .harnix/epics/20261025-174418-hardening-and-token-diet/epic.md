# Epic: Sửa lỗi P1/P2 từ đợt review toàn diện, refactor nguồn duy nhất, tối ưu token và tốc độ test

Xử lý các lỗi và lỗi tiềm ẩn do review toàn diện phát hiện (ưu tiên bảo mật và mất dữ liệu), gom các danh sách action/flag phải đồng bộ tay về một nguồn, giảm token mỗi phiên và giảm thời gian chạy toàn bộ test, mà không làm yếu gate, contract hay ngưỡng coverage.

- **Cập nhật:** 2026-10-25 18:45:51 +07:00

## Non-goals

- Không đổi field, enum, đường dẫn hay hook protocol đóng băng ngoài phạm vi từng task
- Không thêm nền tảng, service, telemetry hay truy cập mạng thầm lặng
- Không hạ ngưỡng coverage và không regenerate golden để refactor xanh

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261025-174419-p1-correctness-and-security` | Sửa 8 lỗi P1: replay task đã hoàn tất, mất cập nhật song song, git/glob nguy hiểm, cờ và epic sai, bộ lọc learning | `full` | `completed` |
| 2 | `20261025-174420-p2-hardening-and-consistency` | Sửa lỗi P2: breaker skipped giả, cờ không owner, status --criteria, restore-artifacts, crash giữa transaction | `full` | `completed` |
| 3 | `20261025-174421-refactor-single-source-and-git` | Refactor: một nguồn duy nhất cho action/flag, module git dùng chung, bộ lọc learning dạng bảng | `full` | `completed` |
| 4 | `20261025-174422-token-diet` | Tối ưu token: schema gọn mặc định, bỏ lặp cookbook, giảm skill sát trần, preflight bỏ khóa rỗng | `full` | `completed` |
| 5 | `20261025-182656-improve-test-speed` | Cải thiện tốc độ test: repo mẫu dùng chung, gộp kịch bản trùng, rút ngắn các file chậm nhất | `full` | `completed` |

## Task Overview & Scope

### 1. `20261025-174419-p1-correctness-and-security` — Sửa 8 lỗi P1: replay task đã hoàn tất, mất cập nhật song song, git/glob nguy hiểm, cờ và epic sai, bộ lọc learning

- **Trạng thái:** `completed`
- **Mục tiêu:** Sửa các lỗi P1 đã tái hiện: lưu lại task completed làm kẹt dự án, hai lệnh ghi song song mất dữ liệu, verify-plan chạy chương trình của .git/config, ReDoS trong .harnixignore, --set-paths --file bị từ chối, harnix epic ẩn epic mới nhất, và hai lỗ hổng bộ lọc learning-safety.
- **Tiêu chí nghiệm thu:** 8 tiêu chí

### 2. `20261025-174420-p2-hardening-and-consistency` — Sửa lỗi P2: breaker skipped giả, cờ không owner, status --criteria, restore-artifacts, crash giữa transaction

- **Trạng thái:** `completed`
- **Mục tiêu:** Xử lý các lỗi P2 đã tái hiện: evidence skipped giả mở breaker, cờ được nhận im lặng, status --criteria khác hành vi, id learning thô, restore-artifacts dùng task.id, collision vĩnh viễn sau crash; đồng bộ --run-checks với quyết định A3 (breaker mở lại khi digest đổi) và tài liệu với quyết định A5 (sửa chữ tiêu chí có evidence kèm --reason); sửa ba lỗi P3 rẻ. Các nghi vấn chưa tái hiện được ghi làm residual risk.
- **Tiêu chí nghiệm thu:** 10 tiêu chí

### 3. `20261025-174421-refactor-single-source-and-git` — Refactor: một nguồn duy nhất cho action/flag, module git dùng chung, bộ lọc learning dạng bảng

- **Trạng thái:** `completed`
- **Mục tiêu:** Gom các danh sách action và flag phải đồng bộ tay về một bảng ACTIONS để sinh thông báo lỗi, hint, BRIEF_ACTIONS và schema; đưa mọi lời gọi git qua module dùng chung; biến bộ lọc learning thành bảng quy tắc có test bảng, giữ nguyên hành vi quan sát được.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261025-174422-token-diet` — Tối ưu token: schema gọn mặc định, bỏ lặp cookbook, giảm skill sát trần, preflight bỏ khóa rỗng

- **Trạng thái:** `completed`
- **Mục tiêu:** Giảm token của một phiên Lite điển hình (baseline khoảng 10,8k) bằng cách bỏ khối transports khỏi --schema mặc định, gộp cookbook lặp giữa workflow.md và reference, chuyển phần ít dùng của skill sát trần sang reference và bỏ khóa rỗng ở preflight, kèm test bảo vệ nội dung bắt buộc. Là member dev.3; task improve-test-speed là member cuối theo ID và đóng epic.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 5. `20261025-182656-improve-test-speed` — Cải thiện tốc độ test: repo mẫu dùng chung, gộp kịch bản trùng, rút ngắn các file chậm nhất

- **Trạng thái:** `completed`
- **Mục tiêu:** Giảm thời gian chạy toàn bộ test (baseline 109 giây không coverage, 130 giây có coverage, đo ngày 2026-10-25 trên cùng máy) bằng cách dựng repo mẫu một lần rồi copy cho từng test, gộp kịch bản trùng nhau và rút ngắn các file chậm nhất, mà không giảm số test, số assertion hay ngưỡng coverage. Task cuối theo ID nên đóng epic bằng bản minor với --fold-dev.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
