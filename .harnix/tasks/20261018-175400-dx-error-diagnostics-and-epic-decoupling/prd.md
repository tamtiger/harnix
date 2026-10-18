# PRD: Chẩn đoán lỗi validation chi tiết, tối ưu hóa DX vận hành và đóng Epic

## 1. Bối cảnh & Vấn đề

Trong quá trình thực hiện Epic trên thực tế phát sinh các rào cản DX khiến Coding Agent và người dùng gặp khó khăn:
1. `assertIdentity` trong `task-validate.ts` báo lỗi gộp *"Task identity, mode, status, or checkpoint is invalid"* không chỉ rõ trường nào bị sai.
2. `obligationsChanged` trong `obligations.ts` coi `cwd: "."` và `cwd: undefined` là khác nhau, gây báo lỗi giả về thay đổi hợp đồng đóng băng.
3. Chuyển trạng thái từ checkpoint `replan` bị lỗi mà không gợi ý cú pháp chuẩn `ready/ready --reviewed`.
4. `harnix resume` chưa hỗ trợ cờ `--brief` gây tốn token khi khôi phục task.
5. `workflow --criterion` chỉ xử lý token đầu tiên khi truyền chuỗi phân tách dấu phẩy (`ac-1,ac-2`).
6. Các tài liệu hướng dẫn (AGENTS.md, activation.ts, workflow templates, skills, README.md) cần được đồng bộ toàn diện và hoàn tất đóng Epic (fold dev changelog).

## 2. Ranh giới & Ràng buộc

- **Ranh giới sản phẩm**: 1 package, 1 CLI executable; không thêm background daemon hay service.
- **Tính tương thích**: Không nới lỏng schema TaskRecord v3.
- **Đóng Epic**: Thực hiện fold changelog dev `2.11.0-dev.N` thành bản phát hành `2.11.0` theo đúng version policy.

## 3. Yêu cầu kỹ thuật cốt lõi

1. Tách biệt `assertIdentity` thành 4 assertion cụ thể: `id`, `mode`, `status`, `checkpoint` kèm danh sách giá trị hợp lệ.
2. Chuẩn hóa `cwd` trong `obligations.ts` (`normalizeCheckCwd` hoặc coi `.` tương đương undefined).
3. Hướng dẫn trực tiếp cú pháp lệnh chuyển trạng thái hợp lệ khi ở `replan`.
4. Bổ sung cờ `--brief` cho lệnh `harnix resume`.
5. Cho phép `--criterion` xử lý danh sách ID phân tách bằng dấu phẩy.
6. Đồng bộ toàn bộ tài liệu hướng dẫn và chạy `pnpm version:sync 2.11.0 --summary "..." --fold-dev`.
7. Toàn bộ test suite và test gates pass 100%.
