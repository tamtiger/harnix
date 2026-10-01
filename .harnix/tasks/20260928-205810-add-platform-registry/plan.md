# Kế hoạch: registry nền tảng

- [x] S1 RED/GREEN — xác minh sự thật nền tảng: tra nguồn chính thức cho event hook Antigravity và Claude Code đọc `AGENTS.md`; ghi `research/platform-facts.md`; ghi kết quả vào `facts` của registry (nguồn + ngày).
- [x] S2 RED/GREEN — `src/core/platform/registry.ts` + `types.ts`: bản ghi khai báo (id, cờ CLI, thư mục gốc, thư mục skill, file instruction tùy chọn, hook tùy chọn, facts). Test `test/unit/core/platform/registry.test.ts` và `facts.test.ts`, kèm nền tảng giả (không có instruction file, không hook, hai thư mục skill) để chứng minh `ac-registry`.
- [x] S3 — chuyển `PlatformId`, danh sách cờ trong `cli-program.ts`, `internal-context.ts`, `effective-context.ts`, `user-paths.ts`, `legacy-project-surfaces.ts` sang đọc từ registry; test hiện có giữ xanh.
- [x] S4 — tách `global-managed-files.ts` thành `src/core/global/{manifest,discovery,reconcile,rollback,types}.ts` (mỗi file ≤ 300 dòng code); giữ API công khai qua barrel; chạy `test/platform` sau khi tách.
- [x] S5 — gộp `managed-files.ts` (project) vào cùng hệ reconcile; một lớp ownership/obsolete dùng chung.
- [x] S6 — gộp `doctor.ts` và `global-doctor.ts`: logic chẩn đoán chuyển vào `src/core/doctor/`, lệnh chỉ còn wiring; bỏ `node:fs` trực tiếp trong command.
- [x] S7 — `setup`, `global-update`, `global-uninstall` dùng chung một bảng target từ registry; migrate bản cài cũ khi skill đổi tên (test fake home).
- [x] S8 — cập nhật contract Claude Code đọc `AGENTS.md` (nếu S1 xác nhận); sinh lại managed output bằng `harnix update`, không sửa tay.
- [x] S9 — gỡ 5 mục khỏi `PLATFORM_MODULES` trong `eslint.config.mjs` và `COMMANDS_WITH_DIRECT_FS` trong `test/workflow/architecture.test.ts`; `pnpm format`.
- [x] S10 — cập nhật `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, README, `docs/OVERHAUL_DECISIONS.md` nếu có quyết định mới.
- [x] S11 — chạy `check-suite` và các check tập trung; ghi evidence.

## Thứ tự TDD

Mỗi slice: viết test fail trước (RED), sửa tối thiểu (GREEN), refactor khi xanh. Slice thuần di chuyển (S4–S6) dùng test hiện có và golden `behavior-snapshot.golden.json` làm oracle, không sinh lại golden.

## Mỗi check chứng minh gì

- `check-registry`: bản ghi dữ liệu + nền tảng giả đủ cho mọi nhánh.
- `check-reconcile`: không mất nội dung người dùng, đổi tên skill được migrate.
- `check-layering`: lint (max-lines, layering) và architecture test xanh sau khi gỡ miễn trừ.
- `check-facts`: mỗi bản ghi có nguồn và ngày xác minh.
- `check-docs`: test workflow/doc parity xanh.
- `check-suite`: toàn bộ lint, typecheck, test.
