# Một lệnh chạy mọi check bắt buộc và tóm tắt kết quả

- **ID:** 20261006-202544-run-all-checks
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** planning/planning
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-06 20:25:42 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Agent không phải gọi --run-check lần lượt cho từng check: một lệnh chạy các check bắt buộc còn pending hoặc stale theo thứ tự (focused trước, suite cuối), ghi evidence như --run-check, dừng ở lần fail đầu và in tóm tắt rất ngắn.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Acceptance criteria

- `ac-1` (pending): harnix workflow --run-checks chạy tuần tự mọi required check còn pending hoặc stale bằng đúng command và cwd đã khai báo, focused trước và check suite sau cùng, ghi evidence như --run-check và dừng ở check đầu tiên fail.
- `ac-2` (pending): Output là một đối tượng ngắn chỉ gồm id, result, exitCode của từng check đã chạy và check còn lại; không in output của lệnh khi pass.
- `ac-3` (pending): Check đang ở circuit breaker stop hoặc không có command khiến lệnh dừng với lý do nêu rõ, không chạy gì.
- `ac-4` (pending): Cookbook và skill harnix-verify ghi lệnh này như đường chính ở giai đoạn verify.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
