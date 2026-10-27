# Plan: Loại bỏ dual-write file phẳng và chuẩn hóa lưu trữ Epic thuần folder

## Execution Slices

### Slice 1: Loại bỏ ghi đúp file phẳng trong epic.ts (ac-1, ac-2)
- [x] [chk-epic-1] Sửa `upsertEpic` trong `src/core/epics/epic.ts` chỉ ghi ra `.harnix/epics/<id>/epic.json`. (ac-1)
- [x] [chk-epic-2] Sửa `renderEpicMarkdown` trong `src/core/epics/epic.ts` chỉ ghi ra `.harnix/epics/<id>/epic.md`. (ac-1)
- [x] [chk-epic-3] Kiểm tra cơ chế đọc fallback trong `resolveEpicFile` và `listEpicIds`. (ac-2)

### Slice 2: Bổ sung chỉ dẫn & Giao thức Handoff Multi-Agent (ac-4)
- [x] [chk-agent-1] Cập nhật `src/skills/harnix-plan/SKILL.md` dẫn hướng dẫn Multi-Agent Orchestration. (ac-4)
- [x] [chk-agent-2] Cập nhật `src/skills/harnix-research/references/scouting-isolation.md` bổ sung Mục 3: Multi-Agent Epic Task Handoff Protocol. (ac-4)

### Slice 3: Kiểm thử toàn diện & Cập nhật Behavior Snapshot (ac-3)
- [x] [check-epic-storage] Chạy kiểm tra unit test cho epic thuần folder không dual-write (`pnpm test:unit test/unit/core/epics`). (ac-1, ac-2, ac-3, ac-4)
- [x] [check-suite] Chạy toàn bộ test suite dự án (`pnpm run test`). (ac-3)
