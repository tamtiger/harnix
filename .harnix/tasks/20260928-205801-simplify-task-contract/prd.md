# PRD — Đơn giản hóa hợp đồng task và evidence (TaskRecord v3)

## Kết quả và giá trị

Thay bộ máy hợp đồng task hiện tại (TaskRecord v2, sidecar `verification-inputs.json`, `contractRevision` 5 bước, ready-trace grammar, execution-notes grammar) bằng một record gọn **TaskRecord schema v3**. Task mới không sinh sidecar, churn `.harnix` mỗi task giảm xuống ≤ 200 dòng, replan gọn còn một lần save có lý do, và dữ liệu v1/v2 cũ vẫn đọc được.

## Phạm vi

Trong phạm vi:

- Schema v3: check khai báo `criterionIds` + `inputs` (glob repo, không còn token `@task-contract`; hợp đồng task luôn được gộp ngầm vào digest); evidence mang `exitCode` và `inputDigest` nội tuyến.
- Digest tính lại tại chỗ từ inputs hiện hành, không lưu snapshot ra file; `workflow --snapshot --check <id>` vẫn trả digest để agent đối chiếu trước/sau khi chạy check.
- `contractRevision` một bước: một lần `--save` đặt checkpoint `replan` kèm `contractRevision.reason` và nghĩa vụ đã sửa; sau đó một `--save` ready/ready thông thường.
- Ready gate v3 cho Full chỉ đòi `prd.md` và `plan.md` không rỗng, `plan.md` có ít nhất một mục checklist; bỏ ready-trace grammar, bỏ `workflow --audit-ready`, bỏ execution-notes grammar.
- Task v1/v2 chưa hoàn tất chỉ được nâng lên v3 qua một lần save migration (bảo toàn tiêu chí, nghĩa vụ và evidence); task đã kết thúc chỉ đọc.
- Cập nhật PRD/WORKFLOW/IMPLEMENTATION_PLAN, README, skill, template `.harnix/workflow.md` và AGENTS.md cho mọi contract mà task này đổi.

Ngoài phạm vi: process runner hoặc harness tự chạy lệnh; tách module code (thuộc `restructure-code`); bump version (chỉ ở `release-v2`); commit/push/PR; đụng cấu hình user-global thật.

## Ràng buộc và quyết định đã chốt

- Chấp nhận phá frozen contract (D1) với điều kiện dữ liệu `.harnix/` cũ vẫn đọc được; task này tự cập nhật docs (D11).
- Chỉ dẫn task Lite giữ nguyên: không tạo `prd.md`/`plan.md`.
- Bằng chứng cũ của task v1/v2 sau migration không còn khớp digest v3 nên bị coi là stale và phải chạy lại (fail-closed, có ghi rõ trong docs).
- Chính task này khởi đầu ở v2 và tự migrate sang v3 giữa chừng để kiểm chứng đường migration; mã v2 chỉ bị gỡ sau khi việc migrate này hoàn tất.

## Tiêu chí chấp nhận

### AC `ac-schema`

Schema v3 được đóng băng trong docs và validator; `workflow --save` chấp nhận task v3 hợp lệ và từ chối task mới ở schema cũ; `workflow --schema` mô tả đúng v3.

**Verifies:** `check-contract-unit` và `check-save-flow`.

### AC `ac-no-sidecar`

Task mới không tạo `verification-inputs.json`; một vòng đời mẫu (planning → ready → evidence → finish) ghi ra tổng cộng ≤ 200 dòng dưới `.harnix/tasks/<id>/`.

**Verifies:** `check-contract-unit` (digest nội tuyến, không lưu snapshot) và `check-save-flow` (đo churn mẫu).

### AC `ac-replan-one-step`

Một lần `--save` đặt checkpoint `replan` cùng `contractRevision.reason` sửa được nghĩa vụ chưa được chứng minh; nghĩa vụ đã có pass vẫn bất biến; sau đó chỉ cần một `--save` ready/ready, không có bước audit riêng.

**Verifies:** `check-save-flow`.

### AC `ac-migrate-unfinished`

Task v1/v2 chưa hoàn tất nâng lên v3 bằng một lần save bảo toàn tiêu chí, nghĩa vụ bắt buộc và evidence; mọi save khác lên task v1/v2 chưa hoàn tất bị từ chối kèm hướng dẫn migrate.

**Verifies:** `check-save-flow`.

### AC `ac-legacy-read`

69 task lịch sử (v1 và v2) trong `.harnix/tasks/` vẫn được `validateTask` chấp nhận và được `status`, `tasks`, `roadmap` đọc bình thường.

**Verifies:** `check-legacy-read`.

### AC `ac-no-execution-notes`

Execution-notes grammar, ready-trace grammar và `--audit-ready` được gỡ khỏi validator, skill và docs; `plan.md` cũ có vùng execution-notes vẫn lưu và đọc được như văn bản tự do.

**Verifies:** `check-save-flow` (plan có marker cũ không bị từ chối) và `check-legacy-read`.

### AC `ac-docs-sync`

PRD/WORKFLOW/IMPLEMENTATION_PLAN, README, skill liên quan, template `.harnix/workflow.md` và AGENTS.md phản ánh đúng schema v3 trong cùng task; managed output được sinh lại bằng `harnix update`.

**Verifies:** `check-docs-sync` và `check-suite`.
