# Implementation Plan: repo-map --workspace dùng cache của workspace root và không tạo .harnix rác

## Hiện trạng đã đối chiếu với mã
- `src/core/repo-map/workspace.ts`: `discoverWorkspaceMembers(root)` trả `{ name, path, hasHarnix }` (con trực tiếp hoặc lồng hai cấp, bỏ `IGNORED_DIRS`); `queryWorkspaceRepoMap` đọc `readRepoMap(member.path)` và gắn `missing` khi ENOENT, `invalid` khi lỗi khác; kết quả được đổi đường dẫn thành `<member.name>/<res.path>`; `refreshWorkspaceRepoMap` gọi `refreshRepoMap({ root: member.path })` cho mọi member.
- `src/core/repo-map/store.ts`: `readRepoMap(root)`/`writeRepoMap(root, map)` qua `resolveSafeHarnixPath(root, "cache/repo-map-v1.json")`; `writeRepoMap` tạo thư mục. `RepoMapV1.records[].path` tính từ root của lần quét.
- `src/commands/repo-map-internal.ts`: `queryWorkspaceRepoMapInternal`, `refreshWorkspaceRepoMapInternal` gọi vào hai hàm trên qua `resolveWorkspaceRoot(cwd, wsPath)`.
- Test hiện có: `test/unit/core/repo-map/*`, `test/integration/commands/repo-map-internal.test.ts`.

## Hợp đồng (contract)
- `WorkspaceMemberResultSummary` thêm `source?: "member" | "workspace"` (có khi `status` là `ready`) và `hint?: string` (có khi `missing`: `Run "harnix repo-map --refresh" at the workspace root or inside this member.`); không đổi `name`, `records`, `status`.
- `queryWorkspaceRepoMap`: đọc cache root một lần (lỗi ENOENT thì coi là không có, lỗi khác thì `invalid` cho member cần nó); với mỗi member: thử cache riêng (nếu `hasHarnix`), nếu `missing` thì lọc cache root theo tiền tố `<member.name>/` (đường dẫn POSIX) thành `RepoMapV1` con (giữ nguyên `path`, giữ thứ tự đã sắp) và tìm kiếm; đường dẫn kết quả từ cache riêng vẫn là `<member>/<path>`, từ cache root giữ nguyên `path` (đã có tiền tố).
- `refreshWorkspaceRepoMap`: member `hasHarnix` (có `.harnix/config.yaml`) refresh như cũ; member chưa init: không ghi, đưa vào `skipped` với `Covered by the workspace root cache`/`Not initialized: run harnix init`; nếu root đã init thì refresh root một lần để phủ các member chưa init; nếu root chưa init và có member chưa init: trả lỗi rõ `workspace root is not initialized: run harnix init`, không ghi file.
- `hasHarnix` giữ nguyên (thư mục `.harnix` tồn tại) cho việc phát hiện member, vì `event-matrix.ts` dùng chung và test `workspace.test.ts:29` khẳng định nó; thêm trường mới `initialized: boolean` (có `.harnix/config.yaml`, kiểm bằng `resolveSafeHarnixPath` trong `discoverWorkspaceMembers`, hàm async) và dùng trường này cho query và refresh.
- Vị trí mã: lọc cache root theo tiền tố và logic refresh mới đặt ở file mới `src/core/repo-map/workspace-root-cache.ts` (`workspace.ts` đã ~205 dòng, sắp chạm 300).
- Cache root có 0 record dưới tiền tố member (ví dụ `.gitignore` của root loại member, vì quét dùng `gitignore: true`) thì coi member là `missing` kèm hint, không báo `ready` rỗng.
- `resolveWorkspaceRoot` trả về project đã init gần nhất: chạy trong member đã init thì member thành gốc; ghi vào tài liệu. Lỗi "workspace root is not initialized: run harnix init" là lỗi công khai exit 2. Workspace hỗn hợp refresh cả cache của member đã init lẫn cache root.
- Test `runCli` đặt ở file mới `test/integration/scenarios/repo-map-workspace.test.ts` (`repo-map-internal.test.ts` đã 389 dòng).

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/repo-map/workspace.test.ts` (mới hoặc mở rộng): workspace tạm có root đã `refresh`, hai member không `.harnix` → query trả `ready`/`source: "workspace"`, `records` theo tiền tố, đường dẫn `<member>/<path>` không lặp; member có cache riêng → `source: "member"` và không đọc root; không cache nào → `missing` kèm `hint`; cache root hỏng → `invalid`.
- [x] [chk-focus] Cùng file: `refreshWorkspaceRepoMap` trên workspace có member chưa init không tạo thư mục `.harnix` trong member đó (so snapshot cây thư mục), member đã init vẫn được refresh, root chưa init và có member chưa init thì lỗi rõ và không ghi; `test/integration/commands/repo-map-internal.test.ts`: chạy `repo-map --query x --workspace` qua `runCli` trả JSON có `source`.

### Slice 2 (GREEN)
- [x] [chk-focus] Cài logic trong `workspace.ts` (lọc tiền tố, đọc cache root một lần, `hasHarnix` theo `config.yaml`, refresh không ghi vào member chưa init); chạy lại test Slice 1 và toàn bộ `test/unit/core/repo-map`.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] `pnpm run test:gates`; cập nhật mô tả `--workspace` trong `docs/HARNIX_PRD.md` nếu có nhắc cache từng member; `pnpm version:sync 2.13.0-dev.2 --summary <text> --kind fixed` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Không đổi `repo-map-v1.json`; đầu ra chỉ thêm trường; mọi đường dẫn trong đầu ra là POSIX tương đối.
- Không tạo hay ghi `.harnix` ở nơi chưa có `.harnix/config.yaml`; không chạy `init`.
- Mỗi file trong `src/` dưới 300 dòng code, complexity dưới 20; test dưới 400 dòng; chỉ format file mình sửa.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e`.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-focus | `pnpm exec vitest run test/unit/core/repo-map test/integration/commands/repo-map-internal.test.ts test/integration/scenarios/repo-map-workspace.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
