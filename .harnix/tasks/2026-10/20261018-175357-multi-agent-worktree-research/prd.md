# PRD: Khảo sát thực nghiệm Multi-Agent Worktree và xây dựng đặc tả điều phối

## 1. Bối cảnh & Vấn đề

Khi thực hiện các Epic lớn với nhiều member tasks độc lập, việc chạy tuần tự từng task làm kéo dài chu kỳ phát triển. Việc chạy song song nhiều coding agent đòi hỏi giải quyết ba vấn đề cốt lõi:
- Xung đột con trỏ `.active`.
- Tranh chấp mã nguồn trong working tree chung làm stale `inputDigest`.
- Xung đột file trạng thái khi merge branch (`.active`, `epic.md`).

## 2. Ranh giới & Ràng buộc

- **Ranh giới sản phẩm**: Harnix giữ nguyên kiến trúc 1 package, 1 CLI executable; không thêm daemon, worker ngầm hay background service.
- **Git Safety**: CLI không tự động chạy các lệnh mutate git (`git worktree add`, `git commit`, `git merge`); việc tạo worktree và điều phối là do Orchestrator hoặc người dùng thực hiện.
- **Phạm vi task**: Đây là task nghiên cứu và đặc tả (Research & Spec), chuẩn bị nền tảng lý thuyết và kiến trúc cho Task 5b tiếp theo.

## 3. Yêu cầu kỹ thuật cốt lõi

1. Hoàn thiện tài liệu khảo sát `research.md` trong thư mục Epic với phân tích thực tế từ các coding agent runner hàng đầu (Antigravity, Claude Code, Cursor).
2. Xây dựng tài liệu đặc tả `spec.md` trong thư mục Epic định nghĩa cơ chế xử lý conflict state, kiến trúc cờ `--task <id>` (Task Binding), và giao thức 6 bước điều phối Multi-Agent an toàn qua Git Worktree.
3. Bảo đảm tất cả các test gates hiện có của Harnix tiếp tục pass 100%.

## 4. Rủi ro & Chiến lược giảm thiểu

- **Rủi ro**: Thiết kế giải pháp quá phức tạp vượt ngoài năng lực CLI đơn thuần.  
  *Giảm thiểu*: Giữ logic CLI tối giản (chỉ cần nhận cờ `--task <id>` trực tiếp thay vì phụ thuộc `.active`), giao toàn bộ việc điều phối worktree và merge cho Agent Trưởng thông qua hướng dẫn kỹ thuật.
