# PRD: Sửa độ liên quan của repo-map --query khi có task đang active

Task: `20261109-200112-repo-map-query-relevance` · Epic: `20261109-194501-repo-map-insights` (member 3) · Mode: Full

## 1. Context & Problem Statement

`harnix repo-map --query` trả file liên quan tới một chuỗi truy vấn. Đo ngày 2026-11-09 khi có một task đang active:

- Truy vấn vô nghĩa (`zzzqqq nothing matches`) vẫn trả 20 kết quả, điểm 870 trở xuống, đúng bằng `relevantPaths` của task. Nguyên nhân: `search.ts` thêm `relevantPaths` vào danh sách seed ngay cả khi không khớp từ khóa, rồi `rank()` cộng +500 cho file của task, +100 cho mỗi từ khóa task, +50/+25 cho cùng package/ngôn ngữ, và đồ thị cộng thêm +120/+100/+40.
- Truy vấn `session cache` đặt `graph.ts` lên đầu và không có `session-cache.ts` trong top 6.
- Trên repo thật, truy vấn nhiều từ như `PaymentRequestCode` và `THU1 MedCategoryCode` bị khớp mờ theo tên file (ví dụ `iframe_ds_phieu_da_thu.js`) xếp trên file chứa đúng tên; `PaymentRequestCode` trả 20 file nhưng chỉ 1 file thật sự chứa chuỗi.
- Tên chỉ được dùng (không khai báo) ở file nào đó hoàn toàn không tìm thấy qua chỉ mục, dù `--refs` tìm được.

Hậu quả: agent hỏi về thứ chưa biết thì được trả lại đúng những file nó đang làm, nên bỏ `repo-map` và quay về `grep`.

## 2. Scope & Boundaries

Trong phạm vi:
- Các điểm cộng từ task (seed, `relevantPaths`, từ khóa task, cùng package, cùng ngôn ngữ) chỉ áp dụng cho file có lexical match; truy vấn không khớp file nào trả `results` rỗng.
- Khớp chính xác thắng khớp mờ và khớp tiền tố; khớp mờ chỉ dùng khi không có khớp chính xác.
- Tách camelCase của identifiers khi lập chỉ mục từ vựng (module `search-terms.ts`).
- Truy vấn một token dạng identifier mà không có kết quả thì tra tham chiếu như `--refs`, trả kết quả có nhãn `fallback`.
- Bộ truy vấn vàng, tài liệu, phiên bản `2.31.0-dev.3`.

Ngoài phạm vi:
- Không đổi `RepoMapV1`, đồ thị, `extractorVersion`; không thêm embedding hay cờ mới (không có `--no-task`).
- Không đổi thứ hạng `--tests` hay `--impact`.

## 3. Anchored Acceptance Criteria

Nguồn chính là `task.json`:
- `ac-1`: bonus task chỉ cho file có lexical match, ở cả bước seed lẫn rank; truy vấn không khớp trả rỗng.
- `ac-2`: tách camelCase trong chỉ mục (`cache` khớp `SessionCache`); khóa bằng test việc MiniSearch đã tách đường dẫn.
- `ac-3`: bộ truy vấn vàng tối thiểu 8 cặp, file mong đợi trong top 3 khi có task active; truy vấn vô nghĩa trả rỗng; tài liệu ghi ranker mới và rollback bằng git revert; phiên bản `2.31.0-dev.3`; `test:gates` xanh.
- `ac-4`: khớp chính xác thắng khớp mờ; token identifier không có trong chỉ mục thì tra tham chiếu, kèm nhãn `fallback`.

## 4. Architectural & Safety Constraints

- Theo `AGENTS.md`, guide `common.md` và `languages/typescript.md` (strict, không `any`, không `!`).
- `core` không phụ thuộc Commander, Inquirer hay template; file `src` dưới 300 dòng code; mỗi module `src` có spec 1-1; file test dưới 400 dòng.
- Output công khai chỉ cộng thêm (trường `fallback`); không đổi enum `status`, không đổi `--limit`.
- Tra tham chiếu dùng đúng cơ chế an toàn của `--refs` (đường dẫn trong root, bỏ qua file nhạy cảm, bounded); không I/O mới ngoài cơ chế đó, không chạy khi đã có kết quả.
- Thứ tự xác định (điểm rồi code-unit); không lộ đường dẫn tuyệt đối; không dùng hook.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Giả định

| Giả định | Trạng thái | Tác động nếu sai |
| --- | --- | --- |
| MiniSearch tách đường dẫn theo gạch, chấm, gạch dưới, gạch chéo | validated (chạy thử 2026-11-09: `session cache` khớp `session-cache.ts`) | Phải thêm tách đường dẫn |
| Truy vấn không khớp trả rỗng không làm hỏng hook context (hook không gọi repo-map) | validated (hợp đồng hook) | Không |
| `findRepoMapReferences` dùng được từ `service.ts` cho một token mà không cần target | validated (`refs.ts`) | Cần bao bọc |

## Điều bạn có thể chưa biết

- Khi có task active, các file của task không còn tự xuất hiện trong kết quả `--query` nếu truy vấn không khớp chúng; muốn xem lại file của task thì dùng đường dẫn hoặc tên của chúng.
- Truy vấn một tên chỉ được dùng (không khai báo) có thể chậm hơn một chút vì quét nội dung; chỉ chạy khi chỉ mục không có kết quả.
- Rollback bằng `git revert`; nhánh ranker v1 đã bị gỡ ở task [16].
