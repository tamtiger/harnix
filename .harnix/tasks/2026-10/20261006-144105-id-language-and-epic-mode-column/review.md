# Chuẩn hóa ngôn ngữ ID/title và thêm cột mode vào danh sách member của epic

- **ID:** 20261006-144105-id-language-and-epic-mode-column
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 14:41:30 +07:00
- **Updated:** 2026-10-06 19:30:38 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Task ID và Epic ID luôn là slug tiếng Anh, còn title, goal và nội dung hướng người dùng là tiếng Việt có dấu; --init không còn sinh slug tiếng Việt từ title, và epic hiển thị mode (lite/full) của từng member.

## Non-goals

- Không đổi tên hay sửa task, epic đã tạo
- Không cố đoán ngôn ngữ của slug bằng từ điển

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): harnix workflow --init với title có ký tự tiếng Việt (có dấu) mà thiếu --slug báo lỗi nêu rõ phải truyền --slug <english-kebab-case>; --slug hợp lệ tạo ID đúng regex của task, còn title ASCII vẫn tự sinh slug như cũ.
- `ac-2` (met): harnix epic <epic-id> trả về mode của từng member, và file epic .md có cột Mode trong bảng Members; epic hiện có vẫn hiển thị bình thường.
- `ac-3` (met): AGENTS.md, workflow.md và skill harnix-plan (kể cả reference epic) ghi quy ước: ID của task và epic là tiếng Anh, title, goal, tiêu chí là tiếng Việt có dấu.
- `ac-4` (met): Epic hiện tại 20261006-141317-workflow-field-feedback được xem xét lại và bản ghi epic cập nhật những gì còn thiếu (mục tiêu, non-goals) qua đường lệnh hợp lệ.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 19:30:31 +07:00)
- `check-init-slug` (focused): --init --slug và lỗi khi title có dấu thiếu slug — pass (2026-10-06 19:29:17 +07:00)
- `check-epic-mode` (focused): Epic detail và file md hiển thị mode của member — pass (2026-10-06 19:29:21 +07:00)
- `check-docs` (focused): Quy ước ngôn ngữ ID/title trong tài liệu và bản ghi epic — pass (2026-10-06 19:29:26 +07:00)

## Decisions

- **slug-required-for-accents** — Title có ký tự ngoài ASCII bắt buộc --slug; không đoán ngôn ngữ slug bằng từ điển, chỉ kiểm định dạng.
  - _Why:_ Bỏ dấu tự động sinh ID tiếng Việt không dấu trái quy ước ID tiếng Anh.

## Evidence

- `check-init-slug` — pass (2026-10-06 19:29:17 +07:00): pnpm exec vitest run test/unit/core/workflow/init-task.test.ts test/integration/commands/workflow-flags.test.ts — exit 0
- `check-epic-mode` — pass (2026-10-06 19:29:21 +07:00): pnpm exec vitest run test/unit/core/epics/epic.test.ts — exit 0
- `check-docs` — pass (2026-10-06 19:29:26 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 19:30:31 +07:00): pnpm test — exit 0
