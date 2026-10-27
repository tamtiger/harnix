# PRD — Roadmap epic tracking

## 1. Bối cảnh và vấn đề

Hiện tại mỗi task Harnix (`.harnix/tasks/<id>/task.json`) độc lập, không có cơ
chế nào nhóm nhiều task thuộc cùng một mục tiêu lớn (epic/nhiều phase). Khi
một công việc lớn phải chia thành nhiều task Harnix nối tiếp, không ai có cái
nhìn tổng thể "đã làm tới đâu, task nào tiếp theo" mà không tự đọc lại từng
`task.json`. Người dùng đã yêu cầu bổ sung khả năng roadmap theo hướng
code-backed (Option 2): có command CLI công khai và liên kết chính thức
trong schema task, thay vì chỉ là quy ước do agent tự nhớ.

## 2. Mục tiêu và giá trị người dùng

Cho phép liên kết một task với một "epic" qua field `epicId` tuỳ chọn, lưu
epic như một artifact project-local riêng (`.harnix/roadmaps/<epic-id>.json`
+ view Markdown regenerate `.harnix/roadmaps/<epic-id>.md`), và cho phép xem
tổng quan tiến độ epic qua command công khai `harnix roadmap` — giống hệt vai
trò `task.json` (nguồn) + `review.md` (view derived) đã có, áp dụng lại đúng
mẫu hình đó cho epic thay vì phát minh cơ chế mới.

## 3. Trong phạm vi / ngoài phạm vi

### 3.1 Trong phạm vi

- `epicId?: string` optional, chỉ áp dụng từ `TaskRecordV2` (`sinceSchemaVersion: 2`) — task v1 không được mang field này.
- `EpicRecord` schemaVersion 1: `{ generator: "harnix", schemaVersion: 1, id, title, goal, nonGoals?, createdAt, updatedAt }`. Epic **không** lưu danh sách task thành viên tường minh — thành viên được suy ra bằng cách quét `task.json` có `epicId` khớp, tránh hai nguồn sự thật lệch nhau.
- Hidden `harnix workflow --save` nhận thêm field tuỳ chọn `epic` trong envelope JSON; khi có mặt, upsert atomic `.harnix/roadmaps/<epic-id>.json` rồi regenerate `.harnix/roadmaps/<epic-id>.md`. Khi vắng mặt, hành vi `task`/`artifacts`/`contractRevision` giữ nguyên (backward compatible).
- Bất kỳ lần save task nào có `epicId` khớp một epic đã tồn tại cũng kích hoạt regenerate `.md` của epic đó, để danh sách/next-task luôn tươi.
- `.harnix/roadmaps/<epic-id>.md` liệt kê task thành viên theo thứ tự thời gian tạo (dùng chính thứ tự chuỗi của task ID có prefix `YYYYMMDD-HHMMSS`, không cần field order riêng), kèm `status` hiện tại của từng task, và một dòng "next task" (task không-terminal đầu tiên, hoặc trạng thái "tất cả đã terminal" nếu không còn).
- Command công khai mới `harnix roadmap [--limit <1..100>] [--id <epic-id>]`: không có `--id` → danh sách epic kèm số lượng task theo từng status; có `--id` → chi tiết một epic (khớp nội dung `.md`); `--id` không tồn tại → `PublicCliErrorV1` + exit 2.
- Cập nhật đồng thời `docs/HARNIX_PRD.md` §7 (đếm 15→16 command), `docs/IMPLEMENTATION_PLAN.md` §4 (frozen contract), `docs/HARNIX_WORKFLOW.md` (bảng artifact contract), và test đếm command cứng (`test/workflow/cli-contract.test.ts`).

### 3.2 Ngoài phạm vi (non-goals)

- Không có command chỉnh sửa thành viên epic trực tiếp ngoài field `epicId` trên task (tránh hai nguồn sự thật).
- Không tự động backfill `epicId` cho task lịch sử đã `completed`/`cancelled`.
- Không đổi cấu trúc `validationPlan`/`evidence` hay thêm severity structured cho Stage-2 review — đây là một task khác, đã bàn riêng trước đó.
- Không có roadmap cross-repo/global; chỉ project-local dưới `.harnix/roadmaps/`.
- Không migrate `TaskRecordV1` để mang `epicId` — chỉ v2 trở đi.

## 4. Acceptance Criteria

### AC `epicid-field-additive`

`TaskRecordBase`/`TASK_RECORD_FIELDS` có thêm entry `epicId` (`required: false`,
`sinceSchemaVersion: 2`). `validateTask` chấp nhận task v2 có hoặc không có
`epicId` (string an toàn, non-empty); task v1 mang `epicId` bị reject là
unknown field. Toàn bộ fixture task hiện có (không có `epicId`) vẫn hợp lệ
không đổi.

### AC `epic-record-schema-and-validation`

Có type `EpicRecord` (schemaVersion 1) và hàm `validateEpic` trong
`src/core/roadmaps/roadmap.ts`, dùng đúng kiểu allowlist nghiêm ngặt
(`assertExactKeys`) như `validateTask`: reject unknown field, reject thiếu
field bắt buộc, accept record hợp lệ.

### AC `save-envelope-epic-upsert`

Hidden `harnix workflow --save` chấp nhận field tuỳ chọn `epic` ở top-level
JSON envelope. Khi có mặt: validate qua `validateEpic`, ghi atomic
(permission-preserving) `.harnix/roadmaps/<epic-id>.json`. Khi vắng mặt:
hành vi save hiện tại (task/artifacts/contractRevision) không đổi — có test
regression xác nhận.

### AC `roadmap-markdown-derived-view`

Sau bất kỳ save nào tạo/cập nhật epic, hoặc save một task có `epicId` khớp
epic đã tồn tại, `.harnix/roadmaps/<epic-id>.md` được regenerate (derived,
luôn bị ghi đè — không bao giờ hand-edit), liệt kê task thành viên theo thứ
tự task-ID tăng dần, kèm `status` từng task, và đúng một dòng "next task"
(task không-terminal đầu tiên theo thứ tự đó, hoặc thông báo rõ khi tất cả đã
terminal).

### AC `roadmap-public-command`

Command công khai `harnix roadmap [--limit <1..100>] [--id <epic-id>]` luôn
emit đúng một JSON document. Không `--id`: danh sách epic bounded theo
`--limit`, kèm số lượng task thành viên theo từng status. Có `--id`: chi tiết
một epic, nội dung khớp với `.md` derived. `--id` không khớp epic nào: emit
`PublicCliErrorV1` đã redaction trên stdout, exit code 2.

### AC `docs-and-frozen-contract-synced`

`docs/HARNIX_PRD.md` §7 (đếm command, khối lệnh), `docs/IMPLEMENTATION_PLAN.md`
§4 (frozen field/schema/envelope mới), và `docs/HARNIX_WORKFLOW.md` (bảng
artifact contract) phản ánh đúng `epicId`, `EpicRecord`, envelope `epic` mở
rộng, và command `roadmap` trong cùng một thay đổi. `test/workflow/cli-contract.test.ts`
phản ánh đúng 16 command công khai bao gồm `roadmap`.

### AC `regression-safe`

Toàn bộ `test:unit`, `test:workflow`, `test:integration` hiện có (không liên
quan `epicId`/`epic`) pass không đổi hành vi.

## 5. Rủi ro và rollback

- Field `epicId` optional, additive — không cần migration cho task v2 cũ
  (absence vẫn hợp lệ). Task v1 không đổi.
- `.harnix/roadmaps/<epic-id>.md` derived, luôn regenerate — an toàn xoá/ghi
  đè, không cần preservation rule như task-owned file.
- `.harnix/roadmaps/<epic-id>.json` là artifact mới, task-owned qua save —
  rollback bằng cách xoá file nếu cần huỷ epic (không có trong scope task
  này — chỉ tạo/cập nhật, không xoá).
- Nếu `--audit-ready`/test phát hiện việc thêm field vỡ allowlist chỗ khác
  (ví dụ `--schema` transport, `doctor` snapshot dùng chung `TASK_RECORD_FIELDS`),
  phải rà lại toàn bộ nơi dùng field này trước khi đóng task.
