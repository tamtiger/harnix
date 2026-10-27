# PRD — Chuẩn định dạng và lint cho toàn repo

## Kết quả và giá trị

Repo có formatter thống nhất (Prettier, `printWidth` 120) và bộ lint chặt hơn (typescript-eslint `recommendedTypeChecked`, `max-lines` 300, `complexity`, `no-floating-promises`). Định dạng được thực hiện một lần, tách khỏi mọi thay đổi logic, để các task cấu trúc sau (`restructure-code`, `standardize-tests`) có nền sạch và diff dễ đọc.

## Phạm vi

Trong phạm vi:

- Thêm `prettier` và `eslint-config-prettier` làm devDependency (đã được người dùng cho phép cài); `.prettierrc.json` với `printWidth: 120`, `endOfLine: "auto"` để giữ nguyên kiểu xuống dòng từng file; `.prettierignore`.
- Format một lần toàn bộ `src`, `test`, `scripts` và các file cấu hình TypeScript/JS ở gốc; thay đổi này chỉ là định dạng.
- Script `format` và `format:check`; `lint` chạy `format:check` rồi `eslint`.
- ESLint: `recommendedTypeChecked` với `projectService`, `max-lines` 300 (bỏ qua dòng trống và comment), `complexity`, `@typescript-eslint/no-floating-promises`, tích hợp `eslint-config-prettier`. Vi phạm còn lại được ghi vào danh sách miễn trừ tạm thời trong `eslint.config.mjs`, mỗi nhóm ghi task chịu trách nhiệm gỡ (`restructure-code` cho file src lớn, `standardize-tests` cho file test lớn).
- Đồng bộ docs cho quy ước định dạng và script mới, cùng `CHANGELOG.md`.

Ngoài phạm vi: đổi hành vi, tách module (thuộc `restructure-code`), bump version, commit/push/PR. Vi phạm lint được sửa tại chỗ chỉ khi là sửa cơ học không đổi hành vi; phần còn lại vào danh sách miễn trừ.

## Quyết định đã chốt

- Cài package qua mạng đã được người dùng cho phép rõ ràng trong phiên này (2026-09-29).
- Commit tách hai bước: bước 1 chỉ chứa kết quả `prettier --write` cùng cấu hình; bước 2 chứa luật lint, danh sách miễn trừ và docs.

## Tiêu chí chấp nhận

### AC `ac-formatter`

Prettier và `eslint-config-prettier` được cấu hình; `pnpm format:check` pass trên toàn repo sau một lần format.

**Verifies:** `check-format`.

### AC `ac-lint-rules`

ESLint bật `recommendedTypeChecked`, `max-lines` 300, `complexity`, `no-floating-promises`; `pnpm lint` pass; mọi vi phạm còn lại nằm trong danh sách miễn trừ tạm thời có ghi task chịu trách nhiệm gỡ.

**Verifies:** `check-lint-rules`.

### AC `ac-format-only`

Bước format chỉ thay đổi định dạng: toàn bộ test pass không sửa assertion, typecheck sạch và output CLI giữ nguyên.

**Verifies:** `check-suite`.

### AC `ac-scripts`

`package.json` có `format` và `format:check`; `format:check` nằm trong lint gate.

**Verifies:** `check-format`.

### AC `ac-docs-sync`

Docs và `CHANGELOG.md` mô tả quy ước định dạng, script mới và danh sách miễn trừ.

**Verifies:** `check-docs-sync` và `check-suite`.
