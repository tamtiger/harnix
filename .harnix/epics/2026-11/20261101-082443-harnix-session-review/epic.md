# Epic: Khắc phục lỗi harnix tổng hợp từ review 20 session

Sửa và refactor các lỗi Harnix còn tồn tại, tổng hợp từ 20 session gần đây và review code HEAD v2.23.5, theo thứ tự toàn vẹn workflow, hint CLI, nhiễu, global, test, tài liệu, cookbook.

- **Cập nhật:** 2026-11-01 08:24:43 +07:00

## Non-goals

- Không thêm platform, package hay bề mặt tương thích mới.
- Không đổi frozen schema ngoài phạm vi đã cập nhật tài liệu.

## Next task

- `20261101-082445-run-check-command-gate` — Chặn --run-check ghi pass khi check không khai command và làm save epic idempotent (`planning`)

## Members (8 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261101-082445-run-check-command-gate` | Chặn --run-check ghi pass khi check không khai command và làm save epic idempotent | `full` | `planning` |
| 2 | `20261101-082446-cli-error-hints` | Mọi lỗi CLI hay gặp đều có hint nêu lệnh đúng | `full` | `planning` |
| 3 | `20261101-082447-status-epic-learning-noise` | Giảm nhiễu status/resume theo epic cũ và learning draft | `lite` | `planning` |
| 4 | `20261101-082448-context-hook-dedup` | Hook context dedup bền theo session và an toàn khi chạy song song | `full` | `planning` |
| 5 | `20261101-082449-global-setup-hardening` | Siết setup global: notice không bị nuốt, hook Codex cũ, an toàn symlink | `full` | `planning` |
| 6 | `20261101-082450-test-stability` | Ổn định test song song và cô lập mock | `lite` | `planning` |
| 7 | `20261101-082451-docs-contract-sync` | Đồng bộ PRD, WORKFLOW, PLAN và README với hợp đồng thật | `lite` | `planning` |
| 8 | `20261101-082452-cookbook-skill-guidance` | Bổ sung cookbook và skill cho các lệnh hay bị gọi sai | `lite` | `planning` |

## Task Overview & Scope

### 1. `20261101-082445-run-check-command-gate` — Chặn --run-check ghi pass khi check không khai command và làm save epic idempotent

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng khe hở A5/R1 (check không khai `command` vẫn nhận argv bất kỳ) và R7 (save epic lỗi giữa chừng để lại trạng thái dở).
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261101-082446-cli-error-hints` — Mọi lỗi CLI hay gặp đều có hint nêu lệnh đúng

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng nhóm B1/H1–H8,H12,H15: lỗi chỉ có `message`, cờ giá trị bắt buộc nuốt token kế tiếp, lệnh/option lạ không có hint, id epic không liệt kê id hợp lệ.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261101-082447-status-epic-learning-noise` — Giảm nhiễu status/resume theo epic cũ và learning draft

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng D2/H10/H11/D4: `status` và `resume --next` quét epic cũ nhất, epic hỏng làm dừng im lặng, thứ tự epic theo ID, draft learning chỉ mô tả code.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261101-082448-context-hook-dedup` — Hook context dedup bền theo session và an toàn khi chạy song song

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng D1/R2/R3/R11: một slot cache chung cho nhiều session, mất con trỏ sau compact, cắt giữa cặp surrogate.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 5. `20261101-082449-global-setup-hardening` — Siết setup global: notice không bị nuốt, hook Codex cũ, an toàn symlink

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng R4–R10 của review global và S1/S2: notice bị nuốt khi thiếu launcher, thiếu migrate hooks.json Codex, mã `test-*-required` phát khi có VITEST, symlink dotfile, đọc symlink ngoài root.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 6. `20261101-082450-test-stability` — Ổn định test song song và cô lập mock

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng B7/E2: test 6 writer chập chờn khi tải cao, `isolate: false` không ép `restoreMocks`.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 7. `20261101-082451-docs-contract-sync` — Đồng bộ PRD, WORKFLOW, PLAN và README với hợp đồng thật

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng E5/E6/R1/R3/R4/R5/R10: tài liệu frozen lệch code về envelope lỗi của hidden workflow, breaker, tiêu chí bất biến và cờ `status`.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 8. `20261101-082452-cookbook-skill-guidance` — Bổ sung cookbook và skill cho các lệnh hay bị gọi sai

- **Trạng thái:** `planning`
- **Mục tiêu:** Đóng B1/C1/C3/R7–R9/R11: cookbook thiếu `--set-baseline`, `--cancel`, `pause`, `repo-map`; thiếu hướng dẫn heredoc có dấu nháy và `PYTHONIOENCODING`; Commit discipline không lặp quy tắc nhánh và pipe. Thành viên cuối đóng epic.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
