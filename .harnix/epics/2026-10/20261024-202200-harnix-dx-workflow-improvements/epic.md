# Epic: Cải tiến Toàn diện Trải nghiệm Phát triển, Linh hoạt Hóa Quy trình Task và Nâng cao Độ vững chắc CLI Harnix

Giải quyết triệt để 7 nhóm vấn đề thực tế: (1) Cơ chế Guarded Replanning cho phép sửa/waive tiêu chí và replace check sau khi pass tại checkpoint replan; (2) Thông báo lỗi criterion coverage giàu ngữ cảnh và lệnh harnix status --criteria; (3) Hỗ trợ lệnh workflow --tick cho plan.md và đồng bộ ví dụ schema; (4) Quy ước file tạm kiểm thử, hướng dẫn an toàn shell Windows và Git safety.

- **Cập nhật:** 2026-10-24 21:24:00 +07:00

## Non-goals

- Không phá vỡ định dạng TaskRecord schema v3 đóng băng
- Không nới lỏng an toàn ngoài checkpoint replan có giải trình hợp lệ

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261024-202201-guarded-replanning-proven-obligations` | Guarded Replanning cho Phép Sửa/Waive Tiêu chí và Thay Thế Check Đã Pass tại Checkpoint Replan | `lite` | `completed` |
| 2 | `20261024-202202-criterion-diagnostics-and-status-criteria` | Cải tiến Chẩn đoán Lỗi Criterion Coverage, Lệnh harnix status --criteria và Tối ưu CLI Ergonomics | `lite` | `completed` |
| 3 | `20261024-202203-plan-checklist-management-and-schema-examples` | Lệnh harnix workflow --tick cho plan.md, Đồng bộ Schema Examples và Chốt chặn Checklist | `lite` | `completed` |
| 4 | `20261024-202204-shell-guidelines-scratch-dir-and-git-safety` | Quy ước File Tạm Kiểm thử, Hướng dẫn An toàn Shell Windows và Git Safety Rules | `lite` | `completed` |
| 5 | `20261024-202205-circuit-breaker-ergonomics-and-replan-transition` | Cải tiến Circuit Breaker Ergonomics, Chuyển Trạng Thái Replan Trực Tiếp và Cảnh Báo Input Glob | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261024-202201-guarded-replanning-proven-obligations` — Guarded Replanning cho Phép Sửa/Waive Tiêu chí và Thay Thế Check Đã Pass tại Checkpoint Replan

- **Trạng thái:** `completed`
- **Mục tiêu:** Cho phép sửa text, waive tiêu chí acceptance criteria và replace check đã pass tại checkpoint replan kèm --reason hợp lệ; tự động invalidate evidence pass cũ và reset trạng thái criteria liên quan về pending.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261024-202202-criterion-diagnostics-and-status-criteria` — Cải tiến Chẩn đoán Lỗi Criterion Coverage, Lệnh harnix status --criteria và Tối ưu CLI Ergonomics

- **Trạng thái:** `completed`
- **Mục tiêu:** Giải quyết Vấn đề 2, 5 & các cọ xát thực tế khi phát triển: (1) Nâng cấp thông báo lỗi criterion coverage trong --init và validation để chỉ rõ check id, criterion id chưa phủ và gợi ý cú pháp lệnh khắc phục; (2) Thêm cờ --criteria cho lệnh harnix status để in danh sách tóm tắt id, trạng thái và nội dung tiêu chí lean-token; (3) Khắc phục lỗi false positive của launcherFailure trong check-output.ts khi output chứa kết quả chạy test con; (4) Tự động sort và deduplicate inputs/criteria trong init và validation transports.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261024-202203-plan-checklist-management-and-schema-examples` — Lệnh harnix workflow --tick cho plan.md, Đồng bộ Schema Examples và Chốt chặn Checklist

- **Trạng thái:** `completed`
- **Mục tiêu:** Giải quyết Vấn đề 3 & 4: (1) Bổ sung lệnh workflow --tick <index|pattern|all> để đánh dấu hoàn thành [x] trong plan.md an toàn; (2) Chuyển advisory warning checklist plan.md thành strict gate khi chuyển sang verifying; (3) Bổ sung decisions và residualRisks vào nested schema cùng ví dụ envelope tối thiểu.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261024-202204-shell-guidelines-scratch-dir-and-git-safety` — Quy ước File Tạm Kiểm thử, Hướng dẫn An toàn Shell Windows và Git Safety Rules

- **Trạng thái:** `completed`
- **Mục tiêu:** Giải quyết Vấn đề 6, 7 & Git Safety: (1) Chuẩn hóa thư mục scratch .harnix/tmp/ cho kiểm thử và scripts phụ trợ; (2) Hướng dẫn an toàn shell Windows và khuyến nghị --file cho UTF-8; (3) Bổ sung quy tắc Git safety trong AGENTS.md (kiểm tra branch trước commit, cấm pipe checkout); (4) Tối ưu hóa hook ngữ cảnh tránh lặp guides không cần thiết.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 5. `20261024-202205-circuit-breaker-ergonomics-and-replan-transition` — Cải tiến Circuit Breaker Ergonomics, Chuyển Trạng Thái Replan Trực Tiếp và Cảnh Báo Input Glob

- **Trạng thái:** `completed`
- **Mục tiêu:** Giải quyết 3 vấn đề cọ xát phát sinh trong quá trình thực chiến: (1) Nâng cấp Circuit Breaker của --run-check cho phép reset và chạy lại khi có thay đổi code/digest hoặc dùng cờ --reset-breaker <id> --reason <why> thay vì bắt buộc rename check; (2) Cho phép chuyển trạng thái trực tiếp từ checkpoint replan về in_progress/implementing khi task vốn đang in_progress; (3) Kiểm tra và cảnh báo sớm khi input glob cố định không khớp file nào trong repository.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
