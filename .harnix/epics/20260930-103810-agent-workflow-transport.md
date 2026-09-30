# Epic: Agent chạy trọn workflow bằng CLI, không cần script tạm

Loại bỏ nhu cầu agent (đặc biệt trên Kiro/Windows PowerShell) tự viết script .ps1/.json để cập nhật task: sửa suite gate và input digest cho monorepo, bổ sung transport CLI cho evidence/criterion/output gọn/chạy check, và viết lại hướng dẫn skill/template cho đúng với CLI cuối cùng.

- **Cập nhật:** 2026-09-30 10:38:10 +07:00

## Non-goals

- Không thêm flag --json hay chế độ human-summary
- Không thêm --file cho --save/--evidence (khuyến khích file tạm)
- Không đổi TaskRecord schema v3 hay dữ liệu .harnix hiện có
- Không thêm nền tảng hay package thứ hai

## Next task

Không còn task nào chưa hoàn tất.

## Members (3 tasks)

| # | Task ID | Title | Status |
|---|---------|-------|--------|
| 1 | `20260930-103811-fix-suite-gate-and-input-digest` | Sửa suite gate và input digest cho monorepo | `completed` |
| 2 | `20260930-103812-workflow-cli-transports` | Bổ sung transport CLI cho evidence, criterion và chạy check | `completed` |
| 3 | `20260930-103813-agent-guidance-cookbook` | Viết lại hướng dẫn skill và template cho agent | `completed` |

## Task Overview & Scope

### 1. `20260930-103811-fix-suite-gate-and-input-digest` — Sửa suite gate và input digest cho monorepo

- **Trạng thái:** `completed`
- **Mục tiêu:** Suite gate chấp nhận check bao phủ source+test theo layout monorepo/.NET mà không ép inputs `**`; finish gate dùng pass mới nhất; input digest bỏ qua thư mục build tạm theo tín hiệu, không loại source thật, ổn định và nhanh.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 2. `20260930-103812-workflow-cli-transports` — Bổ sung transport CLI cho evidence, criterion và chạy check

- **Trạng thái:** `completed`
- **Mục tiêu:** Agent hoàn tất evidence, đánh dấu criterion `met`, migrate task legacy lên v3, chạy và ghi check chỉ bằng lệnh `harnix workflow`, với id/recordedAt/digest do CLI tự điền và output gọn tuỳ chọn.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 3. `20260930-103813-agent-guidance-cookbook` — Viết lại hướng dẫn skill và template cho agent

- **Trạng thái:** `completed`
- **Mục tiêu:** Skill, `.harnix/workflow.md` và steering (Kiro/Antigravity/Claude/Codex) chỉ rõ cách dùng đúng CLI cuối cùng trên PowerShell và bash, cấm script tạm, bắt dùng clock, giải thích digest.
- **Tiêu chí nghiệm thu:** 5 tiêu chí
