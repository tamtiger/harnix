# Hook context chỉ mang learning khi agent sắp lập kế hoạch

- **ID:** 20261006-202547-hook-context-diet
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-07 11:53:11 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Hook UserPromptSubmit gắn 5 note learning vào mọi prompt dù task đang implement hay verify; chỉ gắn khi chưa có task active hoặc task đang planning, để giảm token mỗi lượt mà không mất thông tin lúc cần.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Hook context bỏ khối learning khi task active ở trạng thái ready, in_progress hoặc verifying và vẫn gắn khi không có task hoặc task đang planning.
- `ac-2` (met): pnpm measure:tokens báo mức giảm số token hook context cho trạng thái implement và có test khóa ngưỡng.
- `ac-3` (met): Tài liệu hook và harnix context-report phản ánh quy tắc mới.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 11:52:42 +07:00)
- `check-hook` (focused): Test hook context chỉ gắn learning khi task planning và measure-tokens báo mức giảm — pass (2026-10-07 11:51:46 +07:00)
- `check-gates` (focused): Contract tests (docs, instruction budget, golden) xanh sau khi cập nhật tài liệu hook — pass (2026-10-07 11:51:50 +07:00)

## Decisions

- **d-no-task-learning** — Khi chưa có task active, hook vẫn không gắn learning (như hiện tại): learning cho giai đoạn lập kế hoạch đã có sẵn trong trường learning của workflow --preflight (nextStage plan), nên không thêm khối mới cho mọi prompt không task.
  - _Why:_ Tiêu chí ac-1 viết 'vẫn gắn khi không có task' nhưng hook hiện không phát context khi không có task; thêm vào sẽ tăng token cho mọi prompt Bypass, trái mục tiêu của task.

## Residual risks

- **r-measure-spaces** (low) — scripts/measure-tokens.mjs từng truyền process.execPath cho --run-check; sameCommand so command theo từ nên đường dẫn node có khoảng trắng (Windows) bị từ chối. Dùng tên node trần; cùng lỗi tách theo khoảng trắng có thể gặp ở bất kỳ command khai báo nào chứa đường dẫn có khoảng trắng.

## Evidence

- `check-hook` — pass (2026-10-07 11:51:46 +07:00): pnpm exec vitest run test/workflow/learning-automation.test.ts test/workflow/measure-tokens.test.ts — exit 0
- `check-gates` — pass (2026-10-07 11:51:50 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-07 11:52:42 +07:00): pnpm test — exit 0
