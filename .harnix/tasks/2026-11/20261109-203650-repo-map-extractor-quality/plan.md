# Plan: Nâng chất lượng trích xuất repo-map (extractorVersion 2)

Task: `20261109-203650-repo-map-extractor-quality` · Epic: `20261109-194501-repo-map-insights` (member 1 theo thứ tự) · Phiên bản: `2.31.0-dev.1`

Kế hoạch đã được replan sau review độc lập ngày 2026-11-09 (xem `research.md` của epic, mục 10).

## Execution Slices

Mỗi slice theo thứ tự RED (test hỏng) rồi GREEN (code tối thiểu), chạy test hẹp trước, bộ `repo-map` sau.

- [x] [chk-focused] Slice 1: chẩn đoán `impact.ts`, fixture và test RED nền (ac-1, ac-2, ac-4, ac-5, ac-7, ac-12)
- [x] [chk-focused] Slice 2: hằng số trần dùng chung và chọn-rồi-sắp tên (ac-1, ac-3)
- [x] [chk-focused] Slice 3: thuộc tính và phương thức C#, Java; thuộc tính PHP (ac-2)
- [x] [chk-focused] Slice 4: import PHP và giới hạn mẫu from riêng cho PHP (ac-4, ac-5)
- [x] [chk-focused] Slice 5: trường references và bước hai khi làm mới (ac-6)
- [x] [chk-focused] Slice 6: cạnh tham chiếu có trần và thứ tự dependents của impact (ac-7, ac-12)
- [x] [chk-migration] Slice 7: extractorVersion 2, hint, fingerprint cho context và doctor (ac-8, ac-10, ac-11)
- [x] [chk-focused] Slice 8: đo kích thước, RSS và truy vấn trên his và payment_hub, chỉnh trần (ac-3)
- [x] [chk-gates] Slice 9: tài liệu, tái sinh cache được theo dõi, CHANGELOG, phiên bản 2.31.0-dev.1 (ac-9)
- [x] [chk-suite] Slice 10: lint, typecheck, test:gates, suite và rà soát tuân thủ (ac-1 đến ac-12)

### Slice 1: chẩn đoán `impact.ts`, fixture và test RED nền

- Nguyên nhân `.csproj` làm dependents đã xác định: `src/core/repo-map/impact.ts:41-52` cố ý, với target `.cs`, tìm `.csproj` bao quanh rồi gộp dependents của nó (`mergeDependents`); `test/unit/core/repo-map/impact.test.ts` ("expands … through enclosing .csproj ProjectReference") khóa hành vi này. Hành vi này được giữ nguyên; việc cần làm là thêm dependents mức file (Slice 6) và xếp chúng trước.
- Tạo `test/support/repo-map-fixtures.ts` (dưới 400 dòng): (a) CodeIgniter: model có `$this->db->from('m17_export_mst e')`, `->join('bang')`, `$this->load->model('M17/Foo')`, `require_once 'x.php'`, `use App\Models\Foo;`; (b) ABP C#: entity `Transaction` có `public string PaymentRequestCode { get; set; }`, `PaymentRequestAppService` dùng `Transaction`, `.csproj` có `ProjectReference`; (c) TypeScript: `api.ts` và hai file import nó; (d) Go và Java mẫu cho test khóa import.
- Viết các test hỏng trước trong `extract.test.ts`, `graph.test.ts`, `impact.test.ts`; mỗi file test dưới 400 dòng (vượt thì tách `*-php.test.ts`, `*-csharp.test.ts`).
- Chạy `pnpm exec vitest run repo-map` và ghi nhận đúng các test này hỏng vì lý do mong đợi.

### Slice 2: hằng số trần dùng chung và chọn-rồi-sắp (ac-1, ac-3)

- `src/core/repo-map/types.ts`: thêm hằng đóng băng `repoMapRecordLimits` (`identifiers` 128 tên, 96 ký tự; `references` 48, 96; `importTargets` 32, 160; `headings` 16, 120). `store.ts` (`validateRecord`) và `extract.ts` cùng đọc hằng này, không còn số cứng 48/32/16.
- Tách `src/core/repo-map/extract-symbols.ts` (spec `test/unit/core/repo-map/extract-symbols.test.ts`): `selectNames(values, limit)` giữ giá trị đầu tiên theo thứ tự ưu tiên (khai báo, rồi tham chiếu thử nghiệm, rồi route/topic), bỏ trùng, cắt theo trần, rồi sắp theo code-unit để lưu.
- Sửa `test/unit/core/repo-map/store.test.ts` (đang khẳng định đúng 48 tên và thông điệp "at most 48 strings") theo trần mới.
- Test: file có 200 khai báo tên đảo thứ tự bảng chữ cái giữ đúng 128 tên đầu; kết quả đã sắp và không trùng; record 100 KB có 500 khai báo dưới 12 KB ở dạng thụt 2 dấu cách.

### Slice 3: thuộc tính và phương thức (ac-2)

- Trong `extract-symbols.ts`: mẫu thuộc tính C# (bộ chỉnh `public|internal|protected|private`, tiền tố tùy chọn `static|virtual|override|abstract|sealed|required|new|readonly|partial`, một token kiểu cho phép `.<>,?[]` và dấu cách sau dấu phẩy trong kiểu generic như `Dictionary<string, int>`, tên, rồi `{ get|set|init`); mẫu phương thức C# và Java (cùng bộ chỉnh, `async|final|synchronized`, token kiểu, tên, tham số kiểu tùy chọn, `(`); thuộc tính PHP (`public|protected|private [static|readonly] [kiểu] $tên`).
- Constructor (không có token kiểu trước tên) và từ khóa điều khiển không khớp. Mẫu không có backtracking thảm họa (đã thử ReDoS trên 14 chuỗi 0,6 đến 1 MB: dưới 10 ms; giữ test hiệu năng một dòng 1 MB).
- Thành viên interface không có bộ chỉnh (ví dụ khai báo trong `IFooAppService`) chưa được hỗ trợ trong task này; ghi vào rủi ro.
- Test: `PaymentRequestCode`, `Counts` của `Dictionary<string, int>` và `GetFooAsync` có trong identifiers; constructor `public Foo(` không; `Task`, `string` không.

### Slice 4: import PHP và giới hạn mẫu from (ac-4, ac-5)

- Tách `src/core/repo-map/extract-imports.ts` (spec `extract-imports.test.ts`), nhận `language`. Mẫu `from|import|require` có chuỗi chỉ bị loại cho PHP; JavaScript, TypeScript, Python giữ nguyên, và Go, Java giữ nguyên kết quả hiện tại (test khóa, gồm Go `import "fmt"`).
- PHP: `^\s*use\s+Ten\Lop(\s+as\s+\w+)?;` (đổi `\` thành `.`; `use function` và `use Foo\{A,B}` chưa hỗ trợ), `(require|include)(_once)?` với chuỗi (có hoặc không `__DIR__ .`; bỏ dấu `/` đầu để đồ thị không loại), `->load->(model|library|helper|view)('X' ...)` (giữ chuỗi, bỏ tham số thứ hai; so khớp phân biệt hoa thường như đồ thị hiện nay).
- Test: `->from('m17_export_mst e')`, `->join('bang b')` và SQL trong chuỗi không thành import PHP; `from "./x"` trong TS vẫn có; Go và Java không đổi; ba dạng CodeIgniter và `use` có.

### Slice 5: references và bước hai khi làm mới (ac-6)

- `extract.ts`: thêm `extractRepoMapFile(file, roots)` trả `{ record, usedNames }` (tập tên dạng định danh dài từ 3 đến 96 ký tự trong nội dung, tối đa 1.000 tên mỗi file, chỉ file mã nguồn); `extractRepoMapRecord` giữ như lớp bọc trả record (cho `diagnoseRepoMap`).
- Module mới `src/core/repo-map/references.ts` (spec `references.test.ts`): `attachReferences(extracted)` dựng chỉ mục tên khai báo (tên, danh sách file khai báo), với mỗi file giữ tên nằm trong `usedNames` và được khai báo ở 1 đến 4 file khác, ưu tiên ít nơi khai báo hơn rồi code-unit, cắt 48, sắp để lưu; giải phóng `usedNames` ngay sau khi dùng để giới hạn bộ nhớ.
- `types.ts`: `references?: string[]` tùy chọn; `store.ts`: kiểm tra mảng đã sắp, không trùng, trong trần, qua bộ lọc secret.
- `service.ts` (`refreshRepoMap`): hai bước (trích xuất mọi file, rồi `attachReferences`); bỏ cơ chế dùng lại record theo `contentHash` vì `references` phụ thuộc tập khai báo toàn cục (không mất hiệu năng: việc đọc và băm file đã diễn ra trước khi so).
- Test: tên khai báo ở 5 file không vào references; tên chỉ khai báo trong chính file đó không vào; thứ tự và giới hạn xác định; không có `usedNames` rò vào cache.

### Slice 6: cạnh tham chiếu có trần và thứ tự dependents (ac-7, ac-12)

- `graph.ts` (hoặc `graph-references.ts` nếu vượt 300 dòng): với mỗi record có `references`, thêm cạnh tới các file khai báo tên đó (khác chính nó). Trần riêng cho loại cạnh này: tối đa 8 cạnh mỗi file và 50.000 cạnh tổng; hết trần thì ưu tiên cạnh import; tên được hơn 200 file dùng bị loại khỏi cạnh (tên chung như `Code`, `Status`); vẫn chịu `maxNodes`, `maxEdges`, `maxAmbiguousMatches`; thứ tự xác định.
- `impact.ts`: dependents mức file (khoảng cách 1, từ references) xếp trước dependents `.csproj` do mở rộng theo project; giữ nguyên phần mở rộng ProjectReference và test hiện có.
- Test khóa: trên fixture TypeScript hiện có, kết quả `--query`, `--tests`, `--impact` không đổi so với trước khi thêm cạnh; `--impact` của `Transaction.cs` trả `PaymentRequestAppService.cs` ở khoảng cách 1; PHP model nối với controller nạp nó; không vòng lặp vô hạn; kiểm tra tác động lên `search.ts`, `refs.ts`, `tests.ts` vì cùng dùng `buildRepoMapGraph`.

### Slice 7: extractorVersion 2, hint, fingerprint, doctor (ac-8, ac-10, ac-11)

- `types.ts`: `extractorVersion: 2`; `store.ts`: `createRepoMap` ghi 2, `validateRepoMap` chỉ chấp nhận 2, và thêm hàm đọc `inventoryFingerprint` không phụ thuộc phiên bản extractor (chỉ kiểm `generator`, `schemaVersion` và dạng hash; công thức fingerprint chỉ gồm path và `contentHash` nên không đổi).
- `src/core/workflow/context.ts:89` dùng hàm đọc fingerprint này thay cho `readRepoMap`, để sidecar context đã lưu không thành `inventory-unavailable` và `contextDrift: stale` khi cache còn bản cũ.
- Thêm trường tùy chọn `hint` ("run harnix repo-map --refresh") vào kết quả `unavailable` của query, impact, tests, refs (`impact.ts`, `tests.ts`, `refs.ts`, `service.ts`); đây là thay đổi output công khai chỉ cộng thêm, có tiền lệ ở nhánh `--events` của `repo-map-internal.ts`; cập nhật `docs/IMPLEMENTATION_PLAN.md` mục 4.16 và test hợp đồng.
- Cache cũ vẫn bị `validateRepoMap` từ chối nên `readPreviousRecords` trả rỗng và không dùng lại record cũ. `diagnoseRepoMap` coi cache có header hợp lệ nhưng `extractorVersion` nhỏ hơn 2 là `stale` (finding `repo-map-stale`, mức warning, sửa được) vì `doctor --fix` chỉ chạy khi trạng thái dự án là `ready` và finding mức error làm trạng thái thành `invalid`; cache không phải repo map vẫn là `repo-map-invalid`.
- `test/migration/repo-map-extractor-v2.test.ts` (dưới 400 dòng, fixture cache 1 dựng bằng builder): query, impact, tests, refs trả `invalid` kèm hint; `--refresh` ghi bản 2 và không dùng lại record cũ; `diagnoseRepoMap` trả `invalid` rồi `ready` sau sửa; đọc cache cũ không ghi file nào (so sánh mtime và nội dung); task có sidecar context đã lưu không thành `stale` sau khi nâng cấp.

### Slice 8: đo trên repo thật và chỉnh trần (ac-3)

- Làm bản sao tạm (không ghi vào repo người dùng): `git archive HEAD` của `his` và của 7 repo trong `D:\FSoft\payment_hub` vào thư mục tạm, `harnix init` rồi `harnix repo-map --refresh` bằng bản `harnix` vừa build.
- Đo kích thước cache (his 1,99 MB; payment_hub 2.105 record), RSS đỉnh khi làm mới (giữ `usedNames`) và các truy vấn đã đo: `generateAutoKeyM01ReceiptCode`, `PaymentRequestCode`, `SplitCode`, `TenantReferenceCode`, `--impact Transaction.cs`, `--impact M17C78Model.php`, `--refs`.
- Nếu cache vượt 3 lần hoặc RSS quá cao, hạ trần trong `repoMapRecordLimits` (một chỗ duy nhất) rồi đo lại; ghi số đo và kết luận vào `research.md` của epic và một decision `trace-measurement-extractor-v2`.

### Slice 9: tài liệu, cache được theo dõi, CHANGELOG, phiên bản (ac-9)

- Cache `.harnix/cache/repo-map-v1.json` đang được git theo dõi và test `self-host.test.ts` đọc nó với `extractorVersion: 1`: tái sinh bằng `harnix repo-map --refresh` sau khi build, cập nhật kỳ vọng thành 2, và báo kích thước mới cho người dùng (cache lớn hơn sẽ nằm trong git; người dùng quyết định commit).
- Đồng bộ (checklist skill dự án `harnix-self-host`): `docs/HARNIX_PRD.md` (dòng 503 và các mục liên quan), `docs/IMPLEMENTATION_PLAN.md` (mục 4.12, 4.16, dòng 1590), `README.md` (nếu nhắc repo-map), `AGENTS.md` và `src/templates/AGENTS.md`, `rules/AGENTS.md`, `docs/HARNESS_RESEARCH.md`, `docs/HARNESS_FEATURE_PROVENANCE.json` nếu có mục repo-map. Không đổi template workflow nên không cần `pnpm selfhost:sync`.
- `pnpm version:sync 2.31.0-dev.1 --summary "Nâng extractorVersion lên 2: chỉ mục symbol không cắt theo bảng chữ cái, thuộc tính C#, import PHP/CodeIgniter, references" --kind changed` và cập nhật mục CHANGELOG (trước `verifying`). `pnpm format`.

### Slice 10: xác minh

- `pnpm run lint` và `pnpm run typecheck` (không phải check bắt buộc; báo kết quả), `pnpm exec vitest run repo-map`, `pnpm run test:migration`, `pnpm run test:gates`, `pnpm run test`.
- Rà soát tuân thủ (tài liệu đã đồng bộ 100%), rồi chất lượng và bảo mật; sau đó `--finish` chỉ từ `verifying/finishing`.

## Guardrails & Invariants

- Viết test hỏng trước cho mỗi hành vi; không sửa hay nới test để qua (ngoại lệ có ghi lý do: kỳ vọng 48 tên và `extractorVersion: 1` đổi theo hợp đồng mới).
- Không đổi `schemaVersion` 1, đường dẫn cache, enum `status` công khai; chỉ cộng trường tùy chọn `references` (record) và `hint` (kết quả unavailable).
- Cache không chứa thân mã, literal, secret hay đường dẫn tuyệt đối; bộ lọc secret áp dụng cho mọi mảng.
- `core` không phụ thuộc Commander, Inquirer hay template; file `src` dưới 300 dòng code, complexity tối đa 20, file test dưới 400 dòng.
- Giữ nguyên thay đổi chưa commit của người dùng; không commit, không tạo nhánh, không chạy `git checkout` qua pipe.
- Không chạm bản `harnix` hay repo thật của người dùng ngoài thư mục tạm; riêng cache của chính repo này được tái sinh ở Slice 9.
- Một lượt khắc phục tự động; vòng thứ hai thất bại thì dừng và báo.

## Verification Matrix

| Check | Lệnh | Phủ tiêu chí | Chứng minh |
| --- | --- | --- | --- |
| `chk-focused` | `pnpm exec vitest run repo-map` | ac-1 đến ac-7, ac-12 | chọn tên, thuộc tính và phương thức, trần, import PHP, references, cạnh và thứ tự dependents |
| `chk-migration` | `pnpm run test:migration` | ac-8, ac-10, ac-11 | cache extractorVersion 1: invalid kèm hint, refresh dựng lại bản 2, doctor, context không stale |
| `chk-gates` | `pnpm run test:gates` | ac-9 | hợp đồng CLI, tài liệu, kiến trúc, ngân sách skill, golden |
| `chk-suite` | `pnpm run test` | ac-1 đến ac-12 | toàn bộ bộ test và ngưỡng coverage không giảm |

Bằng chứng ngoài check (ghi vào `research.md` của epic, không thay thế check): số đo cache, RSS và kết quả truy vấn trên `his` và `payment_hub` ở Slice 8.
