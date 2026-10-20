# PRD: Bổ sung cờ CLI còn thiếu của workflow

## Bối cảnh & Vấn đề
Dùng Harnix trên workspace đa repo và khi lập kế hoạch epic để lộ các khoảng trống trong hidden `harnix workflow`:
- `--add-risk` chỉ có `--severity` và `--text`; người dùng đoán `--mitigation` rồi nhận `unknown option`.
- `--init` ở thư mục gốc đa repo báo "found no project test command; pass --command" dù `verify-plan --recursive` liệt kê đủ lệnh test theo từng package; không có `--cwd` cho `--init`.
- `--with-check` chỉ nhận `id, command, criteria, input, scope, description`, không nhận `cwd`, nên check cho một sub-repo không khai báo được ngay lúc tạo task.
- `--set-criterion` không dùng được với `--task`, trong khi `--set-check`, `--add-criterion`, `--set-paths`... đều dùng được; phải đi vòng qua `--batch`.
- Không có cách bỏ một decision hay một tiêu chí đã bị thay thế khi task còn `planning`; chỉ thêm được.

## Ranh giới & Ràng buộc
- Không đổi schema TaskRecord v3: `TaskResidualRisk` chỉ có `{ id, text, severity }`, nên mitigation được gộp vào `text`.
- Cờ mới tuân thủ checklist "Thêm cờ hoặc action workflow" trong AGENTS.md; hợp đồng `--brief` giữ nguyên (hai action mới cũng nhận `--brief`).
- `--remove-decision` và `--remove-criterion` chỉ chạy khi task còn `planning`; không xóa dữ liệu đã đóng băng hay đã có bằng chứng.
- `--task` vẫn bị từ chối với `--transition`, `--finish`, `--cancel`, `--run-check`, `--evidence`.
- Không đổi `--check-1` mặc định là `focused` khi lệnh không phải lệnh test của dự án.

## Yêu cầu kỹ thuật cốt lõi
- `--add-risk <id> --text <t> [--severity <l>] [--mitigation <m>]`: lưu `text` dạng `<t> (Mitigation: <m>)`; `--mitigation` chỉ hợp lệ với `--add-risk`.
- `--init [...] --cwd <path>`: tìm package có đường dẫn đó trong `verify-plan --recursive`; lệnh mặc định là lệnh test của package; check mặc định mang `cwd: <path>`, là `check-suite` (`full`) khi lệnh trùng lệnh test của package; inputs mặc định là `<path>/**`; thiếu lệnh test của package thì báo lỗi yêu cầu `--command`.
- `--with-check "...;cwd=<path>"`: khóa mới `cwd` (đường dẫn tương đối kho; kiểm tra bởi schema khi lưu).
- `--set-criterion` thêm vào tập action nhận `--task`.
- `--remove-decision <id>` và `--remove-criterion <id>`: action mới ở lõi (`plan-remove.ts`), có handler, cờ, `BRIEF_ACTIONS`, mô tả trong `--schema`, nhận `--task`. `--remove-criterion` cũng bỏ tiêu chí khỏi `criterionIds` của mọi check; từ chối nếu một check có bằng chứng đã ghi, hoặc nếu một check bắt buộc sẽ không còn phủ tiêu chí nào.

## Rủi ro & Chiến lược giảm thiểu
- Số cờ và action tăng làm lệch test hợp đồng, golden và tài liệu: làm theo đúng checklist, chạy `test:gates`.
- `workflow-handlers.ts` đã sát giới hạn 300 dòng: handler mới đặt ở file riêng.
- Xóa tiêu chí có thể làm mất phủ của check: kiểm tra trước khi lưu và để cổng lưu hiện có xác nhận lần nữa.
