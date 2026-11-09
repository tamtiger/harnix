# Research: công cụ repo graph / code graph và tính năng cho `harnix repo-map`

- Epic: `20261109-194501-repo-map-insights`
- Ngày: 2026-11-09 (nguồn truy cập cùng ngày)
- Loại: standalone research (read-only), prompt gốc `docs/prompts/repo-graph-tools-research.md`
- Câu quyết định: 3–7 tính năng nào đáng đưa vào `harnix repo-map` đợt tới mà không vi phạm ràng buộc sản phẩm?
- Kết luận ban đầu (từ khảo sát công cụ): làm `--cycles`, `--hubs`, `--budget`, `--changed` (mục 4). **Đã được thay thế bởi mục 8** sau khi đối chiếu với session thật: các cờ `--cycles`, `--hubs`, `--budget` bị bỏ khỏi epic; ưu tiên là sửa `--tests`, `--query`, thêm `--body`, rút gọn output và `--changed`.

## 1. Công cụ đã khảo sát

| Công cụ | License | Sao (theo trang) | Trích xuất / lưu trữ | Đánh giá |
| --- | --- | --- | --- | --- |
| `colbymchenry/codegraph` | MIT | 77,2k | tree-sitter (kernel Rust), SQLite + FTS5, watcher | Có CLI `impact`, `affected`, `cycles`; cần daemon/watcher/telemetry nên chỉ lấy ý tưởng |
| `Graphify-Labs/graphify` (trước là `safishamsi/graphify`) | Apache-2.0 + MIT | 144,8k | tree-sitter không LLM cho code; Leiden/Louvain; `graph.json` | Giá trị ở "god nodes" và nhãn cạnh `EXTRACTED`/`INFERRED`; phần doc/media cần LLM, ngoài phạm vi |
| `tirth8205/code-review-graph` | MIT | 32,7k | tree-sitter, SQLite, hash SHA-256 theo file | Gần nhất với nhu cầu: blast radius, `detect_changes` |
| `abhigyanpatwari/GitNexus` | PolyForm Noncommercial | chưa xác minh | tree-sitter, LadybugDB | License cấm thương mại, cần graph DB; chỉ ý tưởng |
| Aider repo-map | chưa xác minh | chưa xác minh | tree-sitter tags, xếp hạng đồ thị, `--map-tokens` mặc định 1k | Ý tưởng vừa vặn ngân sách token |
| `oraios/serena` | GPL-3.0 (SolidLSP MIT) | 31,2k | LSP | Harnix đã adapt `--outline` và `--refs`; phần còn lại đã reject |
| `yamadashy/repomix` | MIT | 29,2k | tree-sitter `--compress` (experimental) | Ý tưởng `--token-budget`, `--token-count-tree` |
| `ast-grep/ast-grep` | MIT | 16,5k | tree-sitter, Rust | Truy vấn cấu trúc, không phải repo map |
| `sourcegraph/scip` | Apache-2.0 | 877 | protocol, cần indexer riêng mỗi ngôn ngữ | Loại |

Loại ở tầng screening: `vitali87/code-graph-rag` (chỉ xác minh qua trang tổng hợp; cần Memgraph, Docker, Python 3.12+), "CodeGraphContext" (không tìm thấy repo riêng), `tree-sitter-graph`, Joern, CodeQL (không khảo sát sâu).

## 2. Hiện trạng Harnix và baseline

Đọc từ mã: trích xuất bằng regex (`src/core/repo-map/extract.ts`, cs/go/java/js/ts/php/py); đồ thị import dựng trong bộ nhớ (`graph.ts`, tối đa 10.000 node, 100.000 cạnh); `search.ts` đã cộng điểm centrality; làm mới tái dùng record khi `contentHash` không đổi nhưng vẫn đọc mọi file; dependency runtime chỉ gồm `commander`, `globby`, `inquirer`, `minisearch`, `yaml`.

Baseline output (byte) đo trên repo này; hai lần query dùng từ khóa khác nhau nên không so trực tiếp:

| Lệnh | Byte |
| --- | --- |
| `--query repo-map` (JSON mặc định) | 17.037 |
| `--query impact --format compact` | 2.761 |
| `--impact service.ts` | 1.664 |
| `--outline service.ts` | 2.464 |
| `--refs buildRepoMapGraph` | 2.326 |
| `--tests graph.ts` | 1.089 |

Ma trận tính năng:

| Tính năng | codegraph | graphify | code-review-graph | GitNexus | Aider | Repomix | Harnix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Impact đa tầng | có | không | có (sâu 2, tối đa 500 node) | có | không | không | có |
| Test và code | có (`affected`) | không | có | không | không | không | có (`--tests`) |
| Thay đổi git sang vùng ảnh hưởng | có | không | có (`detect_changes`) | có | không | đưa diff vào output | chưa có |
| Phát hiện cycle | có (`cycles`) | không | không | không | không | không | chưa có |
| Hub / god nodes | không | có | không | không | có (ranking) | sắp theo tần suất git | một phần |
| Ngân sách token | không | không | `get_minimal_context` | "response budgets" | có | có (`--token-budget`) | một phần |
| Call graph bằng tree-sitter | có | có | có | có | không | không | chưa có |
| Dead code | không | không | không | không | không | không | chưa có |
| Cross-workspace | không | không | có | không | không | không | có |

## 3. Đã adopt hoặc reject (không đề xuất lại)

Theo `docs/HARNESS_RESEARCH.md`: đã có ranking phụ thuộc hai bước, `--impact`, `--tests`, `--outline`, `--refs`, `--events`, đa workspace. Đã reject: AST server, embedding/vector DB, persisted graph, SQLite, watcher/daemon, MCP server, LSP server, hook-time repo-map I/O, công cụ sửa symbol body.

## 4. Đề xuất xếp hạng

Điểm 1–5 theo năm cột (giá trị, phù hợp, chi phí, rủi ro, tính mới; 5 là tốt nhất), tối đa 25. Điểm và effort là suy luận của người research.

1. **`--changed`** (tổng 22, effort S–M): git đọc thay đổi, trả `changed`, `affected`, `tests`, `unindexed`, `truncated`. Tái dùng git read-only như `verify-plan --changed` và `src/core/tasks/code-impact.ts`. Không đụng schema cache. Refute `weakens`: impact dựa trên import nên bảo thủ; code-review-graph tự nhận false positive và F1 0,69 so với ground truth tự sinh.
2. **`--budget <tokens>`** (tổng 21, effort S): ước lượng `ceil(byte/4)`, cắt từ cuối theo thứ tự xếp hạng, thêm `estimatedTokens`, `budget`, `truncated`. Refute `supports`: code-review-graph thừa nhận ngữ cảnh đồ thị đôi khi lớn hơn đọc file nhỏ; codegraph thừa nhận ngữ cảnh tồn dư tăng khoảng 80%.
3. **`--cycles`** (tổng 21, effort S): thành phần liên thông mạnh trên đồ thị import sẵn có. Refute `weakens`: đồ thị regex có thể bỏ sót hoặc nhận nhầm cạnh nên kết quả chỉ là ứng viên.
4. **`--hubs`** (tổng 19, effort S): top-N file trung tâm, centrality đã có trong `search.ts`. Refute `unresolved`: chưa có bằng chứng định lượng rằng giảm token hơn `--query`.
5. **`--unused`** (tổng 16, effort M): export không có tham chiếu. Refute `weakens` mạnh: phân tích tĩnh bỏ sót dynamic dispatch, reflection, DI. Không đưa vào epic này.

Không đề xuất: call graph bằng tree-sitter. Giá trị cao (cả 4 công cụ lớn đều có) nhưng effort L: thêm dependency wasm, cần đo tarball và cài đặt Windows, có thể đổi `extractorVersion` (cần migration). Nếu muốn, chỉ làm spike đo đạc riêng.

## 5. Loại bỏ

| Thứ bị loại | Ràng buộc vi phạm |
| --- | --- |
| SQLite / graph DB (codegraph, GitNexus, code-graph-rag) | persisted graph, DB đã reject; cần dependency hoặc service ngoài |
| Watcher, daemon, `--watch` | cấm daemon và watcher |
| `telemetry`, cloud (codegraph, graphify) | cấm telemetry và hosted service |
| MCP server (codegraph, code-review-graph, GitNexus, Serena) | không MCP mặc định |
| LSP server (Serena) | tiến trình ngoài; đã reject ở mục 3.13 của `HARNESS_RESEARCH.md` |
| Embedding và semantic search | vector/embedding đã reject |
| Rename và sửa symbol body (Serena, GitNexus) | Harnix chỉ đọc |
| Hook gọi repo-map; `suggestedTechniques` | hook cấm repo-map I/O; `suggestedTechniques` không liên quan code graph |
| Mã GitNexus (PolyForm Noncommercial), Serena (GPL-3.0) | license; chỉ học ý tưởng, clean-room |
| SCIP | cần indexer riêng cho mỗi ngôn ngữ |

## 6. Câu hỏi mở đã chốt cho epic

1. Spike tree-sitter: không làm trong epic này.
2. `--changed` được gọi git read-only: có (tiền lệ `verify-plan --changed`).
3. Ước lượng token: heuristic `byte/4`, ghi rõ trong output.

Thứ tự member: `--cycles` + `--hubs` (gộp), `--budget`, `--changed` (đóng epic bằng `2.31.0`).

## 7. Nguồn và độ tin cậy

Xác minh từ README chính thức (truy cập 2026-11-09, qua WebFetch; chưa lấy được commit SHA vì không có API):
[colbymchenry/codegraph](https://github.com/colbymchenry/codegraph), [Graphify-Labs/graphify](https://github.com/safishamsi/graphify) (redirect từ `safishamsi`), [tirth8205/code-review-graph](https://github.com/tirth8205/code-review-graph), [GitNexus README](https://cdn.jsdelivr.net/gh/abhigyanpatwari/GitNexus@main/README.md), [oraios/serena](https://github.com/oraios/serena), [yamadashy/repomix](https://github.com/yamadashy/repomix), [ast-grep](https://github.com/ast-grep/ast-grep), [sourcegraph/scip](https://github.com/sourcegraph/scip), [Aider repomap](https://aider.chat/docs/repomap.html), [bài viết Aider 2023-10-22](https://aider.chat/2023/10/22/repomap.html).

Xác minh từ mã Harnix: `src/core/repo-map/*`, `package.json`, `docs/HARNESS_RESEARCH.md`.

Số liệu tự công bố, chưa tái tạo: giảm 62% token của codegraph; 6,65x và 63x của code-review-graph (63x dùng baseline đọc cả repo nên không so trực tiếp được). Sao và license lấy từ trang render, chưa kiểm chéo.

Chưa xác minh: ngày commit gần nhất của mọi repo; sao và license của Aider và GitNexus; việc Aider có dùng PageRank hay không (hai trang Aider không nêu thuật toán).

Suy luận của người research: điểm số, effort S/M/L, nhãn refute, và ngoại suy từ benchmark của bên khác sang Harnix.

## 8. Đối chiếu với thực tế sử dụng (2026-11-09)

Nguồn: transcript Claude Code cục bộ trong `~/.claude/projects` của 4 repo; chỉ đọc, không chạy lại. Các con số là ước lượng từ phân tích lệnh (còn lẫn lệnh nằm trong heredoc); transcript subagent không có riêng.

| Repo | Session | Bash | Grep tool | `sed -n` | `grep -r` | Lần gọi `harnix repo-map` |
| --- | --- | --- | --- | --- | --- | --- |
| `harnix` (self-host, TS) | 5 trước phiên này | khoảng 1.560 | 2 | 555 | 236 | 0 do agent tự gọi để điều hướng |
| `his` (PHP, 3.068 record) | 49 | 8.932 | 782 | 2.552 | 982 | 10, chỉ trong 2 session |
| `buy-dip-bot` (Python) | 1 | 671 | 0 | 311 | 41 | 0 |
| `payment-hub`, `pdh-clinic` | 1 + 1 | 9 + 1 | 18 + 3 | 0 | 0 | 0 |

### Phát hiện

1. **Agent không tự dùng repo-map.** Ở `his`, hai session có gọi đều do người dùng nhắc ("dùng repo-map đọc sâu lại ... nhớ refresh").
2. **Nhu cầu thật là khái niệm sang file, đọc lát file và chạy test hẹp**, không phải đồ thị:
   - 69% (538/782) mẫu Grep ở `his` là OR nhiều từ miền (ví dụ `THU1|THU3|MedCategoryCode`, `chia liều|C55|...`); 19% là symbol đơn; 81% dùng chế độ `content`. Kết quả Grep trung vị 652 byte, p90 4.236 byte.
   - 2.242 lệnh `sed -n` ở `his`, trung vị 36 dòng, p90 91 dòng; 168 trên 432 file bị đọc lại từ 4 lần trở lên, một file model bị đọc hơn 90 lần. Ở repo Python trung vị 130 dòng, p90 515.
   - Repo PHP không có bộ test tự động (kiểm bằng `php -l`); `--tests` và `--changed` chỉ có giá trị ở repo JS, TS, Python.
3. **Ba lỗi trong chính repo-map** (xác minh bằng mã và thí nghiệm trên repo này):
   - `--tests`: 5/5 file mẫu trả đủ 20 test, `truncated: true`, không có test trực tiếp (`tests.ts:57` sắp theo khoảng cách rồi bảng chữ cái).
   - `--query`: `search.ts:156` cộng +500 cho file của task active, +100 mỗi từ khóa task, +100/+120 cho lân cận, bất kể truy vấn; truy vấn vô nghĩa vẫn trả 20 kết quả, và `session cache` không tìm ra `session-cache.ts`.
   - Output: `--refs` 2.326 byte so với `grep -rn` 1.426 byte; `--refresh` trả 17.929 và 19.274 byte ở `his` (danh sách `skipped` gồm cả tên `.env.*`); `--outline --format compact` bị từ chối vì `--format` chỉ nhận `--query`.
4. Ở `his` truy vấn `M17 dose lot chia lieu` tìm đúng nhóm `M17C55` (dose split); lexical match hoạt động tốt khi không có nhiễu từ task.
5. Giới hạn của `--refresh` thủ công: người dùng phải nhớ làm mới; bản `harnix` cũ lúc đó không liệt kê `--refresh` trong help nên agent kết luận nhầm là không có. Phát hiện trạng thái cũ (stale) rẻ chưa có phương án; để ngỏ.

### Hệ quả cho epic

Bỏ `--cycles`, `--hubs`, `--budget` (không có nhu cầu). Bốn member: `repo-map-tests-ranking`, `repo-map-query-relevance`, `repo-map-symbol-body` (`--outline --symbol --body`), `repo-map-compact-refresh-changed` (đóng epic bằng `2.31.0`). Ba member nháp đầu tiên (`graph-insights`, `token-budget`, `changed-impact`) đã hủy rồi xóa khỏi `.harnix/tasks` theo yêu cầu người dùng; sau mục 9 epic có thêm member nền tảng `repo-map-extractor-quality` chạy đầu tiên, nên epic gồm 5 member.

### Chưa giải quyết

- Phát hiện stale rẻ (so sánh tên và kích thước file, không đọc nội dung) để cảnh báo thay vì bắt người dùng nhớ `--refresh`.
- Chỉ mục literal miền (mã như `THU1`) vì identifier-only bỏ sót chuỗi hằng; cần đổi `extractorVersion` nên ngoài epic này.
- Cách agent biết dùng repo-map: skill chỉ có thể đẩy sau khi sửa lỗi ở trên.

### Cơ chế để agent chủ động dùng repo-map (duyệt 2026-11-09)

Hiện không có: khối AGENTS luôn nạp không nhắc repo-map, mỗi skill chỉ có một mệnh đề "navigation hints only", hook chỉ chèn dòng pointer và bị cấm gọi repo-map. Quyết định (người dùng duyệt): (1) chỉ thị ở skill `harnix-plan`, `harnix-implement`, `harnix-debug`; (2) một dòng trong khối AGENTS luôn nạp, nâng hoặc đổi chỗ ngân sách `alwaysLoaded` (1500) có ghi quyết định; (3) một dòng gợi ý tĩnh trong hook context lean, không chạy repo-map. Loại: hook `PreToolUse` (đổi giao thức hook, không đồng đều giữa nền tảng). Làm sau khi sửa chất lượng ở member 1 và 2. Đo hiệu quả sau phát hành bằng cách đọc lại transcript (số lần gọi `harnix repo-map` trên mỗi session); dự án cấm telemetry nên đây là bước thủ công.

## 9. Đo trên repo thật: `his` và `payment_hub` (2026-11-09)

Phương pháp: `his` dùng cache sẵn có (lập 2026-11-01, chỉ đọc lệnh truy vấn). `payment_hub` (7 repo, chưa repo nào có Harnix) được xuất bằng `git archive HEAD` ra thư mục tạm rồi `harnix init` và `repo-map --refresh` trên bản sao, không ghi vào repo gốc. Mẫu nhỏ (khoảng 10 truy vấn), mỗi truy vấn lấy từ pattern agent đã grep trong session thật; TypeScript chỉ đo sơ bộ.

| Repo | Ngôn ngữ chính | Record | Truy vấn | Kết quả repo-map | Thực tế (grep) |
| --- | --- | --- | --- | --- | --- |
| `his` | PHP | 3.064 | `generateAutoKeyM01ReceiptCode` | rỗng | 15 file |
| `his` | PHP | | `classify_drug_regulatory_group` | file định nghĩa đứng đầu, sót `M17ReportController`, lẫn file không chứa | 3 file |
| `his` | PHP | | `--impact M17C78Model.php` | `dependents: []` | 11 file nạp model |
| `payment_hub` | C# (ABP) | 2.105 | `PaymentRequestCode` | 20 kết quả, 1 file thật sự chứa chuỗi | 28 file |
| `payment_hub` | C# | | `SplitCode` | 4 kết quả, 2 chứa | 69 file |
| `payment_hub` | C# | | `TenantReferenceCode` | rỗng | có |
| `payment_hub` | C# | | `--impact Transaction.cs` | 11 dependents, toàn `.csproj` | 81 file `.cs` |
| `payment_hub` | C# | | `--tests PaymentRequestAppService.cs` | 20 test (truncated), không liên quan | có test thật |
| `payment_hub` | TS (portal) | | `--impact api.ts` | 7 dependents | chưa đối chiếu chính xác |

### Nguyên nhân (đã xác minh trong `src/core/repo-map/extract.ts`)

1. `identifiers()` chỉ bắt `class|interface|function|enum|type|namespace|record|struct|const|let|var`, rồi `bounded(..., 48, 96)` sắp theo code-unit và cắt 48: file lớn mất gần hết tên (27 file C# và nhiều file PHP chạm trần); thuộc tính C# (domain như `PaymentRequestCode`) không có trong chỉ mục.
2. `imports()` không có mẫu PHP; mẫu `from\s*\(?\s*["']` bắt `->from("m01_fee_dtl fd")` của CodeIgniter nên `importTargets` PHP là tên bảng SQL; `->load->model('X')`, `require_once` và `use` không được nhận.
3. `using` C# là namespace nên nối tới `.csproj` hoặc thư mục, không tới file khai báo kiểu: mọi tính năng đồ thị (`--impact`, `--tests`, `--changed`) vô dụng ở các repo này.
4. `--tests` ở C# xếp theo trùng symbol chung nên trả test không liên quan.

### Nhu cầu thật quan sát được ở `payment_hub`

Session duy nhất: tra khái niệm xuyên 7 repo (`PaymentRequestCode`, `SplitCode`, `OrderCode`), xem ánh xạ DB (`ToTable|HasColumnName|UseNpgsql`), route controller (`Http(Get|Post)|[Route`), đọc một phần file (`Read ... limit 60`). Tức là cùng bốn nhu cầu như `his`: khái niệm sang file, đọc lát, tra tham chiếu, ánh xạ cấu hình.

### Hệ quả

Thêm member nền tảng `repo-map-extractor-quality` (`20261109-203650`, chạy đầu tiên, nâng `extractorVersion` lên 2, đã được người dùng duyệt); `query-relevance` thêm khớp chính xác thắng khớp mờ; `tests-ranking` thêm quy ước tên C#, PHP, Python và fixture ba ngôn ngữ; `--changed` dựa vào đồ thị đã sửa.

## 10. Review độc lập trước khi triển khai (2026-11-09)

Hai reviewer chỉ đọc (một đối chiếu member nền tảng với mã, một xem toàn epic) cộng việc tự kiểm chứng lại từng phát hiện bằng mã và lệnh chạy được. Kết quả và thay đổi đã áp dụng:

| Phát hiện | Kiểm chứng | Thay đổi |
| --- | --- | --- |
| `.csproj` làm dependents của file `.cs` là do `impact.ts:41-52` cố ý gộp theo project, có test khóa; giả thuyết "lỗi ở `graph.ts`" của kế hoạch sai | đúng | member 1: `ac-7` đổi thành dependents mức file xếp trước `.csproj`, giữ phần mở rộng; thêm `impact.ts` vào đường dẫn |
| Hint `run harnix repo-map --refresh` chỉ có ở nhánh `--events`; PRD gọi là "validated" sai | đúng | member 1: `ac-8` thêm trường tùy chọn `hint` vào kết quả unavailable (chỉ cộng thêm) |
| `self-host.test.ts` đọc cache được git theo dõi và đòi `extractorVersion: 1` | đúng | member 1: tái sinh cache và đổi kỳ vọng ở Slice 9 (`ac-9`); người dùng quyết định commit |
| `context.ts:89` rơi về fingerprint rỗng khi cache cũ, mọi task có context đã lưu thành `contextDrift: stale` | đúng | member 1: thêm `ac-11` (đọc fingerprint không phụ thuộc phiên bản) |
| Cạnh `references` có thể nổ số cạnh và đổi kết quả hiện có | hợp lý, thiết kế | member 1: thêm `ac-12` (trần riêng 8 cạnh mỗi file, 50.000 tổng, loại tên dùng bởi hơn 25 file, test khóa) |
| `store.test.ts` khẳng định đúng 48 tên | đúng | thêm vào Slice 2 |
| Bộ lọc secret của outline bỏ sót 3 trong 5 dạng (`'password' => '...'`, JSON, gán chỉ mục mảng) | đúng (chạy thử) | member 4: che dòng bằng bộ mẫu mạnh hơn, chặn đường dẫn bị ignore hoặc nhạy cảm |
| `--changed` trùng `verify-plan --impact` (lấy file đổi từ git, gọi `findAffectedTests`) | đúng; chẩn đoán trước đây của chính epic này thiếu | member 5: bỏ `--changed` (`dec-drop-changed`) |
| Ngân sách token: `alwaysLoaded` 1459 trên 1500, `harnix-plan` 1662 trên 1700; lean context đã 200 đến 393 token, không phải dưới 150 | đúng (`pnpm measure:tokens`) | member 5: `ac-4` nêu nâng trần và `RULE_OWNERSHIP.md`; `ac-5` đổi thành mức tăng tối đa 35 token |
| Tokenizer của MiniSearch đã tách đường dẫn; `session cache` khớp `session-cache.ts`; nguyên nhân là điểm cộng task ở bước seed và rank | đúng (chạy thử) | member 3: `ac-1` chặn ở cả seed và rank; `ac-2` đổi sang tách camelCase của identifiers |
| `ac-3` của member 3 nhắc rollback ranker v1 nhưng nhánh đó đã bị gỡ ở task [16] | đúng | đổi thành rollback bằng git revert |
| `--refresh`: mảng `skipped` trộn marker `"limit"` với tên file nhạy cảm | đúng (`inventory.ts`) | member 5: `ac-2` tách `limitReached`, lọc tên nhạy cảm |
| `fileKind` không nhận test C# (`X.Tests/FooTests.cs`) | **sai** trên `payment_hub`: 102 file `*Test(s).cs` đều có `kind: test` | không đổi; vẫn thêm quy ước tên C#/PHP/Python vào member 2 |

Các điều chưa xác minh được: tỷ lệ transcript (reviewer đếm lại ra 18 lệnh `harnix repo-map` và 1.815 lệnh `sed -n` ở `his`, khác số ở mục 8 vì regex và vì session đã tăng thêm; xem các số này là xấp xỉ); số liệu `payment_hub` chỉ do tác giả đo; hiệu năng và kích thước cache v2 và RSS (đo ở Slice 8); số token thật của dòng AGENTS và dòng hook mới.

Nhu cầu lớn nhất chưa được phục vụ: 69% mẫu Grep ở `his` là OR nhiều từ miền (`THU1|MedCategoryCode`); khớp chính xác trên identifier không trả lời các truy vấn đó. Epic không hứa repo-map "gọn hơn grep" ở nhu cầu này (xem `risk-literal-queries` của member 5). Tiêu chí thành công sau phát hành: đếm lại số lần agent tự gọi `harnix repo-map` trên mỗi session bằng transcript (dự án cấm telemetry nên đo thủ công).

Ghi chú: trong lúc đo, lệnh `harnix repo-map --refresh` chạy trong repo này đã sửa `.harnix/cache/repo-map-v1.json` (file được git theo dõi); file sẽ được tái sinh ở Slice 9 của member 1.
