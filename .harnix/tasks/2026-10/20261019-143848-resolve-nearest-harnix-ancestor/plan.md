# Implementation Plan: Dò gốc dự án theo .harnix gần nhất

## Hiện trạng đã đối chiếu với mã
- `findInitializedProject({ cwd })` (`src/utils/project-discovery.ts:19`) trả `ready | none | ambiguous | invalid`, dò lên ancestor gần nhất có `.harnix/config.yaml` hợp lệ, không dùng Git. `status`, `pause`, `resume`, `checks`, `audit`, `learning`, `repo-map`, `context-report` đã dùng nó.
- `resolveProjectRoot(cwd)` (`src/utils/paths.ts:66`) chỉ trả git root, không đọc `.harnix`. Đang được dùng ở `workflow-command.ts:127` (mọi action `workflow`), `cli-workflow-commands.ts:46` (mem), `:178` (skill), `:205` (doctor), `commands/verify-plan.ts:8` và `cli-project-commands.ts` (init, update, uninstall).
- Hệ quả: trong repo git con, `workflow --preflight` trỏ vào `<repo con>/.harnix` không tồn tại nên `realpath` ném ENOENT; `[PROJECT]` chỉ là cwd bị che bởi `redactPublicErrorMessage` (`cli-helpers.ts:131`).

## Hợp đồng (contract) cần giữ chính xác
- Không sửa `resolveProjectRoot` và không đổi các lệnh `init`, `update`, `uninstall`, `doctor`, `verify-plan` (xem dec-3 trong task).
- Thêm vào `src/utils/project-discovery.ts`:
  - `listInitializedChildren(cwd: string, limit = 10): Promise<string[]>`: đọc thư mục con cấp 1 của `cwd`, bỏ qua symlink, thư mục bắt đầu bằng `.` và `node_modules`, chỉ nhận thư mục có `.harnix/config.yaml` qua `resolveSafeHarnixPath`; trả tên tương đối, sắp theo `compareCodeUnits`, tối đa `limit`; lỗi đọc thư mục thì trả `[]`.
  - `requireInitializedProject(cwd: string): Promise<string>`: gọi `findInitializedProject({ cwd })`; `ready` thì trả `root`; `invalid` thì ném `The Harnix project state is invalid.`; còn lại ném `No initialized Harnix project found from the current directory.` kèm ` Initialized projects below this directory: a, b.` khi `listInitializedChildren` có kết quả, và ` Run the command from inside one of them.`
- Thông báo không chứa đường dẫn tuyệt đối, chỉ tên thư mục con tương đối (qua `redactPublicErrorMessage` vẫn an toàn).
- `status.ts:24` giữ nguyên chuỗi `Status requires an initialized Harnix project.` và chỉ nối thêm gợi ý thư mục con khi có.
- Chuyển `workflow-command.ts:127`, `cli-workflow-commands.ts:46` (mem) và `:178` (skill) sang `requireInitializedProject`. Riêng skill giữ `try/catch` hiện có (ngoài dự án thì bỏ qua).

## Execution Slices

### Slice 1 (RED): viết test thất bại trước
- [x] [chk-focus] Trong `test/unit/utils/project-discovery.test.ts` thêm: (a) `listInitializedChildren` trả đúng và có giới hạn, bỏ qua symlink, ẩn, `node_modules`; (b) `requireInitializedProject` trả root ancestor khi cwd là repo git con lồng; (c) lỗi `none` có gợi ý thư mục con ở gốc workspace không có `.harnix`; (d) lỗi `invalid` khi `.harnix` thoát qua symlink; (e) không ghi file nào (kiểm thư mục sau khi gọi).
- [x] [chk-focus] Trong `test/integration/commands/workflow-command.test.ts` thêm ca: chạy `workflow --preflight` với cwd là repo git con nằm dưới thư mục có `.harnix` thì trả JSON hợp lệ, không ENOENT; ở thư mục không có ancestor thì lỗi chứa `No initialized Harnix project`. Trong `status.test.ts` thêm ca thông báo kèm gợi ý thư mục con. Thêm ca hồi quy: `init` trong repo con vẫn dùng git root.

### Slice 2 (GREEN): mã nguồn
- [x] [chk-focus] Cài `listInitializedChildren` và `requireInitializedProject` trong `src/utils/project-discovery.ts`, giữ file dưới 300 dòng code.
- [x] [chk-focus] Chuyển ba nơi gọi sang `requireInitializedProject` và nối gợi ý vào `status.ts`; chạy lại test của Slice 1 cho xanh.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] Chạy `pnpm run test:gates`; cập nhật `docs/HARNIX_WORKFLOW.md` và `src/templates/harnix/workflow.md` (mô tả quy tắc nearest ancestor cho workflow) rồi `pnpm selfhost:sync`; `pnpm version:sync 2.12.0-dev.1 --summary <text> --kind fixed` và changelog.
- [x] [check-suite] Chạy toàn bộ `pnpm run test`, `pnpm run lint`, `pnpm run typecheck` một lần ở bước verify.

## Guardrails & Invariants
- Tương thích ngược: lệnh trong thư mục đã có `.harnix` ở git root hoạt động y như trước; `init`, `update`, `uninstall`, `doctor`, `verify-plan` không đổi.
- Không tự tạo state, không chạy `init`, không tự chọn repo con thay người dùng; gợi ý chỉ đọc.
- Hướng phụ thuộc: `project-discovery.ts` nằm ở `utils`, chỉ import `paths.js` và `order.js`; `commands` gọi vào, không ngược lại.
- Mỗi file trong `src/` dưới 300 dòng code, complexity dưới 20; không nới danh sách miễn trừ trong `eslint.config.mjs`.
- Test dùng thư mục tạm cô lập, không chạm home thật; test nằm ≤ 400 dòng, dựng dữ liệu qua `test/support/builders.ts`.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3, ac-5 | chk-focus | `pnpm exec vitest run test/unit/utils/project-discovery.test.ts test/integration/commands/workflow-command.test.ts test/integration/commands/status.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
