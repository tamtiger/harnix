## Checklist triển khai

- [ ] `S1` — Schema và validator cho `EpicRecord`
- [ ] `S2` — Field `epicId` trên `TaskRecordV2`
- [ ] `S3` — Persist epic + regenerate `.md` derived
- [ ] `S4` — Mở rộng `--save` envelope với `epic`
- [ ] `S5` — Command công khai `harnix roadmap`
- [ ] `S6` — Đồng bộ docs/frozen contract + version/changelog

## Thứ tự và phụ thuộc

S1 và S2 độc lập, có thể làm song song nhưng review tuần tự. S3 cần S1 xong
(dùng `EpicRecord`/`validateEpic`) và S2 xong (quét `epicId` trên task). S4
cần S3 (dùng `upsertEpic`/render). S5 cần S3+S4 (đọc cùng dữ liệu đã persist).
S6 làm sau cùng, sau khi hành vi đã ổn định, để docs mô tả đúng implementation
thật thay vì dự đoán.

## Chi tiết từng slice

### Slice `S1`

Thêm `src/core/roadmaps/roadmap.ts`: type `EpicRecord` (schemaVersion 1:
`generator`, `id`, `title`, `goal`, `nonGoals?`, `createdAt`, `updatedAt`) và
hàm `validateEpic(value: unknown): EpicRecord` dùng lại đúng kiểu
`assertExactKeys`/`isRecord`/`isIsoTimestamp`/`taskIdPattern`-style slug check
đã có trong `src/core/tasks/task.ts` (không copy logic tuỳ tiện — export và
tái dùng helper nếu không phá encapsulation hiện tại; nếu helper là private
trong module task.ts, nhân bản tối thiểu phần cần thiết với comment chỉ rõ
lý do). RED: viết test trước cho 3 case — record hợp lệ được accept, record
thiếu field bắt buộc bị reject, record có field lạ bị reject. GREEN: implement
tối thiểu để test pass.

Criteria: `epic-record-schema-and-validation`
Checks: `chk-roadmap-schema-unit`
Paths: `src/core/roadmaps/roadmap.ts`, `test/unit/roadmap.test.ts`

### Slice `S2`

Thêm entry `{ name: "epicId", required: false, sinceSchemaVersion: 2 }` vào
`TASK_RECORD_FIELDS` (`src/core/tasks/task.ts:75-...`) — việc này tự động mở
rộng cả `taskRecordV2Keys` (allowlist) lẫn `--schema` transport manifest vì
cả hai đọc từ cùng mảng này (xem comment dòng 70). Thêm validate format cho
`epicId` khi có mặt (string non-empty, dùng lại slug-safety check tương tự
`taskIdPattern`/`validId`, không bắt buộc đúng regex task ID — epic ID có
format riêng do S1 định nghĩa). RED trước: test v2 có `epicId` hợp lệ được
accept, test v1 có `epicId` bị reject (unknown field vì `taskRecordKeys` chỉ
lọc `sinceSchemaVersion === 1`), test v2 không có `epicId` vẫn hợp lệ không
đổi (regression). GREEN sau.

Criteria: `epicid-field-additive`
Checks: `chk-epicid-field-unit`
Paths: `src/core/tasks/task.ts`, `test/unit/task-state.test.ts`

### Slice `S3`

Thêm `upsertEpic(root, epic)` (atomic, permission-preserving write, theo
đúng pattern ghi file hiện có cho `task.json`) và `renderRoadmapMarkdown(root,
epicId)` trong `src/core/roadmaps/roadmap.ts`: quét `.harnix/tasks/*/task.json`,
lọc `epicId` khớp, sort theo task ID (tận dụng prefix `YYYYMMDD-HHMMSS` —
không cần field order riêng), sinh `.harnix/roadmaps/<epic-id>.md` với danh
sách task + status + đúng 1 dòng "next task" (non-terminal đầu tiên theo thứ
tự đó; nếu tất cả `completed`/`cancelled` thì ghi rõ "tất cả task đã hoàn
tất/huỷ", không để trống mập mờ). RED trước: test không có thành viên (epic
rỗng), test có 1 non-terminal ở giữa danh sách, test tất cả terminal. GREEN
sau.

Criteria: `roadmap-markdown-derived-view`
Checks: `chk-roadmap-render-unit`
Paths: `src/core/roadmaps/roadmap.ts`, `test/unit/roadmap.test.ts`

### Slice `S4`

Mở rộng handler `--save` trong `src/commands/internal-workflow.ts`: envelope
JSON nhận thêm field top-level tuỳ chọn `epic`. Khi có mặt → `validateEpic`
rồi `upsertEpic` rồi `renderRoadmapMarkdown`. Khi vắng mặt → hành vi hiện tại
với `task`/`artifacts`/`contractRevision` giữ nguyên hoàn toàn (không đổi
đường code hiện có, chỉ thêm nhánh mới). Sau khi lưu `task` thành công, nếu
`task.epicId` khớp một `.harnix/roadmaps/<epic-id>.json` đã tồn tại, gọi
`renderRoadmapMarkdown` cho epic đó dù envelope không có field `epic` (giữ
view luôn tươi mà không bắt agent phải nhớ gửi lại `epic` mỗi lần). RED
trước: test save có `epic` → file `.json`+`.md` xuất hiện đúng; test save
task có `epicId` khớp epic sẵn có → `.md` được refresh; test save không có
`epic`/`epicId` → hành vi/hộp trả về y hệt trước khi đổi (regression rõ
ràng, dùng snapshot/so sánh với hành vi hiện tại).

Criteria: `save-envelope-epic-upsert`, `roadmap-markdown-derived-view`, `regression-safe`
Checks: `chk-save-epic-envelope`, `chk-save-regression-no-epic`
Paths: `src/commands/internal-workflow.ts`, `test/workflow/internal-workflow-save.test.ts`

### Slice `S5`

Đăng ký command công khai `roadmap` trong `src/cli-program.ts`, theo đúng
pattern của `program.command("tasks")` (dòng 150-161): `--limit <count>`
(1-100, default hợp lý ví dụ 20, dùng lại `parseTaskLimit`-style parser nếu
áp dụng được, nếu không viết parser tương đương tối thiểu) và `--id <epic-id>`.
Không `--id`: liệt kê bounded các epic (đọc `.harnix/roadmaps/*.json`) kèm số
lượng task theo status. Có `--id`: chi tiết một epic; không khớp → emit
`PublicCliErrorV1` (dùng đúng helper redaction hiện có cho public command
khác) + exit 2. Cập nhật `test/workflow/cli-contract.test.ts:8` từ "fifteen"
lên "sixteen" và thêm `roadmap` vào tập command kỳ vọng — đây là điểm frozen
contract test đổi có chủ đích, không phải side effect. Thêm
`test/integration/roadmap.test.ts` mới theo mẫu `test/integration/tasks.test.ts`.

Criteria: `roadmap-public-command`
Checks: `chk-roadmap-command-integration`, `chk-cli-contract-count`
Paths: `src/cli-program.ts`, `test/integration/roadmap.test.ts`, `test/workflow/cli-contract.test.ts`

### Slice `S6`

Cập nhật `docs/HARNIX_PRD.md` §7 (đếm "mười lăm"→"mười sáu", thêm dòng lệnh
`harnix roadmap [--limit <1..100>] [--id <epic-id>]` vào khối lệnh, và câu mô
tả "Có mười lăm public commands" tương ứng); `docs/IMPLEMENTATION_PLAN.md` §4
(mục mới mô tả `epicId` trên `TaskRecordV2`, `EpicRecord` schema v1, envelope
`--save` mở rộng với `epic?`, coi các phần này là frozen kể từ đây);
`docs/HARNIX_WORKFLOW.md` (bảng artifact contract thêm hàng
`.harnix/roadmaps/<epic-id>.json` — task-owned qua save — và
`.harnix/roadmaps/<epic-id>.md` — derived, always-overwritten, cùng nhóm với
`review.md`). Cập nhật `CHANGELOG.md` với mục user-visible cho tính năng này
và chạy `pnpm version:sync` để bump patch version trong lúc implement (không
để tới finish). Chỉ làm slice này sau khi S1-S5 đã GREEN, để docs mô tả đúng
hành vi thật.

Sau khi docs đồng bộ, chạy gate rộng `chk-full-regression` (toàn bộ
test:unit + test:workflow + test:integration) làm bước đóng task, xác nhận
không có regression ở bất kỳ slice nào trước đó.

Criteria: `docs-and-frozen-contract-synced`
Checks: `chk-docs-parity`, `chk-full-regression`
Paths: `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/HARNIX_WORKFLOW.md`, `CHANGELOG.md`

<!-- harnix:execution-notes:begin -->
slice:S1=passed@2026-09-24T06:17:31Z
slice:S2=passed@2026-09-24T06:21:17Z
slice:S3=passed@2026-09-24T06:23:05Z
check:chk-roadmap-schema-unit=passed@2026-09-24T06:17:31Z
check:chk-epicid-field-unit=passed@2026-09-24T06:21:17Z
check:chk-roadmap-render-unit=passed@2026-09-24T06:23:05Z
<!-- harnix:execution-notes:end -->
