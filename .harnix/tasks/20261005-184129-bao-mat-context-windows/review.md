# Bảo mật hook context, learning và thực thi trên Windows

- **ID:** 20261005-184129-bao-mat-context-windows
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-10-05 18:41:25 +07:00
- **Updated:** 2026-10-05 18:41:25 +07:00

**Verdict:** PENDING — 0/7 acceptance criteria met

## Goal

Chặn prompt injection qua nội dung file, lách redaction, lộ đường dẫn tuyệt đối và các lỗi thực thi process trên Windows (R-012, R-014 đến R-017 và các mục P3 liên quan).

## Non-goals

- Không thêm network hay shell
- Không đổi giao thức hook

## Acceptance criteria

- `ac-1` (pending): `harnix verify-plan` không in đường dẫn tuyệt đối (bỏ `projectRoot` hoặc trả `.`), có test chặn tái diễn.
- `ac-2` (pending): Hook context vô hiệu hóa mọi marker trong nội dung file (`<<< ... >>>` và dòng `--- x ---`); nội dung repo không thể đóng khung untrusted sớm hay làm `splitEntries` cắt sai.
- `ac-3` (pending): Redaction learning chuẩn hóa NFKC, bỏ ký tự `\p{Cf}` và gộp whitespace trước khi phân tích, bắt câu tiếng Việt, lệnh nằm giữa câu, credential (`*_TOKEN=`, `ghp_`, `AKIA`, `xox*-`, khối `-----BEGIN`) và đường dẫn tuyệt đối; table test phủ đúng các chuỗi đã tái hiện.
- `ac-4` (pending): `harnix upgrade --apply` chạy được trên Windows qua cùng cơ chế `resolveInvocation` của check-runner; test inject `win32`.
- `ac-5` (pending): Check-runner: executable cũng bị kiểm metacharacter, đường dẫn `.cmd` có dấu cách chạy đúng, timeout kill cả cây tiến trình trên Windows (test với spawner giả).
- `ac-6` (pending): Redact lỗi bao phủ mọi đường dẫn POSIX tuyệt đối (vd. `/root/...`); `--cancel` và `--learn` stdin đi qua `assertTextIntegrity`.
- `ac-7` (pending): Cổng chất lượng xanh: `pnpm run typecheck`, `pnpm run lint` và `pnpm run test` (có coverage, không hạ ngưỡng) đều exit 0 trên cây mã cuối cùng của task.

## Required checks

- `check-security` (focused): Test context, learning, utils, lệnh — chưa chạy / not yet run
- `check-windows` (focused): Test check-runner và upgrade — chưa chạy / not yet run
- `check-typecheck` (full): pnpm run typecheck exit 0 — chưa chạy / not yet run
- `check-lint` (full): pnpm run lint (format:check + ESLint) exit 0 — chưa chạy / not yet run
- `check-suite` (full): pnpm run test (vitest + coverage) exit 0 — chưa chạy / not yet run

## Evidence

_None recorded yet._
