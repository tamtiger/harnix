# Tài liệu Nghiên cứu Kỹ thuật (Research) — Tái cấu trúc Bộ Tạo tác Harnix

**Mã Epic:** `20261017-115711-refactor-artifacts-and-epics`  
**Ngày thực hiện:** 2026-10-17  
**Mục tiêu:** Khảo sát các mô hình coding agent harness và orchestrator mã nguồn mở hàng đầu trên GitHub để chọn lọc và áp dụng các tính năng tốt nhất vào Harnix:
1. Nhóm Epic thành thư mục chuyên biệt (`.harnix/epics/<id>/`) kèm bộ di chuyển dữ liệu tương thích ngược.
2. Chuẩn hóa PRD theo 4 khối kỹ thuật cô đọng và Plan theo mô hình Execution Slices.
3. Cơ chế tự động đồng bộ hai chiều (Two-Way Sync) giữa checklist trong `plan.md` và kết quả kiểm thử của task.
4. Dashboard Code Impact trong báo cáo `review.md`.

---

## 1. Khảo sát Thực trạng & Phân tích Nguồn Tham chiếu

### 1.1. GitHub Spec Kit & Anthropic Task Decomposition
- **Nguồn:** `github/spec-kit`, `anthropics/anthropic-quickstarts`
- **Thực trạng giải quyết:** Trong Harnix trước đây, PRD và Plan tự do khiến agent dễ bị prompt bloat, viết lan man, thiếu ranh giới kỹ thuật rõ ràng hoặc bỏ sót các phân tích rủi ro/kế hoạch rollback.
- **Mẫu thiết kế áp dụng:** Chuẩn hóa PRD thành 4 khối kỹ thuật:
  1. *Bối cảnh & Vấn đề (Context & Problem Statement)*
  2. *Ranh giới & Ràng buộc (Boundaries & Constraints)*: Nêu rõ non-goals, bất biến bảo vệ.
  3. *Yêu cầu Kỹ thuật Cốt lõi (Core Technical Requirements)*: Đặc tả hợp đồng API/schema, trạng thái chuyển đổi.
  4. *Rủi ro & Chiến lược Giảm thiểu (Risks & Mitigation Strategies)*: Đánh giá bảo mật, hiệu năng, kế hoạch rollback.
- **Áp dụng vào Harnix:** CLI tự động sinh sẵn khung template 4 khối khi chạy `workflow --init --mode full`, và bộ kiểm tra `ready-content.ts` xác thực sự hiện diện của 4 khối này trước khi cho phép vào `ready`.

### 1.2. Roo-Code & Cline (Task Boomerang & Checklists Auto-Sync)
- **Nguồn:** `RooVetGit/Roo-Code`, `cline/cline`
- **Thực trạng giải quyết:** Agent thường xuyên quên tick `- [ ]` thành `- [x]` trong `plan.md` sau khi pass test, hoặc tick bừa tạo ảo giác tiến độ (hallucination).
- **Mẫu thiết kế áp dụng:**
  - Kế hoạch thực thi chia nhỏ theo các lát cắt độc lập (Execution Slices).
  - Mỗi mục checklist gắn với mã định danh kiểm thử: `- [ ] [chk-id] Slice description`.
  - Cơ chế Two-way sync: Khi runner ghi nhận check pass, runner sẽ tự động parse file Markdown và tick `- [x] [chk-id]`.
- **Áp dụng vào Harnix:** Xây dựng module `plan-sync.ts`. Bất cứ khi nào chạy `workflow --run-check` hoặc `workflow --evidence` có kết quả pass, hệ thống tự động tìm và cập nhật các mục checklist tương ứng trong `plan.md`.

### 1.3. OpenDevin (All-Hands) & Trellis (Epic Hierarchical Storage)
- **Nguồn:** `All-Hands-AI/OpenDevin`, `mindfold-ai/Trellis`
- **Thực trạng giải quyết:** Cấu trúc flat file `.harnix/epics/<id>.json` và `.harnix/epics/<id>.md` làm thư mục bị quá tải khi dự án phát triển lâu dài, không thể lưu các tài liệu phụ trợ đi kèm (như `research.md`, sơ đồ kiến trúc, tài liệu đặc tả riêng của epic).
- **Mẫu thiết kế áp dụng:** Lưu trữ mỗi Epic trong một thư mục chuyên biệt: `.harnix/epics/<epic-id>/`.
  - `epic.json`: Task-owned record.
  - `epic.md`: Derived Markdown view tự động sinh.
  - `research.md`: Tài liệu khảo sát kiến trúc độc lập cho Epic.
  - Hỗ trợ di chuyển dữ liệu idempotent: tự động nhận diện và di chuyển các file cũ, duy trì cơ chế đọc fallback để không làm gãy các công cụ bên ngoài.
- **Áp dụng vào Harnix:** Nâng cấp `epic.ts` và tạo `migrate.ts` để dual-write và fallback đọc an toàn 100%.

### 1.4. Aider (Code Impact Summary)
- **Nguồn:** `paulgauthier/aider`
- **Thực trạng giải quyết:** Báo cáo review trước đây chỉ có danh sách file và bằng chứng kiểm thử, thiếu cái nhìn trực quan về quy mô mã nguồn thay đổi.
- **Mẫu thiết kế áp dụng:** Bảng thống kê Code Impact: đường dẫn file, trạng thái (`modified`, `added`, `deleted`), số dòng thêm (`+`), số dòng bớt (`-`).
- **Áp dụng vào Harnix:** Nâng cấp `task-review.ts` để hiển thị phần `## Code impact` trong `review.md`.

---

## 2. Ma trận Quyết định Kỹ thuật

| Khái niệm khảo sát | Nguồn tham chiếu | Quyết định | Module triển khai | Giá trị mang lại |
|---|---|---|---|---|
| **Thư mục Epic riêng biệt** | OpenDevin, Trellis | `adopt` | `src/core/epics/epic.ts`, `migrate.ts` | Khả năng mở rộng cao, cấu trúc gọn gàng, tương thích ngược 100% |
| **PRD 4 Khối Kỹ thuật** | GitHub Spec Kit | `adopt` | `src/core/workflow/artifact-templates.ts`, `ready-content.ts` | Ranh giới kỹ thuật rõ ràng, không lan man, kiểm soát rủi ro từ đầu |
| **Plan Execution Slices & Auto-Sync** | Roo-Code / Cline | `adopt` | `src/core/workflow/plan-sync.ts` | Loại bỏ thao tác thủ công, chống ảo giác tiến độ |
| **Code Impact Dashboard** | Aider | `adopt` | `src/core/tasks/task-review.ts` | Đo lường chính xác tác động code diff trước khi commit |

---

## 3. Kết luận
Các giải pháp trên được tích hợp hoàn toàn bằng mã nguồn TypeScript thuần túy, tuân thủ nguyên tắc không runtime network, không daemon nền, bảo đảm tính xác định (determinism) và giữ vững triết lý thiết kế tinh gọn của Harnix.
