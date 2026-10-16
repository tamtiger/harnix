# Kế hoạch triển khai (`Plan`): Áp dụng điều hướng mã nguồn cấp symbol và tra cứu tham chiếu từ Serena

## Checklist các lát cắt triển khai (`Slices`)

- [x] **Slice 1 (`ac-1`)**: Xây dựng mô-đun trích xuất khung symbol và giới hạn dòng `src/core/repo-map/outline.ts` kèm unit test `test/unit/core/repo-map/outline.test.ts`.
- [x] **Slice 2 (`ac-2`)**: Xây dựng mô-đun tra cứu tham chiếu symbol `src/core/repo-map/refs.ts` kết hợp đồ thị phụ thuộc `repo-map` kèm unit test `test/unit/core/repo-map/refs.test.ts`.
- [x] **Slice 3 (`ac-1`, `ac-2`, `ac-3`)**: Tích hợp dịch vụ `outlineRepoMap`, `refsRepoMap` vào `src/core/repo-map/service.ts`, nối dây CLI (`--outline`, `--refs`, `--symbol`, `--path`) trong `src/cli-helpers.ts`, `src/commands/repo-map-internal.ts`, `src/cli-workflow-commands.ts` và kiểm thử tích hợp `test/integration/commands/repo-map-internal.test.ts` + `test/workflow/cli-contract.test.ts`.
- [x] **Slice 4 (`ac-3`, `ac-4`)**: Cập nhật hướng dẫn điều hướng symbol-first trong `src/templates/harnix/workflow.md`, `src/skills/harnix-{plan,implement,research}/SKILL.md`, cập nhật provenance (`docs/HARNESS_FEATURE_PROVENANCE.json`, `test/workflow/provenance.test.ts`) cùng bộ tài liệu kiến trúc, đồng bộ `pnpm version:sync` & `pnpm selfhost:sync`, và xác nhận `pnpm run test:gates` + `pnpm run test`.

---

## Chi tiết từng Slice (RED -> GREEN -> REFACTOR)

### Slice 1: Trích xuất cấu trúc symbol cấp file (`ac-1`)
- **Files tạo mới / cập nhật:**
  - `src/core/repo-map/outline.ts`
  - `test/unit/core/repo-map/outline.test.ts`
- **Giao diện & Hợp đồng:**
  - Định nghĩa `RepoMapSymbolKind`, `RepoMapSymbolOutlineV1`, `RepoMapOutlineOptions`, `RepoMapOutlineResultV1`.
  - Hàm `extractFileSymbols(content: string, extension: string): RepoMapSymbolOutlineV1[]` xử lý:
    - Ngôn ngữ ngoặc nhọn (`ts`, `tsx`, `js`, `jsx`, `mjs`, `cjs`, `go`, `cs`, `java`, `php`): nhận diện khai báo `class`, `interface`, `function`, `type`, `enum`, `const`, `variable`, `struct`, `record`, `namespace` và `method` bên trong lớp/struct/interface ở độ sâu 1; xác định `endLine` bằng bộ đếm ngoặc nhọn `{...}` an toàn (bỏ qua chuỗi và chú thích) hoặc kết thúc câu lệnh `;`.
    - Ngôn ngữ thụt lề (`py`): nhận diện `class`, `def` / `async def` (cấp module là `function`, bên trong `class` là `method`) và tính `endLine` theo khối thụt lề.
    - Tài liệu Markdown (`md`, `mdx`): nhận diện `heading` (`#`..`######`) và tính `endLine` tới trước tiêu đề tiếp theo có cấp `<=` cấp hiện tại hoặc dòng cuối file.
  - Hàm `createRepoMapOutline(options: RepoMapOutlineOptions & { readonly root: string }): Promise<RepoMapOutlineResultV1>` kiểm tra đường dẫn qua `normalizeRepositoryPath`, xác thực file nằm trong phạm vi an toàn của repository (không thuộc thư mục bị loại trừ như `.git`, `node_modules`, `.harnix`, không thoát symlink ra ngoài root), kiểm tra giới hạn kích thước/nhị phân, áp dụng bộ lọc `symbol` và `limit` (`1..50`), và loại bỏ mọi dòng `signature` khớp mẫu `secretValue`.
- **RED -> GREEN:**
  - **RED:** Viết `test/unit/core/repo-map/outline.test.ts` kiểm tra trích xuất symbol và `startLine`–`endLine` cho TypeScript, Python, Go, C#, Markdown, lọc `--symbol`, cắt `truncated` theo `limit`, ẩn dòng chứa secret và xử lý `not-found` / `skipped` / đường dẫn không hợp lệ. Chạy `pnpm vitest run test/unit/core/repo-map/outline.test.ts` và quan sát lỗi RED.
  - **GREEN:** Triển khai `src/core/repo-map/outline.ts` để toàn bộ unit test trong `outline.test.ts` đạt GREEN.
- **Check chứng minh:** `check-outline` (`pnpm vitest run test/unit/core/repo-map/outline.test.ts`).

### Slice 2: Tra cứu tham chiếu symbol có giới hạn (`ac-2`)
- **Files tạo mới / cập nhật:**
  - `src/core/repo-map/refs.ts`
  - `test/unit/core/repo-map/refs.test.ts`
- **Giao diện & Hợp đồng:**
  - Định nghĩa `RepoMapRefKind` (`"declaration" | "import" | "reference"`), `RepoMapSymbolReferenceV1`, `RepoMapRefsOptions`, `RepoMapRefsResultV1`.
  - Hàm `findRepoMapReferences(map: RepoMapV1, options: RepoMapRefsOptions & { readonly root: string }): Promise<RepoMapRefsResultV1>`:
    - Kiểm tra `symbol` là định danh hợp lệ (`1..128` ký tự, khớp `/^[A-Za-z_$][\w$]*$/u`).
    - Nếu có `target` (`--path`), kiểm tra `target` là đường dẫn tương đối POSIX chuẩn hóa; nếu `target` không nằm trong `map.records`, trả về `status: "not-found"`. Nếu có, thu thập tập file ứng viên gồm chính `target`, các `dependents` của `target` (tối đa độ sâu 3 qua `buildRepoMapGraph(map.records)`) và các file test liên kết qua `findAffectedTests`.
    - Nếu không có `target`, tập ứng viên là các bản ghi trong `map.records` có `kind` thuộc `"source" | "test" | "script"` (ưu tiên các file có `identifiers` hoặc `importTargets` liên quan trước, sau đó quét theo thứ tự `path`).
    - Quét từng dòng với biểu thức chính quy biên từ `\b<symbol>\b`, phân loại `"import"` (dòng `import`/`from`/`require`/`using`), `"declaration"` (dòng khai báo `class`/`function`/`interface`/`type`/`const`/`def`/`func` của chính symbol đó) hoặc `"reference"` (các vị trí gọi/sử dụng khác).
    - Bỏ qua các dòng chứa `secretValue`, cắt gọn `preview` tối đa 160 ký tự và tôn trọng `limit` (`1..20`) kèm cờ `truncated`.
- **RED -> GREEN:**
  - **RED:** Viết `test/unit/core/repo-map/refs.test.ts` kiểm tra tra cứu tham chiếu toàn cục và tra cứu giới hạn theo `--path <target>`, phân loại `declaration`/`import`/`reference`, lọc secret, trạng thái `missing`/`invalid`/`not-found` và giới hạn `limit`. Chạy `pnpm vitest run test/unit/core/repo-map/refs.test.ts` để xác nhận RED.
  - **GREEN:** Triển khai `src/core/repo-map/refs.ts` để toàn bộ unit test trong `refs.test.ts` đạt GREEN.
- **Check chứng minh:** `check-refs` (`pnpm vitest run test/unit/core/repo-map/refs.test.ts`).

### Slice 3: Nối dây dịch vụ `service.ts` và giao diện CLI `harnix repo-map` (`ac-1`, `ac-2`, `ac-3`)
- **Files cập nhật:**
  - `src/core/repo-map/service.ts`
  - `src/commands/repo-map-internal.ts`
  - `src/cli-helpers.ts`
  - `src/cli-workflow-commands.ts`
  - `test/unit/core/repo-map/service.test.ts`
  - `test/unit/cli-helpers.test.ts`
  - `test/integration/commands/repo-map-internal.test.ts`
  - `test/workflow/cli-contract.test.ts`
- **Giao diện & Hợp đồng:**
  - Bổ sung `outlineRepoMap` và `refsRepoMap` vào `src/core/repo-map/service.ts`.
  - Bổ sung `outlineRepoMapInternal` và `refsRepoMapInternal` vào `src/commands/repo-map-internal.ts`.
  - Bổ sung `parseRepoMapOutlineLimit` (`1..50`), `parseRepoMapSymbol` (`1..128` ký tự) và mở rộng `parseRepoMapPath` cho `--outline` và `--path` trong `src/cli-helpers.ts`.
  - Đăng ký các tùy chọn `--outline <path>`, `--refs <symbol>`, `--symbol <name>`, `--path <path>` trên lệnh `repo-map` trong `src/cli-workflow-commands.ts` và kiểm tra tính loại trừ lẫn nhau giữa 6 hành động (`--query`, `--impact`, `--tests`, `--outline`, `--refs`, `--refresh`) cùng ràng buộc cờ phụ (`--symbol` chỉ đi với `--outline`, `--path` chỉ đi với `--refs`, `--depth` chỉ đi với `--impact`).
- **RED -> GREEN:**
  - **RED:** Bổ sung test cases vào `test/integration/commands/repo-map-internal.test.ts`, `test/unit/core/repo-map/service.test.ts`, `test/unit/cli-helpers.test.ts` và `test/workflow/cli-contract.test.ts`. Chạy test để xác nhận RED.
  - **GREEN:** Cập nhật `service.ts`, `repo-map-internal.ts`, `cli-helpers.ts`, `cli-workflow-commands.ts` để toàn bộ test đạt GREEN.
- **Check chứng minh:** `check-cli-repo-map` (`pnpm vitest run test/integration/commands/repo-map-internal.test.ts`).

### Slice 4: Cập nhật Skills, Workflow Template, Provenance, Tài liệu và Release (`ac-3`, `ac-4`)
- **Files cập nhật:**
  - `src/templates/harnix/workflow.md`
  - `src/skills/harnix-implement/SKILL.md`
  - `src/skills/harnix-plan/SKILL.md`
  - `src/skills/harnix-research/SKILL.md`
  - `docs/HARNESS_FEATURE_PROVENANCE.json`
  - `test/workflow/provenance.test.ts`
  - `docs/UPSTREAM_BASELINE.md`
  - `docs/UPSTREAM_MAPPING.md`
  - `docs/HARNESS_RESEARCH.md`
  - `docs/HARNIX_PRD.md`
  - `docs/HARNIX_WORKFLOW.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `AGENTS.md`
  - `README.md`
- **Chi tiết thực hiện:**
  - Cập nhật mô tả ngắn gọn cho `harnix repo-map --query|--impact|--tests|--outline|--refs` trong `src/templates/harnix/workflow.md` và hướng dẫn sử dụng `--outline <path>` (xem khung symbol + `startLine`–`endLine` trước khi đọc lát cắt file lớn) và `--refs <symbol>` (kiểm tra nơi sử dụng symbol trước khi sửa chữ ký/refactor) trong `harnix-plan`, `harnix-implement`, `harnix-research`.
  - Thêm feature `symbolic-code-navigation` vào `docs/HARNESS_FEATURE_PROVENANCE.json` và cập nhật `expectedFeatureIds` cùng kiểm tra phiên bản trong `test/workflow/provenance.test.ts`.
  - Cập nhật `docs/UPSTREAM_BASELINE.md`, `docs/UPSTREAM_MAPPING.md`, `docs/HARNESS_RESEARCH.md`, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `AGENTS.md`, `README.md`.
  - Chạy `pnpm version:sync 2.7.1 --summary "Bổ sung điều hướng symbol cấp file (repo-map --outline) và tra cứu tham chiếu symbol (repo-map --refs) thích nghi clean-room từ Serena" --kind added` và `pnpm selfhost:sync`.
- **Check chứng minh:** `check-gates` (`pnpm run test:gates`) và `check-suite` (`pnpm run test`).
