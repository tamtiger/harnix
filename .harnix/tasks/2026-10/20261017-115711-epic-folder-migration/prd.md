# PRD: Nhóm Epic vào folder riêng và xây dựng bộ di chuyển dữ liệu tương thích ngược

## 1. Bối cảnh & Vấn đề (Context & Problem)
- Hiện tại, các Epic được lưu dưới dạng file phẳng `.harnix/epics/<epic-id>.json` và `.harnix/epics/<epic-id>.md` ngay dưới thư mục `epics/`.
- Khi số lượng epic tăng lên, thư mục bị phẳng, không thể mở rộng đính kèm các tài liệu bổ trợ (như `spec.md` hay architecture context của epic), đồng thời không đồng nhất với kiến trúc theo folder của Task (`.harnix/tasks/<task-id>/`).
- Cần chuyển đổi lưu trữ Epic sang mô hình folder `.harnix/epics/<epic-id>/epic.json` và `epic.md`, đồng thời xây dựng bộ di chuyển (migration engine) tự động, an toàn và bảo đảm tương thích ngược 100%.

## 2. Ranh giới Triển khai (Boundaries)
- **In-Scope:**
  - Cập nhật `src/core/epics/epic.ts` để ghi và đọc epic từ folder `.harnix/epics/<id>/epic.json` và `epic.md`.
  - Cập nhật `src/core/epics/migrate.ts` để tự động phát hiện các file phẳng cũ và di chuyển an toàn vào folder mới (idempotent, không mất dữ liệu).
  - Bảo đảm cơ chế đọc fallback: nếu folder chưa tồn tại, tự động đọc file phẳng cũ.
  - Viết unit test và migration test toàn diện.
- **Out-of-Scope (Non-goals):**
  - Không thay đổi schema `EpicRecord` v1.
  - Không làm gián đoạn các lệnh CLI công khai (`harnix epic`, `harnix resume --next`).
  - Không ảnh hưởng đến các member tasks hoặc các file task json.

## 3. Tiêu chuẩn Nghiệm thu Định danh (Acceptance Criteria)
- `[ac-1]`: Epic mới được tạo và cập nhật vào thư mục `.harnix/epics/<id>/epic.json` và `.harnix/epics/<id>/epic.md`.
- `[ac-2]`: Module `migrate.ts` tự động chuyển đổi an toàn các file phẳng cũ sang cấu trúc folder mới (idempotent, không mất mát dữ liệu).
- `[ac-3]`: Hệ thống đọc hỗ trợ cơ chế fallback an toàn: ưu tiên đọc folder mới, fallback về file phẳng cũ nếu chưa migrate./

## 4. Ràng buộc Kỹ thuật & Kiến trúc (Constraints)
- Tuân thủ nghiêm ngặt giới hạn < 300 LOC/file trong `src/core/epics/`.
- Sử dụng atomic write (`atomicWriteFile`) và Node path/realpath APIs an toàn, chống traversal.
- Không để lại file rác hoặc phá vỡ các integration tests hiện có.
