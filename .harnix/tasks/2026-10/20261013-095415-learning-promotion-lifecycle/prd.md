# Vòng đời learning: review, reject, promote

## Vấn đề

Learning được ghi vào journal nhưng không có đường nào để người dùng duyệt hay áp dụng. `promotionProposal()` không được lệnh nào gọi; các trạng thái `approved`, `promoted`, `rejected` không bao giờ được ghi. Kênh prompt chỉ chọn 5 mục theo độ mới nên thường không liên quan tới việc đang làm (xem research note của task `20261013-095412-learning-research`).

## Mục tiêu

1. Người dùng xem hàng đợi learning, loại (`--reject`) hoặc `--promote --apply` thành quy tắc lâu dài trong repo. Không có bước `approve` riêng: `--apply` là sự đồng ý tường minh.
2. Promote chỉ ghi file khi có cờ `--apply` tường minh; mặc định chỉ in bản đề xuất.
3. Kênh prompt chọn learning theo độ liên quan với `relevantPaths` của task đang lập kế hoạch.
4. `.harnix/spec/learned.md` được nạp vào ngữ cảnh agent có chọn lọc để bài học đã promote thực sự có tác dụng mà không làm token tăng theo kích thước file.

## Quyết định thiết kế

- Lệnh công khai mới `harnix learning` (JSON mặc định, không cờ `--json`). Hành động chọn bằng cờ như `harnix status --explain` và `harnix skill --reference`, không dùng subcommand; `--reject`, `--promote`, `--retire` loại trừ nhau, `--apply` và `--reason` chỉ đi kèm hành động tương ứng, và cờ sai ngữ cảnh báo lỗi rõ:
  - `harnix learning [--status <s>] [--limit <n>]`: liệt kê trạng thái hiệu lực.
  - `harnix learning --reject <id> [--reason <text>]`.
  - `harnix learning --retire <id>`: gỡ khối của một learning đã promote khỏi `learned.md` và ghi entry `archived`.
  - `harnix learning --promote <id> [--apply]`: không `--apply` thì chỉ in đề xuất, có `--apply` thì ghi.
- Trạng thái ghi bằng entry journal mới (append-only), không sửa dòng cũ. Chuyển hợp lệ: `draft|candidate → promoted|rejected`; `promoted → archived` (retire); `rejected` và `archived` là cuối. `archived` tính khi đọc nên không duyệt được nếu đã lapse; lệnh báo lỗi rõ.
- Đích promote: `.harnix/spec/learned.md` (file do người dùng sở hữu, nằm ngoài catalog guide do Harnix quản lý nên `update` không ghi đè). Mỗi mục là một khối có marker `<!-- harnix-learning:<id> -->` bọc khung untrusted cố định của `promotionProposal`, nên promote lặp lại là idempotent. Ghi bằng `atomicWriteFile`, giữ nội dung người dùng đã sửa.
- Xếp hạng prompt: `candidate` trước, rồi giao nhau với `relevantPaths` (theo tiền tố đường dẫn), rồi độ mới; vẫn tối đa 5 mục và vẫn qua `learning-safety`. Mục `promoted` không đưa vào prompt (đã nằm trong spec).
- Kiểm soát độ phình của `learned.md`: marker mỗi khối mang thêm các tiền tố `relevantPaths` của task nguồn (`<!-- harnix-learning:<id> paths=a,b -->`). Khi nạp, chỉ chọn khối giao nhau với `relevantPaths` của task hiện tại cộng khối không gắn path, mới nhất trước, tối đa 5 khối và 2.000 ký tự, render trong khung untrusted như learning block (không qua `ContextEntry` để không nạp cả file). Trần 40 khối: `--promote --apply` từ chối khi đạt trần và nêu rõ cách `retire`. `harnix learning` hiển thị số khối và kích thước. Không có file thì không đổi gì.
- Không tự promote mục nào; không network; không đụng `learning-safety`.

## Phạm vi ngoài

Doctor không đổi; gộp gần trùng và lọc capture thuộc hai task sau của epic.

## Tiêu chí nghiệm thu

- ac-1: có đường end-to-end được test từ candidate/draft tới `.harnix/spec/learned.md` qua `--promote --apply`, và `learned.md` được nạp vào ngữ cảnh.
- ac-2: reject, promote ghi entry mới; trạng thái hiệu lực đúng trong `mem --learning`, `harnix learning` và preflight.
- ac-3: cờ và action mới cập nhật đủ cli-contract, golden, docs và template.
- ac-5: `learned.md` không làm token tăng vô hạn: nạp theo giao nhau `relevantPaths` trong trần 5 khối và 2.000 ký tự, promote bị từ chối ở 40 khối, `retire` gỡ khối và ghi `archived`.
- ac-4: skill harnix-plan, workflow.md và docs mô tả đúng vòng đời; doctor không đổi.
