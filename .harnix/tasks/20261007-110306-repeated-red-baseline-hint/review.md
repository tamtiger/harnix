# Nhắc đặt baseline khi suite đỏ lặp qua nhiều task

- **ID:** 20261007-110306-repeated-red-baseline-hint
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-07 11:03:06 +07:00
- **Updated:** 2026-10-07 14:36:47 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Khi cùng một suite đỏ sẵn qua nhiều task liên tiếp, preflight nhắc người dùng ủy quyền --set-baseline thay vì để agent tự đặt required false cho suite ở từng task.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): preflight ở giai đoạn implement và verify trả một gợi ý ngắn khi check suite cùng command có evidence fail ở ít nhất 2 task gần nhất (completed hoặc cancelled), chỉ đọc .harnix/tasks cục bộ, không mạng.
- `ac-2` (met): Gợi ý nêu đúng lệnh --set-baseline kèm --authorized-by user và nói rõ cần người dùng ủy quyền; Harnix không tự đặt baseline và không đổi cổng suite.
- `ac-3` (met): Không gợi ý khi baseline đã đặt cho check hiện tại; không tạo dữ liệu toàn cục ngoài .harnix/tasks; --brief giữ đúng một dòng; có test cho các nhánh.

## Required checks

- `check-1` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 14:36:21 +07:00)
- `check-hint` (focused): Test baselineHint: điều kiện xuất hiện, nội dung một dòng, không đặt baseline và tích hợp preflight — pass (2026-10-07 14:35:13 +07:00)
- `check-gates` (focused): Contract tests (schema, golden, docs, instruction budget) xanh sau khi thêm baselineHint vào preflight — pass (2026-10-07 14:35:18 +07:00)

## Decisions

- **d-per-task-baseline** — Baseline vẫn là dữ liệu của từng task; baselineHint chỉ nhắc xin ủy quyền, không tạo baseline cấp repo.
  - _Why:_ Baseline cấp repo cần lưu dữ liệu mới ngoài .harnix/tasks và đổi hợp đồng cổng suite; phạm vi task này là giảm việc lách thủ công.

## Evidence

- `check-hint` — pass (2026-10-07 14:35:13 +07:00): pnpm exec vitest run test/unit/core/workflow/baseline-hint.test.ts test/unit/core/workflow/preflight.test.ts — exit 0
- `check-gates` — pass (2026-10-07 14:35:18 +07:00): pnpm test:gates — exit 0
- `check-1` — pass (2026-10-07 14:36:21 +07:00): pnpm test — exit 0
