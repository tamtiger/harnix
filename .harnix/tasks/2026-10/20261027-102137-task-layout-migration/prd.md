# PRD: migration bố cục task và epic sang bucket tháng

## Context & Problem Statement

Sau resolver, task và epic mới nằm ở bucket tháng nhưng 252 task và 32 epic cũ vẫn ở bố cục phẳng. Cần một migration idempotent đưa chúng sang bucket tháng mà không đổi nội dung. Đặc tả: `.harnix/epics/20261027-102134-task-layout-bucket-archive/spec.md` (quyết định 4).

## Scope & Boundaries

- Module `src/core/tasks/layout-migration.ts`: rename thư mục task `tasks/<id>` và thư mục epic `epics/<id>` sang `<YYYY-MM>/<id>`, dry-run, báo `skipped`.
- Nối vào `harnix update` (sau migration roadmaps) và qua đó vào `harnix doctor --fix`; `update --dry-run` chỉ liệt kê.
- `doctor` báo `task-layout-legacy` khi còn mục phẳng.
- Ngoài phạm vi: lệnh archive (task sau).

## Anchored Acceptance Criteria

Bốn tiêu chí ac-1..ac-4 trong `task.json`.

## Architectural & Safety Constraints

Theo `AGENTS.md` và `.harnix/spec/guides/`: dependency một chiều, đường dẫn qua resolver, rename nguyên tử từng thư mục dưới khóa workflow, không ghi đè đích, không sửa nội dung file, không tự commit. Chạy sau `migrateLegacyEpics`.
