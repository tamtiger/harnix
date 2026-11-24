# Epic: Học từ 3 repo skill ngoài: kiểm skill, suy luận trước ready, review và quét an toàn

Áp dụng phần chuyển được từ research-agent-skills, thinking-framework-skills và claude-code-skills vào harnix mà không nhập nguyên skill: test định tuyến và tham chiếu skill, reference suy luận cho plan/debug/research, lời văn review/verify, và finding doctor quét skill ngoài.

- **Cập nhật:** 2026-11-24 21:37:57 +07:00

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261124-213758-skill-routing-gates` | Test định tuyến skill suggest và kiểm tham chiếu skill | `lite` | `completed` |
| 2 | `20261124-213759-reasoning-references` | Reference suy luận trước ready, debug giả thuyết đối thủ và chuẩn nguồn research | `lite` | `completed` |
| 3 | `20261124-213800-review-verify-wording` | Chuẩn hóa lời văn review và verify: không-chứng-minh, could-not-verify, escalation | `lite` | `completed` |
| 4 | `20261124-213801-skill-content-scan-doctor` | Finding doctor quét nội dung đáng ngờ trong skill ngoài và đóng epic bằng bản minor | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261124-213758-skill-routing-gates` — Test định tuyến skill suggest và kiểm tham chiếu skill

- **Trạng thái:** `completed`
- **Mục tiêu:** Bắt hồi quy định tuyến của harnix skill --suggest và mọi tham chiếu treo (skill, reference, cờ) trong nguồn skill bằng test tất định, không dùng model và không thêm dependency.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261124-213759-reasoning-references` — Reference suy luận trước ready, debug giả thuyết đối thủ và chuẩn nguồn research

- **Trạng thái:** `completed`
- **Mục tiêu:** Đưa ba nhóm kỹ thuật suy luận chuyển được từ repo ngoài vào harnix dưới dạng reference ngắn nằm trong trần token: rủi ro trước ready, giả thuyết đối thủ khi debug, chuẩn nguồn khi research.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261124-213800-review-verify-wording` — Chuẩn hóa lời văn review và verify: không-chứng-minh, could-not-verify, escalation

- **Trạng thái:** `completed`
- **Mục tiêu:** Siết lời hướng dẫn của review, verify và implement để bằng chứng nêu rõ điều nó không chứng minh, phần không kiểm được và lối thoát replan, mà không đổi CLI hay transition.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261124-213801-skill-content-scan-doctor` — Finding doctor quét nội dung đáng ngờ trong skill ngoài và đóng epic bằng bản minor

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm finding doctor chỉ đọc cảnh báo nội dung đáng ngờ trong skill và guide của dự án (nguồn ngoài), rồi đóng epic bằng bản minor sau một lượt harnix-review trên toàn diff.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

## Supporting Artifacts

- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.
