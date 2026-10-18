# Plan: Hỗ trợ không gian Worktree và xây dựng quy trình điều phối Epic Multi-Agent

## Execution Slices

### Slice 1: Hòa giải xung đột file trạng thái khi merge branch (ac-1)
- [x] [chk-state-1] Định nghĩa quy tắc tránh xung đột `.active` và `epic.md` trong `src/skills/harnix-plan/references/epic.md`. (ac-1)
- [x] [chk-state-2] Khẳng định tính an toàn khi merge thư mục `.harnix/tasks/<task-id>/**`. (ac-1)

### Slice 2: Xây dựng quy trình & skill điều phối cho Agent Trưởng (ac-2)
- [x] [chk-orch-1] Chuẩn hóa giao thức điều phối 6 bước (DAG Analysis, Worktree Setup, Delegation, TDD, Verification, Cleanup) trong `src/skills/harnix-plan/references/epic.md`. (ac-2)
- [x] [chk-orch-2] Hướng dẫn subagent sử dụng cờ `--task` và tuân thủ ranh giới Git Worktree. (ac-2)

### Slice 3: Kiểm thử toàn diện & Đánh giá Test Gates (ac-3)
- [x] [check-orchestration-support] Chạy kiểm tra test gates bảo đảm tài liệu và định dạng tuân thủ ranh giới (`pnpm run test:gates`). (ac-1, ac-2, ac-3)
- [x] [check-suite] Chạy toàn bộ test suite dự án (`pnpm run test`). (ac-3)
