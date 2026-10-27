# Kế hoạch: task-lineage-links

Thứ tự bắt buộc: RED (test thất bại đúng lý do) → GREEN (tối thiểu) → chạy test hẹp → tick `[x]`. Test dùng builder trong `test/support/builders.ts` và `workflow-fixtures.ts`, mỗi file test ≤ 400 dòng.

- [x] S1 Schema và validator (ac-5)
- [x] S2 `--init --epic` và `--follow-up` ghi `followUpOf` (ac-1, ac-2, ac-6)
- [x] S3 Cờ CLI `--epic` (ac-1)
- [x] S4 Hiển thị trong `review.md`, `harnix tasks`, `harnix status` (ac-3)
- [x] S5 Tài liệu và hợp đồng đóng băng (ac-4, ac-7)
- [x] S6 Golden, bump `2.2.0-dev.2`, CHANGELOG, format/lint/typecheck, đồng bộ `.harnix/workflow.md`

## S1 — Schema và validator

- RED: `test/unit/core/tasks/task-validate.test.ts` — v3 có `followUpOf` hợp lệ đi qua; ID sai regex, bằng `id` của chính task, kiểu không phải chuỗi đều bị `TaskValidationError`; v1/v2 có field này bị từ chối. `test/unit/core/workflow/schema.test.ts` — `taskRecord.optional` chứa `followUpOf`.
- GREEN: `src/core/tasks/task-schema.ts` (`TASK_RECORD_FIELDS` thêm `{ name: "followUpOf", required: false, sinceSchemaVersion: 3 }`, `TaskRecordV3.followUpOf?: string`); `task-validate.ts` kiểm tra cạnh `epicId` (dùng regex task ID có sẵn). `schema.ts` đọc từ cùng manifest nên tự có.
- Kiểm tra `assertExactKeys` theo `sinceSchemaVersion` để v1/v2 từ chối field.

## S2 — `--init --epic` / `--follow-up`

- RED: `test/unit/core/workflow/init-task.test.ts`
  - `--epic <id>` tạo task mang `epicId`, và `harnix epic` liệt kê task đó.
  - epic không tồn tại → lỗi, không tạo thư mục task, không đổi `.active`.
  - `--follow-up` ghi `followUpOf`, kế thừa `epicId` và `relevantPaths/Specs`; task gốc không có epic → task vẫn được tạo, không có `epicId`, stdout vẫn là JSON và stderr có đúng một dòng bắt đầu bằng `notice:`.
  - `--epic A` cùng `--follow-up` task thuộc epic B → lỗi nêu cả A và B; cùng epic → thành công.
  - task gốc v1/v2 vẫn dùng được làm `--follow-up`.
- GREEN: `src/core/workflow/init-task.ts` thêm `epic?: string`, kiểm tra bằng `loadEpicRecord`, ghi `followUpOf`, gọi `refreshLinkedEpicMarkdown` sau khi lưu (ac-6). Logic liên kết ở lại trong `init-task.ts` (103 dòng hiện tại, giới hạn 300 dòng code).

## S3 — Cờ CLI

- RED: `test/integration/commands/workflow-flags.test.ts` — `--epic` chỉ hợp lệ với `--init` (lỗi `--epic requires workflow --init.`); `--init --epic X` chạy end-to-end trong repo tạm; `--follow-up` còn báo lỗi khi dùng với hành động khác (đã có).
- GREEN: `workflow-command.ts` (`--epic <id>`), `workflow-flags.ts` (FLAG_OWNERS, `WorkflowFlags.epic`), `workflow-handlers.ts` (truyền `epic`), `schema.ts` mô tả `--init` có `--epic`.

## S4 — Hiển thị

- RED: `test/unit/core/tasks/task-review.test.ts` (dòng `- **Epic:**` và `- **Follow-up of:**` chỉ xuất hiện khi có), `test/unit/core/tasks/task-index.test.ts` (entry có khóa `epicId`/`followUpOf` chỉ khi có giá trị; task không liên kết cho output y hệt cũ).
- GREEN: `task-review.ts` `renderHeader`, `task-index.ts` (dòng ~137). `harnix status` không đổi (micro projection); golden không đổi phần này.

## S5 — Tài liệu và hợp đồng đóng băng

- Cập nhật `docs/IMPLEMENTATION_PLAN.md` (mục hợp đồng đóng băng: field mới, additive, v3 cũ vẫn hợp lệ, không cần migration), `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md` (epicId đã có 1 chỗ), `AGENTS.md`, `src/templates/harnix/workflow.md`, `src/skills/harnix-plan/references/epic.md`.
- Nội dung: dùng `--init --epic <id>` ngay từ đầu, `--follow-up` ghi `followUpOf`, lý do không gắn hồi tố hay reopen.
- RED/GREEN: thêm test parity vào `test/workflow/docs-task-contract.test.ts` (các tài liệu nhắc `followUpOf` và `--epic`).

## S6 — Hoàn tất

- `HARNIX_UPDATE_GOLDEN=1` chỉ khi diff golden gồm đúng phần `--schema` (field mới, mô tả `--init`); xem diff trước khi chấp nhận.
- `pnpm version:sync 2.2.0-dev.2 --summary ... --kind added` (script đã hỗ trợ tiền phát hành).
- `pnpm format`, `pnpm lint`, `pnpm typecheck`; đồng bộ `.harnix/workflow.md` và hash manifest (chuẩn hóa LF); `--run-check` cho `check-lineage`, `check-docs`, rồi `check-suite` cuối cùng.

## Rủi ro

- Thêm khóa vào output `tasks` là thay đổi additive của output công khai; test snapshot phải được rà soát.
- Notice trên stderr là kênh mới của `--init`; chỉ phát khi `--follow-up` gặp task gốc không có epic.
