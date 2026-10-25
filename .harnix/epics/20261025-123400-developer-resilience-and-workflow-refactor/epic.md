# Epic: Nâng Cao Độ Vững Chắc Trải Nghiệm Phát Triển (DX) và Tinh Gọn Workflow Harnix

Giải quyết triệt để 7 vấn đề thực chiến phản ánh từ người dùng và tinh gọn workflow: (1) Chỉ dẫn factsHint rõ ràng khi projectFactsStale và kiểm soát gợi ý epic cũ trong preflight; (2) Chống báo lỗi nhầm khi exitCode 0 (output PRINT SQL Server) và chuẩn hóa xử lý CRLF/LF trên Windows; (3) Cưỡng chế quy tắc Git safety kiểm tra nhánh trước commit và hoàn thiện Guarded Replanning; (4) Lọc nhiễu learning tự sinh và hỗ trợ thao tác hàng loạt; (5) Tái cấu trúc tinh gọn workflow.md thành Lean Operational Cheat Sheet giảm 60% token footprint.

- **Cập nhật:** 2026-10-25 12:53:07 +07:00

## Non-goals

- Không phá vỡ định dạng TaskRecord schema v3 đóng băng
- Không làm giảm tính toàn vẹn của state machine

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261025-123540-preflight-facts-hint-and-epic-context-quieting` | Chi dan factsHint khi facts stale va kiem soat goi y epic cu trong preflight | `lite` | `completed` |
| 2 | `20261025-125308-harness-output-tolerance-and-crlf-handling` | Chong bao loi nham exitCode 0 va chuan hoa CRLF Windows | `lite` | `completed` |
| 3 | `20261025-125309-git-branch-safety-rules-and-guarded-criteria-docs` | Cuong che quy tac kiem tra nhanh truoc commit va hoan thien Guarded Replanning | `lite` | `completed` |
| 4 | `20261025-125310-learning-noise-filtering-and-bulk-management` | Loc nhieu learning tu sinh va them lenh quan tri hang loat | `lite` | `completed` |
| 5 | `20261025-125311-refactor-lean-workflow-cheat-sheet` | Tai cau truc tinh gon workflow.md thanh Lean Operational Cheat Sheet | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261025-123540-preflight-facts-hint-and-epic-context-quieting` — Chi dan factsHint khi facts stale va kiem soat goi y epic cu trong preflight

- **Trạng thái:** `completed`
- **Mục tiêu:** Chi dan factsHint khi facts stale va kiem soat goi y epic cu trong preflight
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261025-125308-harness-output-tolerance-and-crlf-handling` — Chong bao loi nham exitCode 0 va chuan hoa CRLF Windows

- **Trạng thái:** `completed`
- **Mục tiêu:** Xu ly check-output khong bao launcherFailure khi exitCode 0 va bo sung huong dan CRLF git
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 3. `20261025-125309-git-branch-safety-rules-and-guarded-criteria-docs` — Cuong che quy tac kiem tra nhanh truoc commit va hoan thien Guarded Replanning

- **Trạng thái:** `completed`
- **Mục tiêu:** Them quy tac bat buoc kiem tra git branch --show-current truoc commit, cam pipe git checkout va hoan thien huong dan Guarded Replanning
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 4. `20261025-125310-learning-noise-filtering-and-bulk-management` — Loc nhieu learning tu sinh va them lenh quan tri hang loat

- **Trạng thái:** `completed`
- **Mục tiêu:** Nang cap bo loc learning loai bo observation rac va bo sung thao tac hang loat cho CLI learning
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 5. `20261025-125311-refactor-lean-workflow-cheat-sheet` — Tai cau truc tinh gon workflow.md thanh Lean Operational Cheat Sheet

- **Trạng thái:** `completed`
- **Mục tiêu:** Toi uu hoa workflow.md giam 60% token footprint va chuyen ly thuyet vao references
- **Tiêu chí nghiệm thu:** 3 tiêu chí
