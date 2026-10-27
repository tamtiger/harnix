# workflow --schema một nguồn sự thật, bỏ --human

- **ID:** 20260916-230500-schema-single-source-and-drop-human
- **Mode:** full
- **Status:** completed/finishing

## Goal

workflow --schema không thể lệch khỏi validator thật; --human bị gỡ vì người dùng review task qua review.md, không qua CLI.

## Non-goals

- Không đổi hành vi review.md.
- Không đổi persisted schema hay hook protocol.

## Acceptance criteria

- `ac-schema-single-source` (met): workflow --schema derive taskRecord/nested từ export thật của task.ts, không còn literal riêng.
- `ac-human-removed` (met): --human không còn hợp lệ trên status/tasks/checks/audit; gọi nó trả exit 2 unknown option.
- `ac-release-readiness` (met): Patch version và changelog cập nhật một lần trước verifying; exact acceptance sequence pass.

## Decisions

- **d1-export-manifest** — Export một manifest field duy nhất từ task.ts thay vì hai list song song.
  - _Why:_ Bất kỳ field mới nào thêm vào TaskRecordV2 tự động phản ánh đúng ở --schema mà không cần nhớ sửa nơi thứ hai.
- **d2-remove-human-not-deprecate** — Xoá hẳn --human, không chỉ ẩn hoặc deprecate.
  - _Why:_ Người dùng xác nhận rõ ràng cách review là mở file .md; giữ code chết không dùng chỉ tăng bề mặt bảo trì.

## Evidence

- `focused-schema-source` — pass (2026-09-16T14:07:32.536Z): 51 test pass: workflow --schema derive taskRecord/nested trực tiếp từ taskRecordFieldManifest/acceptanceCriterionKeys/validationCheckV2Keys/evidenceV2Keys/blockerKeys export của task.ts. Verify thủ công: thêm field giả vào manifest mà không sửa internal-workflow.ts khiến --schema tự phản ánh field đó ngay, chứng minh không còn literal riêng để lệch.
- `focused-drop-human` — pass (2026-09-16T14:07:32.857Z): 9 test pass: --human bị gỡ khỏi status/tasks/checks/audit, human-report.ts và test của nó đã xoá, gọi --human trả exit 2 kèm 'unknown option', status/audit vẫn trả đúng JSON như trước.
- `release-gate` — pass (2026-09-16T14:07:33.166Z): Toàn bộ exact acceptance sequence exit 0: build, lint, typecheck, test:acceptance (588 pass, 1 skipped), pack:check, smoke:tarball, measure:init, measure:footprint, scan:release, git diff --check. AGENTS.md/README.md/IMPLEMENTATION_PLAN.md không còn nhắc --human.
