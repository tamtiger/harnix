# Kế hoạch — Thống nhất tên epic

## Checklist thực thi

- [x] RENAME — đổi tên module, lệnh `epic`, envelope `epicMembers`, thư mục `.harnix/epics/`
- [x] RENDER — sửa 3 lỗi renderer trang epic kèm test snapshot
- [x] MIGRATE — chuyển dữ liệu `.harnix/roadmaps/` trong `update` và `doctor --fix`
- [x] DOCS — docs, skill, template, `AGENTS.md`, `CHANGELOG.md`, test tên gọi, chuyển dữ liệu repo này
- [x] GATE — chạy bộ kiểm chứng đầy đủ và ghi evidence

## Chi tiết

### RENAME

Làm: `git mv` `src/core/roadmaps/roadmap.ts` thành `src/core/epics/epic.ts` và `src/commands/roadmap.ts` thành `src/commands/epic.ts`; đổi mọi định danh; `harnix epic [epic-id]`; bỏ lệnh `roadmap`; envelope `epicMembers`; đọc/ghi `.harnix/epics/`, đọc lùi về `.harnix/roadmaps/` nếu chưa chuyển.
Kiểm chứng: test cli-contract, `test/unit/epic.test.ts`, `test/integration/epic.test.ts`, `test/workflow/internal-workflow-save.test.ts`.

### RENDER

Làm: dòng trống trước `## Members`, mục non-goals, mục next task; kết thúc bằng đúng một newline.
Kiểm chứng: snapshot trong `test/unit/epic.test.ts`.

### MIGRATE

Làm: `src/core/epics/migrate.ts` với `migrateLegacyEpics`, gọi từ `updateProject`.
Kiểm chứng: `test/migration/epics-migration.test.ts` (chuyển, idempotent, đọc trước khi chuyển, đích xung đột được giữ, doctor --fix).

### DOCS

Làm: cập nhật docs/skill/template/`AGENTS.md`/`CHANGELOG.md`, thêm `test/workflow/epic-naming.test.ts` (quét `roadmap` còn sót), chạy `harnix update` để chuyển dữ liệu repo và sinh lại managed output.

### GATE

Làm: chạy từng check tập trung rồi bộ đầy đủ, ghi evidence với digest trước và sau.
