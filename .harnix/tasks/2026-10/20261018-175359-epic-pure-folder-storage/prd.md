# PRD: Loại bỏ dual-write file phẳng và chuẩn hóa lưu trữ Epic thuần folder

## 1. Bối cảnh & Vấn đề

Trước đây hệ thống Epic duy trì cơ chế ghi kép (dual-write): vừa ghi ra thư mục `.harnix/epics/<id>/epic.json|md`, vừa ghi ra file phẳng ở thư mục cha `.harnix/epics/<id>.json|md`. Cơ chế này gây ra các bất cập:
- Dư thừa file trong kho lưu trữ `.harnix/epics/`.
- Xung đột đường dẫn tương đối (relative links) đến các supporting artifacts như `research.md` và `spec.md`.
- Thiếu nhất quán với thiết kế phân cấp thư mục của Harnix (như `.harnix/tasks/<task-id>/`).
- Chưa có giao thức chuẩn hóa cho subagent báo cáo kết quả hoàn thành task về Lead Agent trong mô hình Multi-Agent Epic.

## 2. Ranh giới & Ràng buộc

- **Ranh giới sản phẩm**: Harnix giữ nguyên kiến trúc 1 package, 1 CLI executable; không thêm background daemon.
- **Tương thích ngược**: Duy trì cơ chế đọc fallback an toàn (`resolveEpicFile`, `listEpicIds`, `migrate.ts`) để đọc được cả thư mục mới và các file phẳng/roadmaps cũ của các project legacy.
- **Test-first**: Cập nhật golden behavior snapshot và bảo đảm toàn bộ test gates pass 100%.

## 3. Yêu cầu kỹ thuật cốt lõi

1. Sửa hàm `upsertEpic` và `renderEpicMarkdown` trong `src/core/epics/epic.ts` để chỉ ghi vào thư mục `.harnix/epics/<id>/`, không ghi ra file phẳng ngoài thư mục cha.
2. Bảo đảm `resolveEpicFile` và `listEpicIds` tiếp tục đọc được cả folder mới và file phẳng cũ.
3. Cập nhật `harnix-plan/SKILL.md` và `scouting-isolation.md` bổ sung hướng dẫn và giao thức báo cáo kết quả subagent cho Epic Multi-Agent.
4. Cập nhật `behavior-snapshot.golden.json` phản ánh đúng việc loại bỏ dual-write file phẳng.
5. Toàn bộ unit tests và test gates pass 100%.

## 4. Rủi ro & Chiến lược giảm thiểu

- **Rủi ro**: Các lệnh `harnix epic` hoặc CLI đọc epic bị lỗi nếu thư mục chứa epic cũ dạng file phẳng.  
  *Giảm thiểu*: `resolveEpicFile` đã có thứ tự ưu tiên: kiểm tra `epic.json` trong folder trước, sau đó fallback tìm file phẳng `.json`, và fallback tìm `roadmaps/`.
