# PRD: Áp dụng điều hướng mã nguồn cấp symbol và tra cứu tham chiếu từ Serena vào Harnix

## 1. Bối cảnh và Mục tiêu (`Goal`)

Qua nghiên cứu đối chiếu repository `oraios/serena` (commit `d9e4c796fae0207ba6848d1df4b331122a5567b5`, ngày `2026-10-15`, giấy phép `GPL-3.0-or-later`), Serena chứng minh hiệu quả tiết kiệm token (60–80%) và tăng độ chính xác khi định vị code trên các codebase lớn nhờ 3 nguyên lý cốt lõi:
1. **Xem khung symbol của file kèm vị trí dòng (`get_symbols_overview` + `find_symbol`)** trước khi đọc nội dung hàm/lớp theo khoảng dòng (`startLine`–`endLine`), thay vì đọc nguyên file hàng trăm dòng.
2. **Tra cứu nơi tham chiếu symbol xuyên file (`find_referencing_symbols`)** trước khi sửa đổi chữ ký hàm/type hoặc refactor.
3. **Kỷ luật điều hướng symbol-first và progressive disclosure** trong hướng dẫn dành cho coding agent.

Hiện tại, `harnix repo-map` của Harnix mới lưu danh sách phẳng `identifiers: string[]` trong mỗi `RepoMapRecordV1` mà chưa cung cấp tọa độ dòng (`startLine`, `endLine`), phân loại symbol (`kind`, `exported`, `signature`) cho từng file hay công cụ tra cứu các vị trí tham chiếu của một symbol cụ thể trên đồ thị phụ thuộc đã cache.

Task này thực hiện **clean-room behavioral adaptation** toàn bộ các tính năng tương thích của `oraios/serena` vào Harnix mà vẫn giữ nguyên các ranh giới cốt lõi của Harnix: một gói npm duy nhất, không chạy LSP/daemon nền, không thêm default MCP server, không sửa đổi schema `RepoMapV1` (`schemaVersion: 1`) hiện hữu và bảo đảm an toàn đường dẫn/bí mật tuyệt đối.

## 2. Phạm vi ngoài mục tiêu (`Non-Goals`)

- **Không** tích hợp Language Server Protocol (LSP) daemon, tiến trình nền, JetBrains IDE plugin hoặc default MCP server.
- **Không** thêm công cụ CLI tự động sửa đổi mã nguồn theo symbol (`replace_symbol_body`, `insert_after_symbol`, `rename_symbol`) vì các nền tảng mục tiêu (Kiro, Antigravity, Codex, Claude Code, OpenCode, Cursor) đã có công cụ chỉnh sửa file nguyên bản.
- **Không** thêm giao diện thực thi mã REPL (Serena v2) hoặc hệ thống bộ nhớ toàn cục `~/.serena/memories/`.
- **Không** thêm các công cụ tự vấn rỗng (`think_about_*`) vì Harnix đã có các cổng kiểm chứng cứng (`ready`, `contextDrift`, `inputDigest`, `suite-gate`).
- **Không** thay đổi cấu trúc lưu trữ `.harnix/cache/repo-map-v1.json` (`RepoMapV1` giữ nguyên `schemaVersion: 1`, `extractorVersion: 1`).
- **Không** sao chép bất kỳ dòng mã nguồn Python hay văn bản hướng dẫn nào từ `oraios/serena` (giữ nguyên tính độc lập bản quyền).

## 3. Yêu cầu chi tiết và Tiêu chí nghiệm thu (`Acceptance Criteria`)

### `ac-1`: Trích xuất cấu trúc symbol cấp file (`harnix repo-map --outline <path>`)
- Cung cấp hàm `outlineRepoMap(options)` trong `src/core/repo-map/outline.ts` và tích hợp qua `src/core/repo-map/service.ts`.
- Đầu vào:
  - `root`: đường dẫn thư mục gốc dự án.
  - `target`: đường dẫn POSIX tương đối chuẩn hóa tới một file trong repository (từ chối đường dẫn chứa `\`, `..`, đường dẫn tuyệt đối hoặc symlink thoát khỏi root).
  - `symbol?: string`: bộ lọc tùy chọn (khớp không phân biệt hoa thường theo tên hoặc `container.name`, dài 1..128 ký tự).
  - `limit`: số lượng symbol tối đa trả về (`1..50`, mặc định `20`).
- Đầu ra `RepoMapOutlineResultV1`:
  ```ts
  export type RepoMapSymbolKind =
    | "class"
    | "interface"
    | "function"
    | "method"
    | "type"
    | "enum"
    | "const"
    | "variable"
    | "struct"
    | "record"
    | "namespace"
    | "heading";

  export interface RepoMapSymbolOutlineV1 {
    readonly name: string;
    readonly kind: RepoMapSymbolKind;
    readonly exported: boolean;
    readonly startLine: number;
    readonly endLine: number;
    readonly signature: string;
    readonly container?: string | undefined;
  }

  export interface RepoMapOutlineResultV1 {
    readonly generator: "harnix";
    readonly schemaVersion: 1;
    readonly scope: "project";
    readonly status: "ready" | "not-found" | "skipped";
    readonly target: string;
    readonly language?: string | undefined;
    readonly symbolFilter?: string | undefined;
    readonly limit: number;
    readonly symbols: readonly RepoMapSymbolOutlineV1[];
    readonly truncated: boolean;
  }
  ```
- Hỗ trợ trích xuất có thứ tự theo dòng xuất hiện (`startLine` tăng dần, sau đó theo `name`) cho các ngôn ngữ nguồn của Harnix (`typescript`, `javascript`, `python`, `go`, `csharp`, `java`, `php`) và tiêu đề Markdown (`heading`, tính `endLine` tới dòng trước tiêu đề cùng cấp/cấp cao hơn tiếp theo hoặc cuối file).
- Tính `endLine` xác định bằng bộ cân bằng ngoặc nhọn `{...}` (bỏ qua chuỗi và chú thích dòng) cho các ngôn ngữ khối ngoặc và độ thụt lề (indentation) cho Python.
- Tự động ẩn/bỏ qua mọi khai báo mà dòng `signature` chứa dấu hiệu nhạy cảm (`secretValue`) hoặc file nhị phân/vượt ngưỡng `maxBytesPerFile` (trả về `status: "skipped"`). File không tồn tại trong dự án hoặc nằm trong thư mục bị loại trừ trả về `status: "not-found"`.

### `ac-2`: Tra cứu tham chiếu symbol có giới hạn (`harnix repo-map --refs <symbol>`)
- Cung cấp hàm `refsRepoMap(options)` trong `src/core/repo-map/refs.ts` và tích hợp qua `src/core/repo-map/service.ts`.
- Đầu vào:
  - `root`: đường dẫn thư mục gốc dự án.
  - `symbol`: tên định danh symbol cần tìm tham chiếu (khớp ranh giới từ định danh hợp lệ, dài `1..128` ký tự, không chứa khoảng trắng hay ký tự điều khiển).
  - `target?: string`: đường dẫn POSIX tương đối tùy chọn (`--path <target>`). Khi được cung cấp, chỉ quét file `target` và các file phụ thuộc ngược (reverse-dependents tối đa độ sâu 3 trong đồ thị `buildRepoMapGraph(map.records)`) cùng các file test liên quan; nếu `target` không có trong cache trả về `status: "not-found"`. Khi không cung cấp `target`, quét trên các file nguồn/test/script hợp lệ trong cache `RepoMapV1`.
  - `limit`: số lượng kết quả tối đa (`1..20`, mặc định `20`).
- Đầu ra `RepoMapRefsResultV1`:
  ```ts
  export type RepoMapRefKind = "declaration" | "import" | "reference";

  export interface RepoMapSymbolReferenceV1 {
    readonly path: string;
    readonly line: number;
    readonly kind: RepoMapRefKind;
    readonly preview: string;
  }

  export interface RepoMapRefsResultV1 {
    readonly generator: "harnix";
    readonly schemaVersion: 1;
    readonly scope: "project";
    readonly status: "ready" | "missing" | "invalid" | "not-found";
    readonly symbol: string;
    readonly target?: string | undefined;
    readonly limit: number;
    readonly references: readonly RepoMapSymbolReferenceV1[];
    readonly truncated: boolean;
  }
  ```
- Phân loại chính xác dòng chứa symbol thành `"declaration"`, `"import"` hoặc `"reference"`.
- Trường `preview` được cắt gọn tối đa 160 ký tự, không bao giờ xuất dòng chứa `secretValue` hoặc đường dẫn tuyệt đối của máy.
- Sắp xếp kết quả xác định: ưu tiên file `target` (nếu có), sau đó theo thứ tự `compareCodeUnits(path)` và `line` tăng dần.

### `ac-3`: Tích hợp CLI và cập nhật hướng dẫn điều hướng symbol-first
- Mở rộng lệnh `harnix repo-map` trong `src/cli-workflow-commands.ts`, `src/cli-helpers.ts` và `src/commands/repo-map-internal.ts`:
  - Các cờ hành động loại trừ lẫn nhau (chọn đúng 1): `--query <text>`, `--impact <path>`, `--tests <path>`, `--outline <path>`, `--refs <symbol>`, `--refresh` (ẩn).
  - Các cờ bổ trợ:
    - `--symbol <name>`: chỉ hợp lệ khi đi kèm `--outline <path>`.
    - `--path <path>`: chỉ hợp lệ khi đi kèm `--refs <symbol>` để giới hạn phạm vi tìm tham chiếu theo đồ thị phụ thuộc của file `<path>`.
    - `--depth <count>`: chỉ hợp lệ khi đi kèm `--impact <path>`.
    - `--limit <count>`: hợp lệ cho `--query`, `--impact`, `--tests`, `--outline` (`1..50`, mặc định `20`) và `--refs` (`1..20`, mặc định `20`).
  - Mọi tổ hợp cờ không hợp lệ trả về mã thoát `2` với thông báo lỗi rõ ràng.
- Cập nhật hướng dẫn điều hướng symbol-first trong `src/templates/harnix/workflow.md`, `src/skills/harnix-implement/SKILL.md`, `src/skills/harnix-plan/SKILL.md`, `src/skills/harnix-research/SKILL.md` và chạy `pnpm selfhost:sync` để đồng bộ `.harnix/workflow.md` cùng `.harnix/.template-hashes.json`.
- Bảo đảm tất cả trần token trong `test/workflow/instruction-budget.test.ts` đều đạt.

### `ac-4`: Ghi nhận Provenance, Tài liệu và Release Patch
- Thêm mục `symbolic-code-navigation` vào `docs/HARNESS_FEATURE_PROVENANCE.json` (tham chiếu `oraios/serena`, commit `d9e4c796fae0207ba6848d1df4b331122a5567b5`, ngày `2026-10-15`, giấy phép `GPL-3.0-or-later`, quyết định `adapt`, mô tả rõ clean-room implementation không sao chép mã nguồn GPL) và cập nhật `expectedFeatureIds` trong `test/workflow/provenance.test.ts`.
- Cập nhật đồng bộ các tài liệu nguồn sự thật:
  - `docs/UPSTREAM_BASELINE.md` (mục khảo sát `oraios/serena`).
  - `docs/UPSTREAM_MAPPING.md` (bảng mapping các tính năng `adapt` và các tính năng `rejected` từ `oraios/serena`).
  - `docs/HARNESS_RESEARCH.md` (bổ sung dòng `Serena` vào ma trận capability và mục giải thích thiết kế điều hướng symbol).
  - `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `AGENTS.md`, `README.md`.
- Thực hiện nâng phiên bản patch (`2.7.1`) qua `pnpm version:sync` theo đúng chính sách phát hành của Harnix trước khi chuyển sang `verifying`.
