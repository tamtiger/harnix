# PRD: resolver vị trí task và epic

## Context & Problem Statement

`.harnix/tasks/` đang phẳng (252 thư mục) và hơn 40 chỗ trong `src` tự dựng chuỗi `tasks/${id}` hay `epics/${id}`. Muốn chia bucket tháng và kho `_archive` thì vị trí vật lý phải do một module duy nhất quyết định. Đặc tả: `.harnix/epics/20261027-102134-task-layout-bucket-archive/spec.md` (quyết định 1, 2, 3, 9).

## Scope & Boundaries

- Thêm `src/core/tasks/task-location.ts` và `src/core/epics/epic-location.ts`: dò theo thứ tự bucket tháng, bố cục cũ, `_archive`; ghi mới vào bucket tháng; liệt kê id qua mọi bố cục.
- Chuyển mọi nơi dựng đường dẫn sang resolver (store, workflow, doctor, journal, context, resume, epic).
- Giữ đường dẫn logic `.harnix/tasks/<id>/...` trong dữ liệu đã lưu; ngoại lệ digest khớp mọi bố cục.
- Ngoài phạm vi: `--archived`, giới hạn quét epic theo tháng, migration, lệnh archive (các task sau của epic).

## Anchored Acceptance Criteria

Bốn tiêu chí ac-1..ac-4 trong `task.json`; mỗi tiêu chí có check tập trung và check `chk-suite`.

## Architectural & Safety Constraints

Theo `AGENTS.md` và `.harnix/spec/guides/`: dependency một chiều, đường dẫn đi qua `resolveSafeProjectPath`, mỗi file nguồn không quá 300 dòng code, không regenerate golden. Không đổi schema TaskRecord/EpicRecord, ID hay enum. Task đang ở bố cục phẳng tiếp tục được ghi tại chỗ; chỉ task và epic mới vào bucket.
