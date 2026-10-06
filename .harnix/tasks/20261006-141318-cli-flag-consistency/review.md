# Thống nhất cờ lặp/comma và lỗi cờ không hợp lệ của harnix workflow

- **ID:** 20261006-141318-cli-flag-consistency
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-06 14:13:30 +07:00
- **Updated:** 2026-10-06 14:37:14 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Mọi cờ nhận danh sách của harnix workflow chấp nhận cả dạng lặp cờ lẫn dạng phân tách bằng dấu phẩy, và cờ không áp dụng cho hành động đang chạy phải báo lỗi rõ thay vì bị bỏ qua; cookbook ghi cách đọc JSON an toàn trên Windows.

## Non-goals

- Không dùng cờ danh sách nào làm mất giá trị âm thầm

## Acceptance criteria

- `ac-1` (met): --criteria (và các cờ danh sách tương tự như --evidence-ids) nhận cả --criteria ac-1 --criteria ac-2 lẫn --criteria ac-1,ac-2 và cho cùng kết quả.
- `ac-2` (met): Cờ không áp dụng cho hành động đang chạy (ví dụ --follow-up cùng --set-check) báo lỗi nêu rõ cờ và hành động hợp lệ.
- `ac-3` (met): Cookbook trong workflow.md ghi mẫu đọc JSON an toàn trên Windows (gán bằng Out-String rồi ConvertFrom-Json, tránh pwsh -Command lồng nhau chờ stdin).
- `ac-4` (met): Đường ghi learning thủ công (--learn) có thể khám phá được: schema transports liệt kê nó cùng hình dạng stdin, và dùng sai cờ như --text trả lỗi chỉ rõ cách dùng đúng (hoặc có cờ --lesson --rationale không cần JSON), kèm điều kiện cần (task active ở verifying/finishing, có evidence).

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 14:36:47 +07:00)
- `check-flags` (focused): Test cờ danh sách lặp/comma và lỗi cờ sai hành động — pass (2026-10-06 14:35:34 +07:00)
- `check-docs` (focused): Cookbook workflow.md ghi mẫu đọc JSON an toàn trên Windows — pass (2026-10-06 14:35:37 +07:00)

## Decisions

- **lesson-epic-at-init** — Task tinh chỉnh thuộc cùng một mạch việc phải gắn epicId của epic có sẵn ngay lúc tạo (--init --epic <id> hoặc envelope epic); gắn hồi tố vào task đã completed không làm được an toàn, nên quên lúc tạo là mất liên kết.
  - _Why:_ Phiên VNPAY POS: 3 task liên tiếp rời rạc vì --follow-up không ghi quan hệ và epic 20260925-113000-vnpay-spos-integration có sẵn không được dùng.

## Evidence

- `check-flags` — pass (2026-10-06 14:35:34 +07:00): pnpm exec vitest run test/integration/commands/workflow-flags.test.ts test/unit/core/workflow/schema.test.ts test/unit/commands/workflow-command.test.ts — exit 0
- `check-docs` — pass (2026-10-06 14:35:37 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 14:36:47 +07:00): pnpm test — exit 0
