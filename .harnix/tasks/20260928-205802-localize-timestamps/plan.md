# Kế hoạch — Múi giờ cấu hình

## Checklist thực thi

- [x] CLOCK — module `src/utils/clock.ts` và test đơn vị
- [x] CONFIG — trường `timezone` trong config, mặc định lúc init, đặt cho repo này
- [x] WIRING — thay mọi `toISOString()`, journal theo ngày cục bộ, `clock` trong preflight
- [x] DISPLAY — `review.md` và trang epic theo múi giờ cấu hình
- [x] DOCS — docs, skill, template, `AGENTS.md`, `CHANGELOG.md`, sinh lại managed output
- [x] GATE — chạy bộ kiểm chứng đầy đủ và ghi evidence

## Chi tiết

### CLOCK

Làm: `formatInstant(ms, tz)` (ISO có offset, ví dụ `2026-09-28T20:30:01.000+07:00`), `localDate(instant, tz)`, `idPrefix(ms, tz)`, `formatDisplay(iso, tz)`, `systemTimezone()`, `isValidTimeZone(name)`. Dùng `Intl.DateTimeFormat`, không đọc biến `TZ`.
Kiểm chứng: `test/unit/clock.test.ts` (offset +07:00 và múi giờ có DST, quanh nửa đêm, tên sai, dữ liệu trộn `Z` và `+07:00` sắp xếp theo `Date.parse`).
Files: `src/utils/clock.ts`, `test/unit/clock.test.ts`.

### CONFIG

Làm: `timezone?: string` trong `HarnixConfigV2`, `createConfig` mặc định múi giờ hệ thống, validator từ chối tên không hợp lệ, config thiếu field vẫn đọc được, `.harnix/config.yaml` của repo đặt `Asia/Ho_Chi_Minh`.
Kiểm chứng: `test/unit/config.test.ts`.
Files: `src/core/config/config.ts`, `src/commands/init.ts`, `.harnix/config.yaml`, `test/unit/config.test.ts`.

### WIRING

Làm: `internal-workflow` lấy `now` theo múi giờ cấu hình khi không truyền; ngày journal = `localDate`; `file-lock` và core mặc định đi qua `clock.ts`; `preflight` thêm `clock`.
Kiểm chứng: `test/workflow/localized-time.test.ts` (timestamp ghi ra có offset cấu hình, journal đổi ngày quanh 00:00 giờ Việt Nam, task lịch sử dạng `Z` không bị ghi lại, preflight có `clock`, quét `src/` không còn `toISOString()` ngoài `clock.ts`).
Files: `src/commands/internal-workflow.ts`, `src/core/workflow.ts`, `src/core/tasks/task.ts`, `src/utils/file-lock.ts`, `test/workflow/localized-time.test.ts`.

### DISPLAY

Làm: `saveTask` và `renderRoadmapMarkdown` hiển thị `Created/Updated` và thời điểm evidence bằng `formatDisplay` theo múi giờ cấu hình.
Kiểm chứng: cùng `localized-time.test.ts` (dữ liệu `Z` hiển thị `+07:00`).
Files: `src/core/tasks/task.ts`, `src/core/roadmaps/roadmap.ts`.

### DOCS

Làm: cập nhật docs, skill (dùng `clock` từ preflight, bỏ `date` của shell), template, `AGENTS.md`, `CHANGELOG.md`; sinh lại `.harnix/workflow.md` bằng `harnix update`.
Kiểm chứng: `test/workflow/docs-task-contract.test.ts` mở rộng và các test skill/template/self-host.
Files: `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/HARNIX_PRD.md`, `src/skills`, `src/templates/harnix/workflow.ts`.

### GATE

Làm: chạy từng check tập trung rồi `pnpm lint && pnpm typecheck && pnpm test`, ghi evidence với digest trước/sau.
