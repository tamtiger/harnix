# Ghi nhận quan hệ task nối tiếp và gắn epic ngay lúc init

- **ID:** 20261006-141319-task-lineage-links
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-06 14:13:30 +07:00
- **Updated:** 2026-10-06 16:27:09 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

--init có thể gắn task vào epic có sẵn (--epic <id>) và --follow-up ghi lại quan hệ nối tiếp bằng field tùy chọn của TaskRecord v3, hiển thị trong status/tasks/review.md, để chuỗi task tinh chỉnh không bị rời rạc.

## Non-goals

- Không cho gắn epic hồi tố vào task đã completed hoặc sửa task.json của task terminal
- Không thêm cơ chế reopen/amend task đã completed

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): harnix workflow --init --epic <epic-id> tạo task mang epicId đó và từ chối epic không tồn tại.
- `ac-2` (met): --follow-up <task-id> ghi field tùy chọn followUpOf vào task mới (additive, không đổi schemaVersion) và kế thừa epicId của task gốc; khi task gốc không có epic và không có --epic thì task vẫn được tạo và một dòng 'notice:' in ra stderr, stdout vẫn là JSON như cũ; task v3 cũ không có field vẫn đọc và validate bình thường.
- `ac-3` (met): review.md (dòng Epic và Follow-up of) và harnix tasks (khóa epicId, followUpOf) hiển thị liên kết khi có; harnix status giữ nguyên vì là micro projection; task không có liên kết cho output y hệt cũ.
- `ac-4` (met): Tài liệu workflow, skill harnix-plan và AGENTS.md mô tả --epic, followUpOf và lý do không hỗ trợ gắn hồi tố hay reopen.
- `ac-5` (met): Validator của TaskRecord v3 chỉ chấp nhận followUpOf là task ID đúng regex và khác id của chính task; giá trị sai bị từ chối với lỗi nêu rõ; schema v1/v2 không nhận field này.
- `ac-6` (met): Khi --init --epic hoặc --follow-up gắn task vào epic, file epic .md được sinh lại ngay và liệt kê task mới trong bảng Members; epic thiếu bản ghi JSON báo lỗi, không tạo task.
- `ac-7` (met): docs/HARNIX_PRD.md, docs/HARNIX_WORKFLOW.md và docs/IMPLEMENTATION_PLAN.md (mục hợp đồng đóng băng) mô tả followUpOf và --epic; test parity tài liệu kiểm chứng.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 16:26:21 +07:00)
- `check-lineage` (focused): Test schema, init, review, tasks và status cho epicId và followUpOf — pass (2026-10-06 16:24:56 +07:00)
- `check-docs` (focused): Tài liệu mô tả --epic, followUpOf và non-goals — pass (2026-10-06 16:25:00 +07:00)

## Decisions

- **followup-additive-field** — followUpOf là field tùy chọn additive của TaskRecord v3, không đổi schemaVersion; chỉ ghi lúc --init.
  - _Why:_ Tránh migration; task cũ vẫn hợp lệ và quan hệ được ghi ngay từ lúc tạo.

## Residual risks

- **tasks-output-additive-keys** (low) — Khóa epicId và followUpOf là bổ sung additive trong output của harnix tasks; công cụ đọc output cũ theo danh sách khóa cố định có thể gặp khóa mới ở task có liên kết.

## Evidence

- skipped (2026-10-06 14:53:15 +07:00): Task contract revised at persisted replan: Bổ sung các khoảng trống phát hiện khi rà soát kế hoạch: validator, làm mới epic.md và tài liệu hợp đồng đóng băng
- skipped (2026-10-06 14:53:15 +07:00): Task contract revised at persisted replan: Bổ sung các khoảng trống phát hiện khi rà soát kế hoạch: validator, làm mới epic.md và tài liệu hợp đồng đóng băng
- skipped (2026-10-06 14:53:16 +07:00): Task contract revised at persisted replan: Bổ sung các khoảng trống phát hiện khi rà soát kế hoạch: validator, làm mới epic.md và tài liệu hợp đồng đóng băng
- skipped (2026-10-06 14:59:18 +07:00): Task contract revised at persisted replan: Ready self-review: bỏ status khỏi phạm vi (micro projection dưới 80 token) và chốt cách báo task gốc không có epic
- `check-lineage` — pass (2026-10-06 16:24:56 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/core/tasks test/unit/core/status.test.ts test/unit/commands test/integration/commands — exit 0
- `check-docs` — pass (2026-10-06 16:25:00 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts test/workflow/skill-sources.test.ts — exit 0
- `check-suite` — pass (2026-10-06 16:26:21 +07:00): pnpm test — exit 0
