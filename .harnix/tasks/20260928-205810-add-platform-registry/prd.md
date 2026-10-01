# [12] Registry nền tảng khai báo cho 4 nền tảng hiện có

## Vấn đề

Tên nền tảng (Kiro, Antigravity, Codex, Claude Code) xuất hiện trong khoảng 20 file `src`. Ba lệnh `setup`, `global-update`, `global-uninstall` mỗi lệnh tự dựng bảng nền tảng → thư mục gốc → target. Có hai hệ reconcile (`managed-files.ts` cho project, `global-managed-files.ts` 1.301 dòng cho global) và hai doctor (`doctor.ts`, `global-doctor.ts`) trùng một phần. Logic global nằm sai tầng (`src/utils`, `src/commands`) và đang nằm trong danh sách miễn trừ `max-lines`/layering của `eslint.config.mjs`. Hệ quả: thêm OpenCode và Cursor ở task kế tiếp sẽ phải sửa hàng chục chỗ.

## Mục tiêu

Một registry khai báo cho đúng 4 nền tảng hiện có, đủ biểu diễn các khác biệt mà OpenCode/Cursor sẽ cần (không có file instruction global, không có hook shell, nhiều thư mục skill đọc cùng lúc). Gộp reconcile và doctor, tách `global-managed-files.ts` theo mối quan tâm và chuyển vào `src/core`.

## Non-goals

- Không thêm nền tảng mới (OpenCode, Cursor thuộc task kế tiếp `add-opencode-cursor`).
- Không bump version; không commit/push/PR; không đụng cấu hình user-global thật trong test.
- Không đổi định dạng dữ liệu đã cài (sidecar manifest v1 vẫn đọc được).

## Tiêu chí chấp nhận

### ac-registry

Mọi nhánh theo nền tảng đi qua một registry; thêm một nền tảng chỉ cần một bản ghi dữ liệu và fixture test (chứng minh bằng nền tảng giả trong test, không phát hành).

**Verifies:** `check-registry`, `check-suite`.

### ac-reconcile

Global integration đã cài được reconcile không mất nội dung người dùng, kể cả khi skill đổi tên (fake home).

**Verifies:** `check-reconcile`, `check-suite`.

### ac-split-global-managed

`global-managed-files.ts` được tách theo mối quan tâm (discovery, reconcile, manifest, rollback); một hệ reconcile và một doctor dùng chung cho project/global; các file này rời danh sách miễn trừ `max-lines` và layering; logic chuyển từ `src/utils` và `src/commands` vào `src/core`.

**Verifies:** `check-layering`, `check-suite`.

### ac-unverified-facts

Tên event hook Antigravity (hiện là `PreInvocation`) và việc Claude Code đọc `AGENTS.md` native được xác minh bằng nguồn chính thức, hoặc ghi rõ giới hạn, trước khi đóng băng contract; mỗi bản ghi registry mang nguồn và ngày xác minh.

**Verifies:** `check-facts`, `check-suite`.

### ac-docs-sync

PRD, WORKFLOW, IMPLEMENTATION_PLAN, README và skill liên quan được cập nhật trong cùng task cho mọi contract đổi.

**Verifies:** `check-docs`, `check-suite`.

## Rủi ro và rollback

- Refactor lớn trên đường ghi file người dùng: giữ nguyên bộ test `test/platform` và `test/integration/scenarios/global-*` làm oracle, chạy sau từng slice.
- Đổi tên skill có thể bỏ sót bản cài cũ: có test fake home cho migration.
- Rollback: mỗi slice độc lập, hoàn tác bằng `git` do người dùng quyết định (không tự commit).
