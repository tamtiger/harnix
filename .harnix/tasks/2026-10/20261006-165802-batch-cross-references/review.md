# --batch và --set-check chấp nhận tham chiếu chéo trong cùng một lần gọi

- **ID:** 20261006-165802-batch-cross-references
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 19:47:00 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Tiêu chí và check được khai báo trong cùng một lệnh có thể tham chiếu nhau mà không phụ thuộc thứ tự, vì hiện tại --batch báo coverage incomplete hoặc unknown criterion khi tiêu chí trỏ tới check chưa tồn tại.

## Non-goals

- Không nới luật mỗi tiêu chí phải được một check bắt buộc phủ
- Không đổi luật bất biến sau ready

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): --batch áp dụng toàn bộ criteria và checks rồi mới validate coverage, nên criteria[].checks trỏ tới check định nghĩa trong cùng batch và checks[].criteria trỏ tới tiêu chí định nghĩa trong cùng batch đều hợp lệ.
- `ac-2` (met): Lỗi khi tham chiếu thực sự không tồn tại nêu rõ id thiếu và mọi vấn đề độc lập trong một lần báo.
- `ac-3` (met): --set-check nhận --criteria chứa tiêu chí vừa thêm trong cùng một --batch mà không cần hai lệnh theo thứ tự cố định; có test hồi quy cho đúng kịch bản Task digest đã gặp.
- `ac-4` (met): Tài liệu cookbook ghi rõ batch không phụ thuộc thứ tự.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 19:46:58 +07:00)
- `check-batch` (focused): Batch áp hết rồi validate, lỗi tham chiếu gộp — pass (2026-10-06 19:45:51 +07:00)
- `check-docs` (focused): Cookbook ghi batch không phụ thuộc thứ tự — pass (2026-10-06 19:45:55 +07:00)

## Evidence

- `check-batch` — pass (2026-10-06 19:45:51 +07:00): pnpm exec vitest run test/unit/core/workflow/batch.test.ts test/unit/core/workflow/batch-apply.test.ts — exit 0
- `check-docs` — pass (2026-10-06 19:45:55 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 19:46:58 +07:00): pnpm test — exit 0
