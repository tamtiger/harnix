# Hook context chỉ mang learning khi agent sắp lập kế hoạch

- **ID:** 20261006-202547-hook-context-diet
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** planning/planning
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-06 20:25:42 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Goal

Hook UserPromptSubmit gắn 5 note learning vào mọi prompt dù task đang implement hay verify; chỉ gắn khi chưa có task active hoặc task đang planning, để giảm token mỗi lượt mà không mất thông tin lúc cần.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Acceptance criteria

- `ac-1` (pending): Hook context bỏ khối learning khi task active ở trạng thái ready, in_progress hoặc verifying và vẫn gắn khi không có task hoặc task đang planning.
- `ac-2` (pending): pnpm measure:tokens báo mức giảm số token hook context cho trạng thái implement và có test khóa ngưỡng.
- `ac-3` (pending): Tài liệu hook và harnix context-report phản ánh quy tắc mới.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
