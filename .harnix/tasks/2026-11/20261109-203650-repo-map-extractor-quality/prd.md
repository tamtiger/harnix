# PRD: Nâng chất lượng trích xuất repo-map (extractorVersion 2)

Task: `20261109-203650-repo-map-extractor-quality` · Epic: `20261109-194501-repo-map-insights` (member chạy đầu tiên) · Mode: Full

## 1. Context & Problem Statement

`harnix repo-map` dựa vào một cache `.harnix/cache/repo-map-v1.json` do `src/core/repo-map/extract.ts` sinh ra. Đo ngày 2026-11-09 trên hai nơi người dùng hay làm việc (`his`: PHP/CodeIgniter 3.064 record; `payment_hub`: 7 repo, C#/ABP 1.437 file `.cs` cùng một portal TypeScript) cho thấy cache sai ở nền tảng, nên mọi truy vấn dựa trên nó đều kém:

| Triệu chứng đo được | Nguyên nhân trong mã |
| --- | --- |
| `--query generateAutoKeyM01ReceiptCode` (15 file dùng) trả rỗng; không record nào chứa tên đó, kể cả file định nghĩa | `identifiers()` sắp theo code-unit rồi cắt 48 tên (`bounded(..., 48, 96)`); file lớn mất gần hết tên bắt đầu bằng chữ thường |
| `--query PaymentRequestCode` trả 20 file nhưng chỉ 1 file thật sự chứa chuỗi (grep thấy 28); `TenantReferenceCode` trả rỗng | thuộc tính và phương thức C# không có trong chỉ mục (chỉ bắt `class\|interface\|function\|enum\|type\|namespace\|record\|struct\|const\|let\|var`) |
| `importTargets` của model PHP là tên bảng SQL (`m17_export_mst e`); `--impact M17C78Model.php` trả rỗng trong khi 11 file nạp nó | mẫu `from\s*\(?\s*["']` bắt `->from("bang alias")` của CodeIgniter; `->load->model`, `require_once`, `use` không được nhận |
| `--impact Transaction.cs` trả 11 file `.csproj`, 81 file `.cs` thật dùng nó không có mặt | `using` C# là namespace nên không nối tới file khai báo kiểu; nguyên nhân .csproj đã xác định: `impact.ts:41-52` cố ý gộp dependents của `.csproj` bao quanh (có test khóa) |

Hệ quả: `--query`, `--impact`, `--tests` và `--changed` (member sau) kém hoặc vô dụng ở các repo PHP và C#, tức phần lớn công việc thật của người dùng. Các member sau của epic không có nền để dựa vào nếu chưa sửa việc này.

## 2. Scope & Boundaries

Trong phạm vi:
- Chọn tên giữ lại theo thứ tự xuất hiện và ưu tiên khai báo, sau đó mới sắp để lưu; trần 128 tên.
- Lập chỉ mục thuộc tính C# và phương thức C# hoặc Java; thuộc tính PHP.
- Import PHP: `use`, `require` và `include` (`_once`), `->load->model|library|helper|view` của CodeIgniter; gói mẫu `from(...)` chỉ cho JavaScript, TypeScript, Python.
- Trường tùy chọn `references` và cạnh tham chiếu có trần riêng trong đồ thị (C#, PHP, TypeScript, JavaScript, Java, Python); dependents mức file xếp trước `.csproj` trong `--impact`.
- Trường tùy chọn `hint` cho kết quả unavailable, đọc `inventoryFingerprint` không phụ thuộc phiên bản để context đã lưu không thành stale, tái sinh cache được git theo dõi của repo này.
- `extractorVersion` 1 lên 2 cùng cơ chế xử lý cache cũ.
- Test (fixture CodeIgniter, ABP, TypeScript), test migration, đồng bộ tài liệu, phiên bản `2.31.0-dev.1`.

Ngoài phạm vi (non-goals):
- Không thêm tree-sitter hoặc dependency mới; không hỗ trợ ngôn ngữ mới ngoài những ngôn ngữ `extract.ts` đã nhận.
- Không đổi `schemaVersion` 1 của `RepoMapV1` và đường dẫn cache; chỉ thêm trường tùy chọn.
- Không đổi thứ hạng `--query` (member `repo-map-query-relevance`), thứ hạng `--tests` (member `repo-map-tests-ranking`) hay hình dạng output công khai (ngoài trường tùy chọn mới `hint` của kết quả unavailable).
- Không đổi hook; hook vẫn không gọi repo-map.

## 3. Anchored Acceptance Criteria

Các tiêu chí nằm trong `task.json` (nguồn chính). Mỗi tiêu chí là một hành vi quan sát được từ ngoài:

- `ac-1`: file có 200 khai báo giữ 128 tên đầu theo thứ tự xuất hiện; lưu đã sắp, không trùng.
- `ac-2`: thuộc tính C# và phương thức C# hoặc Java có trong identifiers; constructor, từ khóa, kiểu trả về không bị lấy nhầm.
- `ac-3`: record JSON (thụt 2 dấu cách) của file 100 KB có 500 khai báo không quá 12 KB; trần lấy từ một hằng số dùng chung.
- `ac-4`: import PHP (`use`, `require`/`include`, CodeIgniter `->load->...`) có trong `importTargets`.
- `ac-5`: tên bảng trong `->from()`, `->join()` hoặc SQL của PHP không thành import; `from 'x'` của JS, TS, Python vẫn nhận; Go và Java không đổi.
- `ac-6`: `references` (đã sắp, không trùng, tối đa 48 tên, mỗi tên tối đa 96 ký tự), chỉ tên được khai báo ở 1 đến 4 file khác, được dựng ở bước hai của làm mới khi mọi file đã được trích xuất.
- `ac-7`: `--impact` của file `.cs` trả các file `.cs` thật ở khoảng cách 1, xếp trước `.csproj`; phần mở rộng ProjectReference giữ nguyên; tương tự cho PHP và TS (fixture).
- `ac-8`: cache `extractorVersion` 1 báo `invalid` kèm trường tùy chọn `hint` (`run harnix repo-map --refresh`); đọc không ghi file.
- `ac-10`: `--refresh` dựng lại bản 2 không dùng record cũ; doctor báo cache `extractorVersion` cũ là `repo-map-stale` (cảnh báo, sửa được), cache không phải repo map vẫn là `repo-map-invalid`, và `--fix` đưa về ready.
- `ac-11`: task có sidecar context đã lưu không thành `contextDrift: stale` chỉ vì cache cũ.
- `ac-12`: cạnh `references` có trần riêng (8 cạnh mỗi file, 50.000 tổng), loại tên chung dùng bởi hơn 200 file; kết quả `--query`, `--tests`, `--impact` trên fixture TypeScript hiện có không đổi.
- `ac-9`: tài liệu đồng bộ, cache được theo dõi và test self-host cập nhật, phiên bản `2.31.0-dev.1`, `pnpm run test:gates` xanh.

## 4. Architectural & Safety Constraints

- Tuân theo `AGENTS.md` của dự án và các guide trong `.harnix/spec/guides/` (`common.md`, `languages/typescript.md`): TypeScript strict, `unknown` cộng parser ở biên, không `any`, không `!`.
- Hướng phụ thuộc `commands -> core -> utils`; `core` không import Commander, Inquirer hay template. Mỗi file `src` tối đa 300 dòng code và complexity tối đa 20; mỗi file test tối đa 400 dòng và mỗi module `src` có spec tương ứng.
- Cache chỉ chứa metadata có cấu trúc: không thân mã nguồn, không literal, không secret, không đường dẫn tuyệt đối. Bộ lọc secret hiện có áp dụng cho cả `identifiers`, `importTargets` và `references`.
- Mẫu regex mới phải chịu được file 1 MB một dòng (không backtracking thảm họa); không dùng nhóm lồng có lặp.
- Cache là dữ liệu dùng lại được: `validateRepoMap` vẫn từ chối bản không hỗ trợ; đọc bản cũ không ghi gì; ghi dùng atomic replace như hiện nay. Không dùng lại record của lần làm mới trước khi cache cũ không hợp lệ.
- Không đổi enum `status` công khai (`ready|missing|invalid|not-found`).
- Hợp đồng đóng băng bị chạm: `extractorVersion` (docs/IMPLEMENTATION_PLAN.md mục 4 và mô tả cache), nên PRD, IMPLEMENTATION_PLAN, test và migration phải đổi cùng lúc.
- Thay đổi chưa commit của người dùng (`docs/prompts/repo-graph-tools-research.md`, dữ liệu `.harnix/` của epic) phải được giữ nguyên; không commit, không tạo nhánh.

## Giả định

| Giả định | Trạng thái | Tác động nếu sai |
| --- | --- | --- |
| `identifiers()` sắp theo code-unit rồi cắt 48; `validateRepoMap` đòi mảng đã sắp, không trùng, tối đa 48 | validated (đọc `extract.ts:62-108`, `store.ts`) | Thiết kế chọn rồi sắp sai |
| `validateRepoMap` từ chối `extractorVersion` khác 1 nên `readPreviousRecords` trả rỗng khi cache cũ | validated (`store.ts:42`, `service.ts:readPreviousRecords`) | Có thể dùng lại record cũ sau khi nâng version |
| Query, impact, tests, refs trả `invalid` khi cache không đọc được nhưng KHÔNG có hint (chỉ nhánh `--events` có) | validated (`repo-map-internal.ts:105-112`, `impact.ts:115-121`; sửa sau review) | Phải thêm trường tùy chọn `hint` |
| `context.ts:89` rơi về fingerprint rỗng khi cache không đọc được, làm sidecar context thành stale | validated (review độc lập) | Mọi task có context đã lưu phải replan sau nâng cấp |
| `self-host.test.ts` đọc cache được git theo dõi và đòi `extractorVersion: 1` | validated | `pnpm test` đỏ nếu không tái sinh cache |
| Cache `his` hiện 1,99 MB cho 3.064 record; trần mới cộng references không làm vượt 3 lần | assumed | Cache quá lớn; chỉnh trần ở slice đo thực tế |
| Regex thuộc tính và phương thức C# chạy được trên file 1 MB trong vài trăm mili giây | assumed | Chậm làm mới; thêm test hiệu năng và đơn giản hóa mẫu |
| `.csproj` làm dependents của file `.cs` là do `impact.ts:41-52` cố ý mở rộng theo project, không phải `graph.ts` | validated (review độc lập, đọc mã) | Sửa `graph.ts` không làm `ac-7` xanh; phải đổi thứ tự dependents trong `impact.ts` |
| Phát hiện cache cũ chỉ dựa vào `extractorVersion`, không cần so lại chữ ký thư mục | validated | Cache sai không được báo |

## Điều bạn có thể chưa biết

- Lần chạy `--refresh` đầu sau nâng cấp sẽ lâu hơn một chút vì tính thêm `references`; cache cũ bị coi là `invalid` cho tới lúc đó, nên các lệnh query, impact, tests, refs trả `invalid` kèm hint cho tới khi refresh.
- Cache lớn hơn (chỉ mục tên dài hơn và có `references`); trần sẽ được chỉnh theo đo trên `his` và `payment_hub` ở slice 8.
- Nâng cấp làm `repo-map-stale` (cảnh báo) xuất hiện trong doctor cho tới khi người dùng `--refresh` hoặc `doctor --fix`; cache của chính repo này được tái sinh và lớn hơn trong git.
- Kết quả đồ thị dựa trên regex nên tham chiếu động (reflection, DI theo chuỗi) vẫn bị bỏ sót.
