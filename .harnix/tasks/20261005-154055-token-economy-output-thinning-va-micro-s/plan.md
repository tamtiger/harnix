# Plan - Token Economy: Output Thinning và Micro-Summary cho CLI

## Checklist
- [x] Kiểm tra và cập nhật `preflightWorkflow` trong `src/core/workflow/preflight.ts` và handler trong `src/commands/workflow-command.ts` để khi `--brief` được bật, trường `learning` không bị emit.
- [x] Cập nhật logic cắt tail hoặc brief trong `workflow --run-check` để tiết kiệm token khi pass.
- [x] Bổ sung option `--summary` cho `harnix status` trong `src/cli-workflow-commands.ts` và `src/commands/status.ts` / `src/core/status.ts`.
- [x] Cập nhật unit test và chạy verification checks.
