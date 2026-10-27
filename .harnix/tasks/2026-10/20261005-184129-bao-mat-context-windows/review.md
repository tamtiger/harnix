# Bảo mật hook context, learning và thực thi trên Windows

- **ID:** 20261005-184129-bao-mat-context-windows
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 18:41:25 +07:00
- **Updated:** 2026-10-06 08:30:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Chặn prompt injection qua nội dung file, lách redaction, lộ đường dẫn tuyệt đối và các lỗi thực thi process trên Windows (R-012, R-014 đến R-017 và các mục P3 liên quan).

## Non-goals

- Không thêm network hay shell
- Không đổi giao thức hook

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): `harnix verify-plan` không in đường dẫn tuyệt đối (bỏ `projectRoot` hoặc trả `.`), có test chặn tái diễn.
- `ac-2` (met): Hook context vô hiệu hóa mọi marker trong nội dung file (`<<< ... >>>` và dòng `--- x ---`); nội dung repo không thể đóng khung untrusted sớm hay làm `splitEntries` cắt sai.
- `ac-3` (met): Redaction learning chuẩn hóa NFKC, bỏ ký tự `\p{Cf}` và gộp whitespace trước khi phân tích, bắt câu tiếng Việt, lệnh nằm giữa câu, credential (`*_TOKEN=`, `ghp_`, `AKIA`, `xox*-`, khối `-----BEGIN`) và đường dẫn tuyệt đối; table test phủ đúng các chuỗi đã tái hiện.
- `ac-4` (met): `harnix upgrade --apply` chạy được trên Windows qua cùng cơ chế `resolveInvocation` của check-runner; test inject `win32`.
- `ac-5` (met): Check-runner: executable cũng bị kiểm metacharacter, đường dẫn `.cmd` có dấu cách chạy đúng, timeout kill cả cây tiến trình trên Windows (test với spawner giả).
- `ac-6` (met): Redact lỗi bao phủ mọi đường dẫn POSIX tuyệt đối (vd. `/root/...`); `--cancel` và `--learn` stdin đi qua `assertTextIntegrity`.
- `ac-7` (met): Cổng chất lượng xanh: `pnpm run typecheck`, `pnpm run lint` và `pnpm run test` (có coverage, không hạ ngưỡng) đều exit 0 trên cây mã cuối cùng của task.

## Required checks

- `check-security` (focused): Test context, learning, utils, lệnh — pass (2026-10-06 08:28:18 +07:00)
- `check-windows` (focused): Test check-runner và upgrade — pass (2026-10-06 08:26:28 +07:00)
- `check-typecheck` (full): pnpm run typecheck exit 0 — pass (2026-10-06 08:28:23 +07:00)
- `check-lint` (full): pnpm run lint (format:check + ESLint) exit 0 — pass (2026-10-06 08:28:38 +07:00)
- `check-suite` (full): pnpm run test (vitest + coverage) exit 0 — pass (2026-10-06 08:29:26 +07:00)

## Decisions

- **d-redos-bounded** — Regex của learning-safety phải có cận trên hoặc neo cùng dòng; thêm test thời gian cho input gần giới hạn 64 KiB.
  - _Why:_ Security review phát hiện backtracking bậc hai ở CREDENTIAL và COMMAND_AT_STATEMENT_START.

## Evidence

- `check-windows` — pass (2026-10-06 08:26:28 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-security` — pass (2026-10-06 08:28:18 +07:00): pnpm — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-typecheck` — pass (2026-10-06 08:28:23 +07:00): pnpm — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-lint` — pass (2026-10-06 08:28:38 +07:00): pnpm — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-06 08:29:26 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
