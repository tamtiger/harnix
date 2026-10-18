# PRD: Hỗ trợ không gian Worktree và xây dựng quy trình điều phối Epic Multi-Agent

## 1. Bối cảnh & Vấn đề

Khi nhiều agent thực thi song song trên các Git worktree độc lập nhằm giải quyết các member tasks của Epic:
- Cần có sự nhận biết và hướng dẫn rõ ràng để tránh xung đột file trạng thái khi merge branch (con trỏ `.active`, derived `epic.md`).
- Cần chuẩn hóa quy trình điều phối 6 bước (DAG Analysis, Worktree Setup, Delegation, TDD Execution, Verification, Merge & Cleanup) cho Agent Trưởng.

## 2. Ranh giới & Ràng buộc

- **Ranh giới sản phẩm**: Harnix giữ nguyên kiến trúc 1 package, 1 CLI executable; không thêm background worker daemon, không tự ý mutate git (`git worktree add`, `git commit`, `git merge`).
- **Git Safety**: Quản lý worktree và merge branch do Orchestrator (Agent Trưởng) hoặc người dùng điều phối.
- **Tương thích**: Tài liệu hướng dẫn tích hợp vào reference guide chính thức của `harnix-plan` (`src/skills/harnix-plan/references/epic.md`).

## 3. Yêu cầu kỹ thuật cốt lõi

1. Bổ sung mục tài liệu "Multi-Agent Worktree Orchestration and State Reconciliation" vào `src/skills/harnix-plan/references/epic.md`.
2. Định nghĩa chi tiết quy tắc hòa giải xung đột Git (không commit `.active` và `epic.md` trên branch worktree, commit an toàn thư mục task).
3. Chuẩn hóa giao thức điều phối 6 bước của Lead Agent.
4. Bảo đảm test gates và test suites pass 100%.

## 4. Rủi ro & Chiến lược giảm thiểu

- **Rủi ro**: Nguy cơ xung đột git khi hai subagent sửa cùng file mã nguồn.  
  *Giảm thiểu*: Giao thức điều phối yêu cầu Lead Agent phân tích DAG `inputs` độc lập trước khi giao task song song.
