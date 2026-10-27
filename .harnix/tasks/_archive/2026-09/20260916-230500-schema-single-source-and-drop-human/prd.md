# PRD - workflow --schema một nguồn sự thật, bỏ --human

## Outcome

`workflow --schema` không thể lệch khỏi validator thật vì không còn danh sách field hardcode riêng; `--human` bị gỡ khỏi CLI vì cách người dùng review task là mở `review.md`, không phải gõ lệnh.

## Bối cảnh

Hai finding từ review trước chưa được sửa:

1. `workflowEnvelopeSchema()` hardcode `required`/`optional`/`nested` bằng string literal tách biệt khỏi `taskRecordKeys`/`taskRecordV2OnlyKeys` trong `task.ts`. Không test nào ràng buộc hai bên khớp nhau.
2. `--human` vẫn còn trên `status/tasks/checks/audit` dù người dùng đã nói rõ cách họ review là mở file `.md`, không chạy lệnh.

## In scope

- Export một manifest duy nhất (`TASK_RECORD_FIELDS`/`taskRecordFieldManifest`) trong `task.ts` mà cả `assertExactKeys` (validation) và `workflowEnvelopeSchema()` (`--schema`) cùng đọc.
- Export các key-set lồng nhau (`acceptanceCriterionKeys`, `validationCheckV2Keys`, `evidenceV2Keys`, `blockerKeys`) để `nested` trong schema derive từ đó thay vì literal.
- Xoá `--human` khỏi `status`, `tasks`, `checks`, `audit`; xoá `src/commands/human-report.ts` và test của nó; xoá mọi mô tả `--human` trong AGENTS.md/README/IMPLEMENTATION_PLAN.

## Out of scope

- Không đổi hành vi `review.md` (đã đúng ở task trước).
- Không đổi persisted schema hay hook protocol.

### AC `ac-schema-single-source`

`workflow --schema` trả `taskRecord` và `nested` derive trực tiếp từ export của `task.ts`; không còn string literal field-list nào trong `internal-workflow.ts`. Test xác nhận bằng deep-equal với chính export đó, và một field thử thêm vào manifest (không sửa `internal-workflow.ts`) tự động xuất hiện trong `--schema` output.

### AC `ac-human-removed`

`--human` không còn là option hợp lệ trên `status`, `tasks`, `checks`, `audit`; gọi với `--human` trả exit 2 với message chứa `unknown option`. Không còn file, export hay tài liệu nào nhắc `--human`/`human-report` ngoài chính test khẳng định nó bị từ chối.

### AC `ac-release-readiness`

Patch version và changelog cập nhật một lần trước `verifying`; exact acceptance sequence pass.
