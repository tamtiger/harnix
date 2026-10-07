# PRD: Khai báo nhiều tiêu chí và nhiều check ngay lúc --init

## Vấn đề

`harnix workflow --init` chỉ nhận một criterion (`--text`) và sinh một check. Task có 4 tiêu chí và 5 check phải dựng cả envelope JSON bằng PowerShell, hoặc gọi thêm 4–6 lệnh `--add-criterion` và `--set-check`. Check mặc định lại là `check-1`, scope `focused`, mô tả tiếng Anh "Verify <title>" dù lệnh là cả suite, nên luôn phải sửa tay.

## Mục tiêu

- `--text` lặp được với `--init`: mỗi lần lặp tạo một criterion theo thứ tự (`ac-1`, `ac-2`, ...); check mặc định (suite) phủ tất cả.
- Cờ lặp mới `--with-check "<đặc tả>"` (chỉ với `--init`) khai báo thêm check bắt buộc: `id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>[;scope=focused|full][;description=<text>]`. Khóa ngăn cách bằng dấu chấm phẩy, danh sách bằng dấu cộng; `id`, `command`, `criteria`, `input` bắt buộc; thiếu hoặc sai khóa thì lỗi nêu đúng tên khóa cần sửa. Check được kiểm bởi cùng bộ kiểm tra của `--save`.
- Check mặc định sinh từ lệnh test của dự án (lệnh tương đương `verify-plan`) có id `check-suite`, scope `full`, mô tả tiếng Việt; lệnh khác giữ `check-1`, scope `focused`.
- Cookbook và schema ghi cách dùng; cổng ready vẫn kiểm tra như thường.

## Ngoài phạm vi

- Không đổi `--add-criterion`, `--set-check`, `--batch` hay các cờ `--check`, `--command`, `--criteria` của lệnh khác.
- Không hỗ trợ command chứa dấu chấm phẩy trong `--with-check` (dùng `--set-check` sau đó).
- Không đổi hợp đồng đóng băng obligations hay cổng suite.

## Quyết định

- `d-ac3-vs-ac4`: "output --init không đổi" của ac-3 không áp dụng cho chuẩn hóa check mặc định của ac-4.
- `d-ac4-premise`: cổng suite không xét scope; ac-4 chỉ đồng nhất hóa với các member epic và cookbook.
- `d-with-check-spec`: định dạng đặc tả của `--with-check`.

## Rủi ro

Thêm cờ phải cập nhật đồng bộ nhiều nơi (xem `r-surface-lists`). `--text` đổi sang nhận nhiều giá trị nên các lệnh khác phải từ chối lặp.
