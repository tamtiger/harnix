# PRD — Tái cấu trúc code theo đúng tầng

## Kết quả và giá trị

Code đi đúng hướng phụ thuộc `commands -> core -> utils` của `AGENTS.md`, các module lớn nhất được tách theo trách nhiệm, và hành vi quan sát được không đổi. Nền này giúp `standardize-tests`, `add-verify-detection` và `add-platform-registry` sửa từng phần nhỏ thay vì các file gần 1.000 dòng.

## Phạm vi

Trong phạm vi:

- Logic workflow từ `src/commands/internal-workflow.ts` (1.048 dòng) chuyển vào `src/core/workflow/`, tách theo action: save, transition, evidence, schema, snapshot, preflight, finish, cancel, learn, cùng các phần dùng chung (bảo toàn nghĩa vụ, chuyển schema, artifact/rollback). `src/core/workflow.ts` (routing, hoàn tất, drift ngữ cảnh) vào cùng thư mục. `src/commands/internal-workflow.ts` chỉ còn adapter re-export.
- `src/core/tasks/task.ts` (1.024 dòng) tách thành schema (kiểu, hằng, manifest field), validate, migration (bằng chứng migrate), state (chuyển trạng thái), store (đọc/ghi, pointer active, artifact) và review (render `review.md`); `task.ts` còn là barrel re-export nên import hiện có không đổi.
- Các file trong `src/commands` không import `node:fs` (trừ `doctor.ts`, `global-doctor.ts`, `setup.ts`, `global-uninstall.ts` thuộc `add-platform-registry`): truy cập file chuyển xuống `core/utils`.
- `src/utils/detection.ts` và `src/utils/stack.ts` chuyển sang `src/core/stack/` vì là logic nghiệp vụ và import `catalog`.
- Hai hàm `canonicalJson` khác nghĩa: hàm trả object đổi tên thành `canonicalizeJson`, hàm trả chuỗi giữ `canonicalJson`.
- Test kiến trúc kiểm hướng import, giới hạn 300 dòng cho thư mục đã tách và danh sách miễn trừ; test snapshot hành vi so kết quả trước và sau (golden ghi trước khi refactor).
- Cập nhật danh sách miễn trừ trong `eslint.config.mjs` (gỡ các file đã tách, ghi lại owner mới cho phần còn lại) và docs.

Ngoài phạm vi: đổi hành vi, tách `global-managed-files.ts`, `doctor.ts`, `global-doctor.ts` (thuộc `add-platform-registry`), viết lại templates (thuộc `slim-instructions`), bump version, commit/push/PR.

## Quyết định đã chốt

- Barrel `task.ts` và adapter `commands/internal-workflow.ts` giữ nguyên tên export để không phải sửa hàng trăm import và test.
- Refactor thuần: golden snapshot được sinh từ code trước khi tách và không được sửa để cho test pass.
- Các file còn lớn nhưng không nằm trong tiêu chí (catalog, validation, config, guides catalog, file-lock, cli-program, setup...) vẫn nằm trong danh sách miễn trừ với owner mới được ghi rõ trong `eslint.config.mjs`; quyết định này được ghi vào `docs/OVERHAUL_DECISIONS.md`.

## Tiêu chí chấp nhận

### AC `ac-layering`

Không file nào trong `src/commands` import `node:fs`, trừ năm file thuộc `add-platform-registry` nằm trong danh sách miễn trừ; test kiến trúc kiểm hướng import `commands -> core -> utils` và `core` không import commander/inquirer/templates.

**Verifies:** `check-architecture`.

### AC `ac-split-workflow`

Logic workflow nằm trong `src/core/workflow/` tách theo action, mỗi file ≤ 300 dòng.

**Verifies:** `check-architecture`.

### AC `ac-split-task`

`task.ts` được tách thành schema/validate/migration/state/store/review, không còn trong danh sách miễn trừ.

**Verifies:** `check-architecture`.

### AC `ac-move-domain-utils`

Detection và stack chuyển sang `src/core/stack/`; `src/utils` không import `core`, `commands`, `catalog`, `guides`, `templates`.

**Verifies:** `check-architecture`.

### AC `ac-rename-duplicate`

Không còn hai hàm cùng tên `canonicalJson` khác nghĩa trong `src`.

**Verifies:** `check-architecture`.

### AC `ac-no-behavior-change`

Test snapshot xác nhận output các lệnh workflow/status/tasks/epic và file ghi ra giống hệt golden ghi trước refactor; toàn bộ suite pass.

**Verifies:** `check-behavior` và `check-suite`.

### AC `ac-docs-sync`

Docs (PRD/WORKFLOW/IMPLEMENTATION_PLAN, `AGENTS.md`, `CHANGELOG.md`) mô tả cấu trúc thư mục mới và danh sách miễn trừ.

**Verifies:** `check-docs-sync` và `check-suite`.
