# PRD: doctor báo cấu hình packages trong config.yaml lệch so với phát hiện hiện tại

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Báo cáo thực địa trước đó cho thấy `.harnix/config.yaml` chỉ ghi một package dù repo có nhiều dịch vụ, vì mã phát hiện stack cũ sai. Bản sửa chỉ có tác dụng với `harnix init` mới; `harnix update` dùng nguyên `packages` đang có trong config (src/commands/update.ts nhận config có sẵn) và không phát hiện lại, nên người dùng đã init từ trước vẫn giữ config thiếu mà không có cảnh báo nào. Chưa xác minh `harnix update` có ghi lại `packages` hay không: mã hiện không làm vậy.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope:** `harnix doctor` thêm finding mức `info` mã `config-packages-drift` khi phát hiện hiện tại có thư mục package mà `packages` trong config.yaml không có; nêu tối đa 10 đường dẫn và cách xử lý (rà soát rồi sửa config.yaml hay chạy lại init); test; README và PRD.
- **Out-of-Scope (Non-Goals):** không tự ghi lại config.yaml (config là user-owned), không đổi `harnix update`, không làm doctor đổi mã thoát mặc định (finding `info` không làm `ok` thành false), không đổi schema doctor JSON v2.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1**: Khi phát hiện hiện tại tìm thấy thư mục package không có trong `packages` của config.yaml, doctor thêm một finding `config-packages-drift` mức `info` kèm tối đa 10 đường dẫn tương đối POSIX đã sắp xếp và hướng xử lý; khi đủ package hay không có package thì không có finding.
- **ac-2**: Finding `info` không đổi `ok`, `summary.errors`/`warnings` hay mã thoát; việc phát hiện lỗi (thư mục không đọc được) bị bỏ qua êm, không làm doctor lỗi; doctor vẫn chỉ đọc, không ghi config.
- **ac-3**: Toàn bộ test suite, lint, typecheck và `test:gates` pass; README và PRD mô tả finding.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Dùng lại bộ phát hiện đã có ở `src/core/stack/` (cùng hàm mà init dùng), không viết bộ phát hiện thứ hai; chi phí quét bị giới hạn như init.
- Finding theo cấu trúc `finding(...)` hiện có trong `src/core/doctor/findings.ts`; không đường dẫn tuyệt đối trong đầu ra.
- Rủi ro: doctor chậm hơn trên repo lớn; giảm thiểu bằng cùng giới hạn quét của init và bỏ qua khi lỗi.
- Tuân thủ AGENTS.md và các guide trong .harnix/spec/guides/.
