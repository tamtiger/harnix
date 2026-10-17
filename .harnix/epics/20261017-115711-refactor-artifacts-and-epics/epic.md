# Epic: Tái cấu trúc bộ tạo tác Epic, PRD, Plan, Task và Review

Hiện đại hóa toàn diện hệ sinh thái tạo tác của Harnix: nhóm Epic vào folder chuyên biệt (.harnix/epics/<id>/) kèm migration an toàn, đồng bộ hai chiều giữa Plan checklist và Task state, chuẩn hóa PRD theo cấu trúc kỹ thuật 4 khối, và nâng cấp Review thành Dashboard kiểm chứng tích hợp Code Impact.

- **Cập nhật:** 2026-10-17 11:57:11 +07:00

## Non-goals

- Không thay đổi ranh giới 1 package, 1 executable, không thêm background daemon hoặc cloud dependencies.
- Không làm gãy tính tương thích ngược với các task hoặc epic cũ.
- Không vượt quá giới hạn 300 LOC/file trong src/core/tasks/ và src/core/workflow/.

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261017-115711-epic-folder-migration` | Nhóm Epic vào folder riêng và xây dựng bộ di chuyển dữ liệu tương thích ngược | `full` | `completed` |
| 2 | `20261017-115712-prd-and-plan-templates` | Chuẩn hóa cấu trúc 4 khối kỹ thuật cho PRD và mô hình Execution Slices cho Plan | `full` | `completed` |
| 3 | `20261017-115713-plan-task-sync` | Xây dựng cơ chế tự động đồng bộ hai chiều giữa Plan checklist và Task state | `full` | `completed` |
| 4 | `20261017-115714-review-code-impact` | Nâng cấp báo cáo Review thành Dashboard kiểm chứng tích hợp Code Impact | `full` | `completed` |

## Task Overview & Scope

### 1. `20261017-115711-epic-folder-migration` — Nhóm Epic vào folder riêng và xây dựng bộ di chuyển dữ liệu tương thích ngược

- **Trạng thái:** `completed`
- **Mục tiêu:** Chuyển đổi lưu trữ Epic từ file phẳng sang folder .harnix/epics/<id>/epic.json và epic.md; cập nhật src/core/epics/migrate.ts và epic.ts để tự động di chuyển idempotent và duy trì đọc fallback 100%.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261017-115712-prd-and-plan-templates` — Chuẩn hóa cấu trúc 4 khối kỹ thuật cho PRD và mô hình Execution Slices cho Plan

- **Trạng thái:** `completed`
- **Mục tiêu:** Cập nhật template khởi tạo và cơ chế validation tại ready gate cho PRD (Context, Boundaries, Anchored AC, Constraints) và Plan (TDD Slices với tag [chk-id]); cập nhật ready-artifacts.ts và init-spec.ts.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261017-115713-plan-task-sync` — Xây dựng cơ chế tự động đồng bộ hai chiều giữa Plan checklist và Task state

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi một validation check pass qua lệnh --run-check hoặc --evidence, harness tự động tìm checklist item có tag [chk-id] trong plan.md và chuyển thành [x] [chk-id]; ngăn chặn triệt để tình trạng lệch pha state.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261017-115714-review-code-impact` — Nâng cấp báo cáo Review thành Dashboard kiểm chứng tích hợp Code Impact

- **Trạng thái:** `completed`
- **Mục tiêu:** Bổ sung mục Code Impact (danh sách file thêm/sửa/xóa và số dòng thay đổi) vào review.md; tái cấu trúc Verification Matrix trực quan và thu gọn output log evidence thô trong src/core/tasks/task-review.ts.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
