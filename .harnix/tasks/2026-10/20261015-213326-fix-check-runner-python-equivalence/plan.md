# Kế hoạch thực hiện: Nhận diện tương đương lệnh kiểm thử Python

## 1. Danh sách công việc (Checklist)
- [x] Thêm unit tests cho Python command equivalence trong `test/unit/core/workflow/command-match.test.ts` (RED: kiểm tra `pytest` tương đương với `python -m pytest`, `python3 -m pytest`, `py -m pytest`, `uv run pytest`, `poetry run pytest`).
- [x] Triển khai hàm chuẩn hoá và nhận diện Python test command tương đương trong `src/core/workflow/command-match.ts` (GREEN cho `ac-1`).
- [x] Bổ sung cơ chế phát hiện và thông báo gợi ý lệnh thay thế khi gặp lỗi ENOENT (lệnh không có trong PATH) trong `src/utils/check-runner.ts` (GREEN cho `ac-2`).
- [x] Tinh chỉnh `src/core/stack/verify-detection.ts` để tối ưu phát hiện môi trường Python.
- [x] Chạy kiểm thử hợp đồng `check-gates` (`pnpm run test:gates`) và toàn bộ suite `check-suite` (`pnpm run test`) để xác nhận pass 100%.

## 2. Thiết kế chi tiết & Tác động tập tin
- `src/core/workflow/command-match.ts`:
  - Mở rộng `equivalentCommand`: Khi gặp lệnh kiểm thử Python (ví dụ bắt đầu bằng `python -m pytest`, `pytest`, `python3 -m pytest`, `py -m pytest`, hoặc có tiền tố `uv run pytest`, `poetry run pytest`), đưa về dạng chuẩn đại diện (ví dụ `py-test` kèm các đối số cờ kiểm thử).
  - Tương tự với `sameCommand` để cho phép `harnix workflow --run-check` thực thi an toàn khi có sự khác biệt giữa `pytest` và `python -m pytest`.
- `src/utils/check-runner.ts`:
  - Khi `execa` / tiến trình spawn ném lỗi `ENOENT`, kiểm tra tên executable: Nếu là `pytest`, bổ sung vào thông báo lỗi hướng dẫn chi tiết: `Gợi ý: pytest không có trong PATH; hãy sử dụng python -m pytest hoặc thêm thư mục Scripts của Python vào PATH`.
- `test/unit/core/workflow/command-match.test.ts`:
  - Kiểm tra đầy đủ các ca tương đương và khác biệt: `pytest`, `python -m pytest`, `python3 -m pytest`, `py -m pytest`, `uv run pytest`, `poetry run pytest`, cờ tham số bổ sung.

## 3. Ánh xạ tiêu chí nghiệm thu và Kiểm chứng
- `ac-1`: Được kiểm chứng qua unit test trong `test/unit/core/workflow/command-match.test.ts` và tích hợp trong `check-gates` / `check-suite`.
- `ac-2`: Được kiểm chứng qua unit test kiểm tra xử lý lỗi runner trong `test/unit/utils/check-runner.test.ts` và `check-gates`.
