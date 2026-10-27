# PRD - [16] Repo-map hướng test-impact

## Bối cảnh và vấn đề

Harnix trước đây cung cấp lệnh `repo-map --query` và `repo-map --impact`. Theo dữ liệu audit dogfooding, `repo-map --query` được dùng 0 lần, trong khi agent rất cần một cơ chế nhanh để biết "file code vừa sửa ảnh hưởng tới test nào" (test-impact hint) để chạy test bị ảnh hưởng trước (vòng phản hồi nhanh TDD) rồi mới chạy toàn bộ test suite của package. Nghiên cứu bên ngoài (research/external-research.md) xác nhận rằng gợi ý test-impact là một trong hai kỹ thuật có giá trị thực tiễn đo được cao nhất đối với coding agent.

## Mục tiêu

1. Mở rộng trích xuất và đồ thị phụ thuộc để nhận diện test file đa ngôn ngữ (TS, Python, Go) và thiết lập cạnh quan hệ giữa code và test theo cả import lẫn quy ước đặt tên (naming conventions).
2. Bổ sung tùy chọn `harnix repo-map --tests <path>` (hỗ trợ `--limit <count>`), trả danh sách test bị ảnh hưởng của một file code cụ thể dưới dạng JSON chuẩn.
3. Loại bỏ ranker v1 không dùng khỏi `src/core/repo-map/search.ts` và `types.ts`, đơn giản hóa logic xếp hạng lexical+graph, giảm độ phức tạp cyclomatic để gỡ miễn trừ ESLint.
4. Cập nhật các skill (`harnix-implement`, `harnix-verify`) để hướng dẫn agent tìm và chạy test bị ảnh hưởng trước khi chạy toàn bộ test suite.
5. Cập nhật đồng bộ các tài liệu PRD, WORKFLOW, IMPLEMENTATION_PLAN và README cho các thay đổi contract của task này.

## Acceptance Criteria

- **ac-tests-edge**: `repo-map --tests <path>` trả đúng các test file bị ảnh hưởng trên fixture TS, Python, Go (theo import trực tiếp/gián tiếp và quy ước đặt tên cùng thư mục/mirrored directory).
  **Verifies:** `check-tests-edge`

- **ac-skill-use**: Skill `harnix-implement` và `harnix-verify` hướng dẫn rõ ràng việc dùng `harnix repo-map --tests <path>` để chạy test bị ảnh hưởng trước, sau đó mới chạy package suite.
  **Verifies:** `check-skill-use`

- **ac-docs-sync**: Các tài liệu PRD, WORKFLOW, IMPLEMENTATION_PLAN, README và ESLint config được cập nhật đồng bộ trong cùng task cho mọi contract thay đổi (loại bỏ ranker v1, thêm `--tests`, xóa module khỏi complexity exemption).
  **Verifies:** `check-docs-sync` và `check-suite`

## Non-goals

- Không thay thế suite gate: test-impact chỉ là gợi ý phản hồi nhanh trong quá trình code, suite gate ở cấp project vẫn bắt buộc khi verify.
- Không tự động commit, tạo nhánh hay push Git.
- Không sửa cấu hình user-global thật trong test.
- Không làm thay đổi định dạng cache `.harnix/cache/repo-map-v1.json` gây mất tương thích ngược.

## Rủi ro và giảm thiểu

- Quy ước đặt tên test có thể có trường hợp trùng lặp tên file giữa các package: giới hạn ưu tiên cùng thư mục hoặc cấu trúc đường dẫn tương ứng (mirrored path), sắp xếp code-unit deterministic.
- Loại bỏ ranker v1 không được làm hỏng kết quả tìm kiếm mặc định của `repo-map --query`: giữ nguyên ranker v2 với các trọng số graph signals đã kiểm chứng.
