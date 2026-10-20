# Implementation Plan: Phát hiện bỏ qua thư mục worktree của công cụ và để harnix update làm mới config.yaml

## Hiện trạng đã đối chiếu với mã
- `src/core/stack/detection.ts:36`: `ignoredDirectoryNames` có `.agents .cache .claude .codex .gemini .git .harnix .kiro .next .pytest_cache .trellis .turbo .understand-anything __pycache__ node_modules vendor bin obj dist build coverage docs`, thiếu `.kilo`, `.worktrees`, `.cursor`, `.idea`, `.vs`, `out`.
- `src/core/repo-map/inventory.ts:~11`: `ignoredDirectoryNameList` có `.kilo` và `.worktrees`.
- `src/commands/init.ts:81-86`: `detectProject` rồi `packages: detection.packages.map(...)` chỉ khi init; init lần hai trả `already-initialized`.
- `src/commands/update.ts`: `desiredFiles(config)` dùng config có sẵn, không phát hiện lại; đã có `dryRun`.
- Đã chạy thử chỉ đọc trên payment-hub: config 1 package, `detectProject` 12 (gồm 2 worktree `.kilo`), `verify-plan --recursive` 9.

## Hợp đồng (contract)
- Module dữ liệu `src/core/stack/ignored-directories.ts` xuất `IGNORED_DIRECTORY_NAMES` (hợp của hai danh sách hiện có cộng `.cursor`, `.idea`, `.vs`, `out`, `.worktrees`, `.kilo`); `detection.ts` và `inventory.ts` đều dùng nó. Nếu một mục của một bên khác nghĩa (ví dụ `docs`, `vendor`, `bin`, `obj` chỉ có ý nghĩa với detection) thì giữ phần riêng của bên đó nhưng phần chung chỉ khai báo một lần.
- `mergeDetectedConfig(config, detection)` ở `src/core/config/refresh.ts`: thêm package (khóa theo `path`) chưa có, thêm language và technology chưa có (sắp xếp như `createConfig`), giữ nguyên mọi mục đã có; trả `{ config, added: { packages: string[], languages: string[], technologies: string[] } }`.
- `harnix update`: sau khi đọc config, gọi `detectProject`, hợp nhất, ghi nguyên tử nếu có thay đổi và không phải `--dry-run`, rồi reconcile managed files với config mới trong cùng lần chạy; kết quả thêm `configRefreshed: { added, dryRun }` (tối đa 20 đường dẫn package, kèm `+N more`). Lỗi phát hiện thì bỏ qua êm với `configRefreshed` rỗng, không làm `update` thất bại.
- Finding `config-packages-drift` của doctor (task doctor-config-packages-drift) ghi `harnix update` làm hướng xử lý.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/stack/detection.test.ts`: fixture có package thật và package trong `.kilo/worktrees/x`, `.worktrees/y`, `.cursor/z` chỉ cho ra package thật; test inventory vẫn bỏ qua cùng tập thư mục.
- [x] [chk-focus] `test/unit/core/config/refresh.test.ts` (mới): thêm package, language, technology thiếu; giữ nguyên mục đã có kể cả mục tự sửa; idempotent; config không có package nào thì thêm đủ.
- [x] [chk-focus] `test/integration/scenarios/update-refresh-config.test.ts` (mới): project init với config cũ chỉ 1 package; `update --dry-run` không ghi và báo mục sẽ thêm; `update` ghi đủ package, lần hai không đổi; config hỏng thì lỗi và không ghi; kết quả không có đường dẫn tuyệt đối; lỗi phát hiện không làm `update` thất bại.

### Slice 2 (GREEN)
- [x] [chk-focus] Viết `ignored-directories.ts`, `refresh.ts` và nối vào `update` (đặt phần xử lý ở file mới nếu `update.ts` gần 300 dòng); cập nhật hint của finding doctor `config-packages-drift` nếu task đó đã có; chạy lại test Slice 1 cùng toàn bộ `test/unit/core/stack`, `test/unit/commands/update.test.ts` và `test/unit/core/doctor`.

### Slice 3: cổng hợp đồng và phát hành (đóng epic)
- [x] [chk-gates] README và `docs/HARNIX_PRD.md` mô tả `update` làm mới config theo kiểu chỉ thêm (idempotent, `configRefreshed`, `--dry-run`, giới hạn mục bị xóa tay sẽ được thêm lại) và danh sách bỏ qua dùng chung; `pnpm run test:gates`; `pnpm selfhost:sync` nếu template đổi; `pnpm version:sync 2.14.0 --summary <text> --kind fixed --fold-dev` và changelog (task cuối theo ID đóng epic).
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify; bước thủ công ngoài check: `pnpm run lint`, `pnpm run typecheck` và chuỗi nghiệm thu mục 11 (build, pack:check, smoke:tarball, measure:init, measure:footprint, scan:release).

## Guardrails & Invariants
- Chỉ thêm, không bao giờ xóa hay sửa mục đã có; ghi nguyên tử giữ quyền; không network; `--dry-run` không ghi gì.
- Hướng phụ thuộc `commands -> core -> utils`; mỗi file trong `src/` dưới 300 dòng code; test dưới 400 dòng; chỉ format file mình sửa.
- Test filesystem dùng thư mục tạm và home dùng một lần; không chạm config.yaml của repo thật.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e` hay heredoc.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-focus | `pnpm exec vitest run test/unit/core/stack test/unit/commands/update.test.ts test/integration/scenarios/update-refresh-config.test.ts test/unit/core/doctor` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
