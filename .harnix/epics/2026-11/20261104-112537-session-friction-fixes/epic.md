# Epic: Sửa các ma sát gặp khi chạy harnix trong phiên làm việc

Xử lý các ma sát đã gặp khi dùng Harnix: lỗi thiếu hint (--transition sai thứ tự, --finish sai checkpoint, thiếu task active), thiếu builder task completed trong test, doctor phát finding journal lặp hàng chục dòng, quy ước task đóng epic còn theo ID thay vì thứ tự epic; kèm một task research số đo token của skills và references trước khi quyết định giảm.

- **Cập nhật:** 2026-11-04 11:44:43 +07:00

## Non-goals

- Không đổi hợp đồng đóng băng của Doctor JSON v2 (mã, severity, path, exit code).
- Không sửa hay viết lại journal lịch sử.

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261104-113030-skills-token-research` | Đo và research tối ưu token của skills và references | `lite` | `completed` |
| 2 | `20261104-112538-transition-status-hint` | Lỗi transition, finish và thiếu task active có hint nêu lệnh đúng | `lite` | `completed` |
| 3 | `20261104-112539-completed-task-builder` | Thêm builder task completed hợp lệ cho test | `lite` | `completed` |
| 4 | `20261104-114422-epic-closer-by-order` | Quy ước task đóng epic là task cuối theo thứ tự epic | `lite` | `completed` |
| 5 | `20261104-112540-doctor-journal-finding-dedupe` | Doctor gộp finding journal lặp theo file | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261104-113030-skills-token-research` — Đo và research tối ưu token của skills và references

- **Trạng thái:** `completed`
- **Mục tiêu:** Người dùng xác định tối ưu token của skills và references là phần quan trọng (không phải dung lượng setup), nhưng chưa có số đo; đo token nạp thực tế của 14 SKILL.md, các reference và khối luôn nạp, rồi đề xuất cách giảm. Task này chỉ research, không sửa code.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 2. `20261104-112538-transition-status-hint` — Lỗi transition, finish và thiếu task active có hint nêu lệnh đúng

- **Trạng thái:** `completed`
- **Mục tiêu:** Gõ nhầm --transition finishing/finishing, gọi --finish sai checkpoint hoặc chạy lệnh khi chưa có task active chỉ nhận message mà không có hint nêu lệnh đúng, trái hợp đồng lỗi CLI luôn có hint nêu lệnh đã sửa.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 3. `20261104-112539-completed-task-builder` — Thêm builder task completed hợp lệ cho test

- **Trạng thái:** `completed`
- **Mục tiêu:** Dựng task completed hợp lệ trong test cần completedAt, tiêu chí met kèm evidence và checkpoint finishing; thiếu builder nên phải thử sai nhiều lần (lỗi 'Completed task is missing completion requirements').
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 4. `20261104-114422-epic-closer-by-order` — Quy ước task đóng epic là task cuối theo thứ tự epic

- **Trạng thái:** `completed`
- **Mục tiêu:** AGENTS.md, skill harnix-implement, reference gates của harnix-verify và template workflow.md đang ghi 'the last member by ID closes the epic', trong khi ID chỉ là nhãn tạo sau và thứ tự epic (--epic-order) mới là kế hoạch thật; đổi quy ước thành task cuối theo thứ tự epic đóng epic.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 5. `20261104-112540-doctor-journal-finding-dedupe` — Doctor gộp finding journal lặp theo file

- **Trạng thái:** `completed`
- **Mục tiêu:** Doctor phát một finding cho mỗi dòng journal nên một file có thể sinh hàng chục dòng giống hệt nhau (13 journal-task-unlinked cho ba file); gộp theo (mã, file) kèm số bản ghi để báo cáo gọn mà không mất thông tin.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

## Supporting Artifacts

- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.
