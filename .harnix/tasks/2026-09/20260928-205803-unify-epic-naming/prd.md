# PRD — Thống nhất tên gọi epic

## Kết quả và giá trị

Một tên duy nhất "epic" ở mọi nơi: thư mục `.harnix/epics/`, lệnh `harnix epic`, trường envelope `epicMembers`, module `src/core/epics/epic.ts` và `src/commands/epic.ts`. Tên `roadmap` bị bỏ hẳn (breaking change ghi trong CHANGELOG). Dữ liệu cũ trong `.harnix/roadmaps/` vẫn đọc được trước khi chuyển và được chuyển tự động bởi `harnix update` / `harnix doctor --fix`. Ba lỗi của trang epic `.md` được sửa.

## Phạm vi

Trong phạm vi:

- Đổi tên module, hàm, kiểu, thông báo lỗi (`RoadmapValidationError` thành `EpicValidationError`, `renderRoadmapMarkdown` thành `renderEpicMarkdown`, ...).
- Lệnh `harnix epic [--limit <1..100>]` trả danh sách; `harnix epic <epic-id>` trả chi tiết và next task; id không tồn tại hoặc sai trả `PublicCliErrorV1` với exit code 2. Lệnh `roadmap` bị xóa.
- Envelope `workflow --save`: `roadmapMembers` đổi thành `epicMembers`; field `epic` và `epicId` giữ nguyên, `EpicRecord` không đổi schema.
- Di chuyển dữ liệu: `updateProject` (nên cả `doctor --fix`) chuyển `.harnix/roadmaps/<id>.json` sang `.harnix/epics/<id>.json`, sinh lại `.md`, xóa file cũ chỉ sau khi bản mới đã ghi đúng; idempotent; nếu đích đã tồn tại với nội dung khác thì giữ cả hai và không xóa. Trước khi chuyển, mọi lệnh đọc vẫn tìm ở thư mục cũ.
- Sửa renderer trang epic: dòng trống trước heading `## Members`; render `nonGoals`; thêm mục next task khớp với JSON; có test snapshot.
- Đồng bộ docs, skill, template, `AGENTS.md`, `CHANGELOG.md` (breaking) và chuyển dữ liệu epic của chính repo này.

Ngoài phạm vi: đổi `EpicRecord` schema, đổi `epicId` của task, bump version, commit/push/PR.

## Quyết định đã chốt

- Migration nằm trong `updateProject` để `doctor --fix` (vốn gọi `updateProject`) và `update` dùng chung một đường.
- Thư mục cũ chỉ bị xóa khi rỗng sau khi chuyển; file lạ trong đó được giữ nguyên.

## Tiêu chí chấp nhận

### AC `ac-rename`

Không còn tên `roadmap` trong `src`, CLI, skill, template và docs hiện hành (trừ ghi chú migrate/legacy và CHANGELOG).

**Verifies:** `check-naming-docs`.

### AC `ac-cli-epic`

`harnix epic` trả danh sách, `harnix epic <epic-id>` trả chi tiết kèm next task; id sai trả lỗi JSON exit 2; `cli-contract.test` được cập nhật.

**Verifies:** `check-epic-behavior`.

### AC `ac-migrate-epics`

`update` và `doctor --fix` chuyển `.harnix/roadmaps/*.json` sang `.harnix/epics/` không mất dữ liệu, idempotent; trước khi chuyển vẫn đọc được.

**Verifies:** `check-epic-migration`.

### AC `ac-epic-members`

Envelope hidden `--save` nhận `epicMembers`; skill và `workflow.md` dùng tên mới.

**Verifies:** `check-epic-behavior` và `check-naming-docs`.

### AC `ac-epic-render`

Trang epic `.md` có dòng trống trước heading, render `nonGoals` và next task; có test snapshot.

**Verifies:** `check-epic-behavior`.

### AC `ac-docs-sync`

PRD/WORKFLOW/IMPLEMENTATION_PLAN, README, skill, template, `AGENTS.md` và `CHANGELOG.md` phản ánh đúng thay đổi trong cùng task.

**Verifies:** `check-naming-docs` và `check-suite`.
