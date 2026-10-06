# Thứ tự thực thi member của epic không phụ thuộc ID

- **ID:** 20261006-165804-epic-member-order
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 20:09:56 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Epic có thể khai báo thứ tự chạy rõ ràng để harnix epic gợi ý đúng task kế tiếp khi người dùng đổi ưu tiên, thay vì luôn theo ID tăng dần.

## Non-goals

- Không đổi ID của task đã tạo
- Không đổi hành vi của epic cũ không khai báo thứ tự

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): EpicRecord có field tùy chọn order (danh sách task ID) được validate: chỉ chứa id thuộc epic, không trùng; epic cũ không có field vẫn đọc bình thường.
- `ac-2` (met): harnix epic <id> chọn nextTask theo order trước, phần còn lại theo ID tăng dần, và file epic .md hiển thị đúng thứ tự đó.
- `ac-3` (met): Một lệnh hợp lệ (ví dụ harnix workflow --epic-order <epic-id> <task-ids>) cập nhật order mà không sửa task.json của task nào; có test.
- `ac-4` (met): Tài liệu hợp đồng đóng băng và epic reference mô tả order và quy tắc chọn task kế tiếp.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 20:09:54 +07:00)
- `check-epic-order` (focused): order của epic, thứ tự hiển thị và lệnh --epic-order — pass (2026-10-06 20:08:47 +07:00)
- `check-docs` (focused): Tài liệu mô tả order của epic — pass (2026-10-06 20:08:51 +07:00)

## Evidence

- `check-epic-order` — pass (2026-10-06 20:08:47 +07:00): pnpm exec vitest run test/unit/core/epics test/unit/core/workflow/epic-order.test.ts — exit 0
- `check-docs` — pass (2026-10-06 20:08:51 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 20:09:54 +07:00): pnpm test — exit 0
