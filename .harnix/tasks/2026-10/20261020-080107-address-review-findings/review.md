# Xử lý phát hiện của review độc lập trước khi commit

- **ID:** 20261020-080107-address-review-findings
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-20 08:01:07 +07:00
- **Updated:** 2026-10-20 08:54:35 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 1 | risk-1: low |

## Goal

Sửa các lỗi mã và bảo mật mà năm reviewer độc lập xác nhận, bổ sung test còn yếu và chỉnh các câu tài liệu sai hoặc cũ, rồi chạy lại lint, typecheck và toàn bộ test.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `docs`
- `src/commands`
- `src/core/stack`
- `src/core/verification`
- `src/core/workflow`
- `src/skills`
- `src/templates/harnix`
- `src/utils`
- `test`

## Acceptance criteria

- [x] `ac-1` (met): Các lỗi mã và bảo mật đã kiểm chứng được sửa, mỗi lỗi có test hồi quy: đường dẫn git status theo gốc .harnix, cmd.exe và taskkill chạy bằng đường dẫn tuyệt đối, shim có ký tự đặc biệt báo lỗi rõ, regex scheme của secret-scan có chặn, đường dẫn .sln tuyệt đối hoặc UNC bị bỏ, tên thư mục gợi ý được lọc, file nhạy cảm EOL đầy đủ hơn, PATH có dấu nháy, --path sai báo lỗi rõ, và nhận diện .NET dùng chung một predicate.
- [x] `ac-2` (met): Các test yếu hoặc thiếu mà review chỉ ra được sửa: kiểm evidence của --remove-criterion, test lệnh read-only có tiêu đề riêng và kiểm exit code, --changed ở mức CLI, test che đường dẫn bao cả dòng thay cwd, test git bền hơn, test hygiene độc lập cwd, và các test thiếu cho handler và check-runner.
- [x] `ac-3` (met): Tài liệu và CHANGELOG khớp mã: không còn khẳng định legacyInputDigest nằm trong đầu ra snapshot, mô tả đúng việc chạy trực tiếp .exe, tiêu đề mẫu PRD, danh sách cờ, wording về skill và status, và bullet CHANGELOG cho package ngoài npm.
- [x] `ac-4` (met): pnpm run lint, typecheck và toàn bộ test suite pass.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-20 08:54:27 +07:00)
- [x] `chk-lint` (focused): Lint ESLint và Prettier phải exit 0 — pass (2026-10-20 08:52:34 +07:00)
- [x] `chk-fixes` (focused): Test hồi quy cho lỗi mã, bảo mật và test bổ sung — pass (2026-10-20 08:53:18 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 08:53:22 +07:00)

## Decisions

- **dec-1** — Không sửa trường hợp tên lệnh trần không tìm thấy trên PATH vẫn đi qua cmd.exe; chỉ sửa cmd.exe và taskkill chạy bằng đường dẫn tuyệt đối và đổi lùi-về-tên-trần của shim có ký tự đặc biệt thành lỗi rõ.
  - _Why:_ Tên không tìm thấy có thể là lệnh dựng sẵn của cmd như echo; chặn hẳn sẽ phá lệnh hợp lệ, còn cmd.exe tuyệt đối đóng lỗ hổng gốc.
- **dec-2** — Không thêm --remove-decision và --remove-criterion vào activation.ts: ngân sách token của khối AGENTS bootstrap đã ở 1500/1500.
  - _Why:_ Hai cờ được mô tả đầy đủ trong template workflow.md, AGENTS.md, PRD, WORKFLOW và schema; thêm vào activation làm vượt ngân sách.

## Residual risks

- **risk-1** (low) — Chưa xử lý: tên lệnh trần không tìm thấy trên PATH vẫn đi qua cmd.exe, nơi cmd tự tìm trong thư mục làm việc trước; chỉ cmd.exe và taskkill được cố định bằng đường dẫn System32.

## Evidence

- `chk-lint` — pass (2026-10-20 08:52:34 +07:00): pnpm lint — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-fixes` — pass (2026-10-20 08:53:18 +07:00): pnpm exec vitest run test/unit test/integration — exit 0
- `chk-gates` — pass (2026-10-20 08:53:22 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-20 08:54:27 +07:00): pnpm test — exit 0
