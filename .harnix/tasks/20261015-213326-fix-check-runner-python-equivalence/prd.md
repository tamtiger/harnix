# PRD: Nhận diện tương đương lệnh kiểm thử Python và gợi ý runner trong check runner

## 1. Bối cảnh & Vấn đề
- Khi chạy Harnix trong các dự án Python hoặc trên môi trường Windows/CI nơi `pytest` không nằm trực tiếp trong system PATH (chỉ có thể gọi qua `python -m pytest`, `python3 -m pytest`, hoặc `py -m pytest`), lệnh kiểm thử tự động của verify plan mặc định sinh ra `pytest`.
- Khi runner thực thi `pytest`, tiến trình báo lỗi `ENOENT` ("command not found") mà không đưa ra hướng dẫn hay gợi ý xử lý.
- Khi người dùng chủ động đổi lệnh của check sang `python -m pytest`, cổng kiểm tra suite gate (`suite-gate.ts`) từ chối hoàn thành (`--finish`) vì chỉ chấp nhận lệnh khớp tuyệt đối với test command đã phát hiện (`pytest`), do hàm `equivalentCommand` trong `command-match.ts` hiện tại chỉ hỗ trợ nhận diện các package manager của Node.js (`npm`, `pnpm`, `yarn`, `bun`).

## 2. Mục tiêu
- Mở rộng logic đối chiếu lệnh kiểm thử trong `command-match.ts` (`equivalentCommand` và `sameCommand`) để nhận diện tính tương đương giữa `pytest` và các biến thể runner Python: `python -m pytest`, `python3 -m pytest`, `py -m pytest`, cũng như khi chạy qua `uv run pytest` hoặc `poetry run pytest`.
- Cải thiện `detectPythonVerify` trong `verify-detection.ts` để kiểm tra khả năng thực thi và hỗ trợ lệnh phù hợp với môi trường.
- Bổ sung thông báo gợi ý rõ ràng trong `check-runner.ts` khi phát hiện runner phổ biến (như `pytest`) không tìm thấy trong PATH (`ENOENT`).

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
- `ac-1`: `equivalentCommand` và `sameCommand` nhận diện `pytest` tương đương với `python -m pytest`, `python3 -m pytest`, `py -m pytest`, `uv run pytest`, `poetry run pytest`.
- `ac-2`: `detectPythonVerify` và check runner đưa ra gợi ý rõ ràng hoặc giải quyết được khi `pytest` không nằm trong PATH.

## 4. Giới hạn (Non-goals)
- Không can thiệp hoặc thay đổi hành vi của các ecosystem khác (Node, Rust, Go, Gradle...).
- Không làm suy yếu quy tắc bất biến của input digest hay quy trình ghi nhận bằng chứng kiểm chứng.
