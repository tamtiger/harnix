# Đồng bộ tài liệu theo epic 2.12.0 và sửa lỗi lint có sẵn

- **ID:** 20261019-165403-sync-docs-and-fix-lint
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-19 16:54:03 +07:00
- **Updated:** 2026-10-19 17:11:11 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 1 | risk-1: medium |

## Goal

Cập nhật AGENTS.md, README, tài liệu docs, template agent, skill và workflow cho khớp hành vi mới của epic 2.12.0, rồi đưa pnpm run lint về exit 0 mà không đổi hành vi chạy.

## Relevant paths

- `AGENTS.md`
- `README.md`
- `docs`
- `src/core/epics/epic.ts`
- `src/core/stack`
- `src/core/status.ts`
- `src/core/tasks/task-review.ts`
- `src/core/verification`
- `src/core/workflow/ready-content.ts`
- `src/skills`
- `src/templates/harnix`
- `src/utils/check-runner.ts`

## Acceptance criteria

- [x] `ac-1` (met): Tài liệu và template (AGENTS.md, README.md, docs/, src/templates, src/skills, .harnix/workflow.md) mô tả đúng hành vi mới: dò .harnix gần nhất, tên lệnh .exe qua PATH, digest chuẩn hóa EOL với rawInputDigest, verify-plan --path/--changed/--brief và gom .NET theo solution, các cờ workflow mới, secretAdvisory theo .gitignore, phát hiện package ngoài npm.
- [x] `ac-2` (met): pnpm run lint (ESLint và Prettier) exit 0 trên toàn repository, chỉ sửa định dạng và kiểu, không đổi hành vi.
- [x] `ac-3` (met): Toàn bộ test suite và typecheck pass sau thay đổi.
- [x] `ac-4` (met): Sửa các lỗi review xác nhận được, mỗi lỗi có test hồi quy: (1) tên lệnh trần resolve ra .cmd hoặc .bat trên PATH được chạy bằng đường dẫn tuyệt đối đã resolve (không để cmd.exe tìm trong thư mục làm việc), vẫn giữ tên trần khi đường dẫn có ký tự cmd đặc biệt; (2) verify-plan --changed trả không package nào khi git báo cây sạch, vẫn trả đủ khi không có git, và đọc git status bằng -z để đường dẫn có dấu cách khớp; (3) package có manifest riêng (ví dụ package.json) cùng thư mục với project .NET mà solution tham chiếu không bị loại; (4) file shell, bat, cmd, Makefile, Dockerfile không bị chuẩn hóa CRLF khi băm digest; (5) thư mục tên bắt đầu bằng hai dấu chấm như ..foo không bị coi là ngoài gốc.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-19 17:10:49 +07:00)
- [x] `chk-lint` (focused): Lint ESLint và Prettier phải exit 0 — pass (2026-10-19 17:09:36 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-19 17:09:41 +07:00)
- [x] `chk-fixes` (focused): Test hồi quy cho các lỗi do review phát hiện — pass (2026-10-19 17:09:45 +07:00)

## Decisions

- **dec-1** — Lỗi #4 của reviewer (cwd thoát gốc bị ghi lại) không sửa: normalizeRepositoryPath đã từ chối ".." và cwd= thừa qua saveWorkflow bị schema từ chối ngay lúc --init.
  - _Why:_ Đã đọc normalizeRepositoryPath (paths.ts) và quy tắc cwd của check; khẳng định của reviewer không đúng.
- **dec-2** — Chuẩn hóa CRLF khi băm digest bỏ qua file nhạy cảm với kết thúc dòng (.sh, .bash, .zsh, .ksh, .bat, .cmd, Makefile, Dockerfile) thay vì chuẩn hóa mọi file không chứa byte NUL.
  - _Why:_ CRLF làm hỏng shebang và Makefile nên nội dung hai dạng không tương đương; các file này vẫn băm theo byte thô.

## Residual risks

- **risk-1** (medium) — Dashboard Code impact trong review.md chỉ có hàm hiển thị: task-store.ts không truyền codeImpact nên mục này không bao giờ xuất hiện, trong khi AGENTS.md, HARNIX_WORKFLOW.md, skill harnix-verify và kịch bản runner mô tả nó như tính năng hoạt động. Chưa sửa trong task này.

## Evidence

- `chk-lint` — pass (2026-10-19 17:09:36 +07:00): pnpm lint — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-19 17:09:41 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-fixes` — pass (2026-10-19 17:09:45 +07:00): pnpm exec vitest run test/unit/utils/check-runner.test.ts test/unit/core/stack test/unit/core/verification — exit 0
- `check-suite` — pass (2026-10-19 17:10:49 +07:00): pnpm test — exit 0
