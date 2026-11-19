# Epic: Skill harnix-exercise: tự sinh và chạy thử test thật

Thêm technique skill harnix-exercise để agent tự suy ra kịch bản từ tiêu chí chấp nhận, sinh test gắn [chk-id], khởi chạy ứng dụng có kiểm soát rồi gọi thử API, chạy CLI hoặc mở browser, và ghi bằng chứng qua harnix workflow --run-check; thiếu công cụ thì hạ bậc và báo rõ phần chưa kiểm chạy thật.

- **Cập nhật:** 2026-11-19 14:53:32 +07:00

## Non-goals

- Không thêm package, bin, MCP mặc định, daemon hay stage workflow mới
- Không cài công cụ ngoài (Hurl, Schemathesis, agent-browser, Playwright) và không phụ thuộc cứng vào công cụ nào
- Không sao chép nguyên văn skill hay prompt của nguồn ngoài; chỉ viết lại ngắn gọn kèm ghi công
- Không chạy trên môi trường production, không đọc hay in secret
- Không đổi hợp đồng đóng băng của TaskRecord v3 hay cơ chế bằng chứng hiện có
- Chưa hỗ trợ mobile, TUI, job/queue, performance và security smoke ở v1

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261119-140812-exercise-skill-core` | harnix-exercise: lõi skill, phát hiện loại dự án và đăng ký | `lite` | `completed` |
| 2 | `20261119-140813-exercise-api-cli-reference` | harnix-exercise: reference API, CLI và an toàn | `lite` | `completed` |
| 3 | `20261119-140814-exercise-web-reference` | harnix-exercise: reference web và hạ bậc theo nền tảng | `lite` | `completed` |
| 4 | `20261119-140815-exercise-attribution-and-release` | harnix-exercise: ghi công nguồn, đồng bộ tài liệu và phát hành | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261119-140812-exercise-skill-core` — harnix-exercise: lõi skill, phát hiện loại dự án và đăng ký

- **Trạng thái:** `completed`
- **Mục tiêu:** Tạo technique skill harnix-exercise (SKILL.md cùng reference detection và evidence), đăng ký trong technique-skills và để preflight/--suggest gợi ý khi task có hành vi chạy được cần kiểm chứng.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 2. `20261119-140813-exercise-api-cli-reference` — harnix-exercise: reference API, CLI và an toàn

- **Trạng thái:** `completed`
- **Mục tiêu:** Viết các reference api, cli và safety cho harnix-exercise: gọi thử API thật, chạy CLI, kiểm thư viện từ góc nhìn consumer, với giới hạn an toàn bắt buộc.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261119-140814-exercise-web-reference` — harnix-exercise: reference web và hạ bậc theo nền tảng

- **Trạng thái:** `completed`
- **Mục tiêu:** Viết reference web cho harnix-exercise: mở browser thật để đi qua luồng chính, thu console, request lỗi và screenshot, với thứ tự công cụ có đường lui cho nền tảng không có browser tool.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 4. `20261119-140815-exercise-attribution-and-release` — harnix-exercise: ghi công nguồn, đồng bộ tài liệu và phát hành

- **Trạng thái:** `completed`
- **Mục tiêu:** Ghi công nguồn ngoài đã adapt, đồng bộ toàn bộ tài liệu và template liên quan, thêm fixture API và CLI mẫu để kiểm skill, rồi đóng epic bằng bản phát hành minor.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

## Supporting Artifacts

- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.
