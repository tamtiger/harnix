# PRD: Rút ngắn vòng phản hồi implement và verify của Harnix

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)

Trong task `init-with-lint` (2026-11-15), vòng implement đến verify mất nhiều thời gian ở ba chỗ có thể đo và sửa trong Harnix:

- `--run-checks` không báo mỗi check chạy bao lâu, nên không thấy check nào chậm (`pnpm test` có coverage chậm nhất).
- Thứ tự chạy trong cùng scope chỉ theo thứ tự khai báo (`run-checks.ts` chỉ đưa `focused` lên trước), nên một check rẻ khai báo sau một check đắt vẫn chạy sau.
- Input mặc định của check suite là `**`, gồm cả tài liệu, CHANGELOG, README. Sửa tài liệu sau khi suite đã xanh làm bằng chứng suite hết hạn và buộc chạy lại cả suite.

Mục tiêu: giảm thời gian chờ và số lần chạy lại suite không cần thiết, không làm yếu cổng kiểm chứng.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)

- **In-Scope**:
  - Báo thời lượng (`durationMs`) của mỗi check ở `--run-check` và `--run-checks`; evidence ghi field tùy chọn `durationMs` (ac-1).
  - `--run-checks` sắp xếp trong cùng scope theo thời lượng gần nhất, ngắn trước; chưa có thì giữ thứ tự khai báo (ac-2).
  - `workflow --init` thu hẹp input mặc định của check suite khi dự án có cả cây mã nguồn và cây test (ac-3).
  - Đồng bộ schema, golden, tài liệu, template workflow (ac-4).
- **Out-of-Scope (Non-Goals)**:
  - Chạy check song song, cache kết quả giữa task, đổi lệnh test của dự án (bỏ coverage).
  - Đổi thứ tự `focused` trước `full`, hay quy tắc breaker và suite gate.
  - Tự đổi input của task đã tồn tại; giờ chạy vẫn tính theo đồng hồ thực, không thêm timeout mới.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)

- **ac-1**: `--run-check`/`--run-checks` báo `durationMs` mỗi check đã chạy (pass và fail); evidence có field tùy chọn `durationMs`, evidence cũ vẫn hợp lệ.
- **ac-2**: `--run-checks` chạy check ngắn trước trong cùng scope theo thời lượng ghi nhận gần nhất (chưa có thì giữ thứ tự khai báo), focused vẫn trước full, dừng ở check fail đầu tiên.
- **ac-3**: `--init` với dự án có cả cây nguồn và cây test dùng input mặc định là hai cây đó cộng manifest ở gốc; ngược lại giữ `**`; suite gate vẫn chấp nhận.
- **ac-4**: Cờ, field và hành vi mới đồng bộ ở schema, golden, tài liệu và template workflow, trong trần token hiện có.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)

- Tuân thủ AGENTS.md và `.harnix/spec/guides/` (common, typescript): test thất bại trước, validate input ở biên; file trong `src/core/workflow` và `src/core/tasks` dưới 300 dòng code, test dưới 400 dòng.
- `durationMs` là field tùy chọn cộng thêm trên evidence của TaskRecord v3: validator phải nhận cả evidence không có field, từ chối giá trị không phải số hữu hạn không âm, và không đổi digest hay hợp đồng freshness. Thay đổi chạm hợp đồng đóng băng nên cập nhật tài liệu, validator và test cùng lúc.
- Thời lượng đo bằng đồng hồ đơn điệu trong lớp chạy, qua dependency có thể thay trong test; chỉ sắp xếp trong `--run-checks`, không bao giờ làm đổi tập check phải chạy hay quyết định pass/fail.
- Input thu hẹp phải qua `coversSourceAndTest` của suite gate; chỉ thu hẹp khi phát hiện cả cây nguồn và cây test, còn lại giữ `**`. Người dùng vẫn ghi đè bằng `--input`.
- Không in đường dẫn tuyệt đối, secret hay nội dung output của check vào evidence.
- Trần token trong `token-budgets.json` không nâng; `workflow.md` đang gần trần nên chỉ thêm khi còn chỗ.
