# PRD: Sửa task thành viên mà không đổi con trỏ active

## Vấn đề

Để sửa obligation, đường dẫn hoặc ghi chú của một member epic đang `planning` mà không phải task active, phải `pause`, `resume <member>`, sửa, `pause`, `resume <task cũ>`; chuỗi này dễ làm mất hoặc đặt sai con trỏ `.active`.

## Thiết kế

`--task <task-id>` chọn task đích cho sáu lệnh sửa (`--set-check`, `--add-criterion`, `--set-paths`, `--add-decision`, `--add-risk`, `--batch`). Mục tiêu được truyền ngầm qua `AsyncLocalStorage` (`src/core/workflow/target-task.ts`) nên mọi hàm sửa hiện có và `saveWorkflow` dùng chung đường code, mọi luật hiện có (`--reason` sau planning, bất biến, khóa workflow, digest) áp dụng y hệt; con trỏ `.active` không bao giờ bị ghi. Task đích phải tồn tại, id đúng regex task, và chưa `completed`/`cancelled`. `--task` bị từ chối với `--transition`, `--finish`, `--cancel`, `--run-check`, `--evidence` và mọi hành động khác kèm lý do (các hành động đó chỉ chạy trên task active).

## Không thuộc phạm vi

Không sửa task terminal; không cho `--task` ở chuyển trạng thái hoặc finish; không nới luật guarded replan.

## Tiêu chí chấp nhận

### ac-1: Sáu lệnh nhận `--task`

Các lệnh sửa nhận `--task <task-id>` nhắm tới task chưa terminal của cùng project mà không đổi con trỏ active.

**Verifies:** `check-target` cùng `check-suite`.

### ac-2: Từ chối đúng chỗ

`--task` bị từ chối với `--transition`, `--finish`, `--cancel`, `--run-check`, `--evidence`, và với task đã completed hoặc cancelled, kèm lý do.

**Verifies:** `check-target` cùng `check-suite`.

### ac-3: Luật hiện có áp dụng cho task đích

Reason sau planning, bất biến và khóa áp dụng y hệt; test chứng minh `.active` không đổi và task active không bị ghi nhầm.

**Verifies:** `check-target` cùng `check-suite`.

### ac-4: Tài liệu

Reference `epic` của skill `harnix-plan` và template workflow bỏ hướng dẫn pause/resume để sửa member, thay bằng `--task`.

**Verifies:** `check-docs` cùng `check-suite`.
