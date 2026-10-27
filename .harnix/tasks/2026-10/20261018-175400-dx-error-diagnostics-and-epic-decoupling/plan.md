# Plan: Chẩn đoán lỗi validation chi tiết, tối ưu hóa DX vận hành và đóng Epic

## Execution Slices

### Slice 1: Chi tiết hóa lỗi assertIdentity & Chuẩn hóa obligations cwd (ac-1, ac-2)
- [x] [chk-id-1] Tách riêng 4 assertion cho id, mode, status, checkpoint trong `src/core/tasks/task-validate.ts`. (ac-1)
- [x] [chk-cwd-1] Chuẩn hóa `cwd` trong `obligationsChanged` (`src/core/workflow/obligations.ts`). (ac-2)
- [x] [chk-replan-1] Tinh chỉnh thông báo lỗi gợi ý cú pháp `ready/ready --reviewed` khi ở checkpoint `replan` (`src/core/workflow/transition.ts`). (ac-2)

### Slice 2: Bổ sung cờ --brief cho resume và hỗ trợ comma-separated criteria (ac-4)
- [x] [chk-resume-1] Đăng ký option `--brief` cho lệnh `resume` trong `src/commands/resume.ts` và xử lý kết xuất brief. (ac-4)
- [x] [chk-crit-1] Cải tiến parser cho `--criterion` trong `src/core/workflow/criterion.ts` để phân tách dấu phẩy. (ac-4)

### Slice 3: Đồng bộ toàn diện tài liệu dự án và Đóng Epic (ac-3, ac-5)
- [x] [chk-doc-1] Đồng bộ AGENTS.md, activation.ts, workflow templates, skills và README.md. (ac-5)
- [x] [chk-ver-1] Chạy `pnpm version:sync 2.11.0 --summary "..." --fold-dev`. (ac-5)
- [x] [chk-sync-1] Chạy `pnpm selfhost:sync` nếu workflow template thay đổi. (ac-5)
- [x] [check-dx-diagnostics] Chạy unit tests cho task validation và resume (`pnpm test:unit test/unit/core/tasks/task-validate.test.ts`). (ac-1, ac-2, ac-3, ac-4, ac-5)
- [x] [check-suite] Chạy toàn bộ test suite dự án (`pnpm run test`). (ac-3)
