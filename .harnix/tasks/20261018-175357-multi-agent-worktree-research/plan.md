# Plan: Khảo sát thực nghiệm Multi-Agent Worktree và xây dựng đặc tả điều phối

## Execution Slices

### Slice 1: Khảo sát thực nghiệm & Hoàn thiện research.md (ac-1)
- [x] [chk-res-1] Khảo sát đối sánh các mô hình chạy song song (Shared Directory vs Hermetic Containers vs Git Worktree) trong `.harnix/epics/20261018-175353-dx-robustness-and-php-resilience/research.md`. (ac-1)
- [x] [chk-res-2] Ghi nhận kiến trúc chuẩn Git Worktree Isolation và Task Binding `--task <id>`. (ac-1)

### Slice 2: Xây dựng đặc tả kỹ thuật spec.md (ac-2)
- [x] [chk-spec-1] Soạn thảo `.harnix/epics/20261018-175353-dx-robustness-and-php-resilience/spec.md` chi tiết hóa cơ chế xử lý xung đột `.active` và `epic.md`. (ac-2)
- [x] [chk-spec-2] Xây dựng Sequence Diagram và Giao thức điều phối 6 bước của Orchestrator cho Epic. (ac-2)

### Slice 3: Kiểm thử toàn diện & Đánh giá Test Gates (ac-3)
- [x] [check-research-docs] Chạy kiểm tra test gates bảo đảm tài liệu và định dạng tuân thủ ranh giới (`pnpm run test:gates`). (ac-1, ac-2, ac-3)
- [x] [check-suite] Chạy toàn bộ test suite dự án (`pnpm run test`). (ac-3)
