# PRD - File review.md cho mỗi task

## Outcome

Người dùng review một task Harnix bằng cách mở một file markdown thuần (`review.md`), không phải chạy CLI command.

## Bối cảnh và lý do đổi hướng

Lượt trước tôi thêm `--human` cho `status/tasks/checks/audit`. Người dùng phản hồi trực tiếp: cách họ review task là mở file `.md`, không phải gõ lệnh. `--human` giữ nguyên (đã test, không hại gì) nhưng không còn là đường review chính.

## Quyết định thiết kế

### D1 — File riêng, không chèn vào prd.md/plan.md

`prd.md`/`plan.md` của task Full **luôn** nằm trong input hash của mọi required check (`input-freshness.ts` dòng ~92-93, không điều kiện theo `inputs` của check). Nếu ghi `decisions`/`residualRisks` vào đó, mỗi lần thêm một quyết định hay rủi ro sau khi check đã pass sẽ làm digest đổi và evidence đang pass bị coi là stale — đúng thứ mà `ac-task-rationale` (task trước) cố tránh khi đặt hai field đó ngoài `taskContractHash`. File `review.md` độc lập, không nằm trong `inputs` mặc định của bất kỳ check nào, nên không có rủi ro này.

### D2 — Hook vào `saveTask`, không vào từng caller

`saveTask` trong `task.ts` là điểm ghi `task.json` duy nhất — mọi transport (`--save`, `--transition`, `--evidence`, `--finish`, `--cancel`) đều đi qua đây. Regenerate `review.md` ngay trong `saveTask` đảm bảo file luôn đồng bộ mà không cần sửa từng transport riêng lẻ.

### D3 — Luôn ghi đè, không phải managed-file có preserve/diff

`review.md` là derived-only, không bao giờ do người dùng sửa tay và giữ lại; không cần cơ chế reconcile/preserve như `AGENTS.md`.

## In scope

- `saveTask` ghi thêm `.harnix/tasks/<id>/review.md` cùng lúc với `task.json`.
- Nội dung: title, status/checkpoint, goal, non-goals, acceptance criteria (kèm status), decisions (nếu có), residual risks (nếu có), blocker/cancellation (nếu có), evidence.
- Tài liệu hoá `review.md` là artifact tham khảo, không phải obligation, không nằm trong input hash mặc định.

## Out of scope

- Không xoá hay thay đổi hành vi `--human`.
- Không chèn nội dung này vào `prd.md`/`plan.md`.
- Không thêm `review.md` vào managed-file reconciliation.

### AC `ac-review-md-generated`

Sau mỗi `saveTask` thành công, `.harnix/tasks/<id>/review.md` tồn tại và phản ánh đúng title, status/checkpoint, goal, non-goals, acceptance criteria (kèm status), evidence hiện tại của task; không lộ absolute path.

### AC `ac-review-md-rationale`

Khi task có `decisions`/`residualRisks`, `review.md` hiện đầy đủ text và rationale/severity; khi không có, các mục này bị bỏ qua thay vì hiện rỗng.

### AC `ac-review-md-no-hash-impact`

Thêm/sửa `decisions`/`residualRisks` giữa các lần save không làm đổi `taskContractHash` hay `inputDigest` của bất kỳ required check nào đã pass trước đó (kế thừa từ task trước, xác nhận lại vì `review.md` không được thêm vào input path nào).

### AC `ac-docs-sync`

PRD và IMPLEMENTATION_PLAN mô tả `review.md` là artifact tham khảo tự sinh, không phải obligation, không nằm trong verification input.

### AC `ac-release-readiness`

Patch version và changelog cập nhật một lần trước `verifying`; exact acceptance sequence pass.
