# Epic: Review và refactor toàn diện Harnix

Sửa các lỗi đã xác minh, loại trùng lặp và dead code, nâng chất lượng test và đồng bộ tài liệu, skill, token budget của Harnix mà không đổi hành vi công khai hay frozen contract.

- **Cập nhật:** 2026-11-10 13:11:51 +07:00

## Non-goals

- Không đổi frozen contract (schema TaskRecord v3, enum, transition, hook protocol, exit code)
- Không thay registry platform thành map trong epic này
- Không regenerate behavior-snapshot.golden.json để refactor pass

## Next task

Không còn task nào chưa hoàn tất.

## Members (9 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261110-131152-security-exec-hardening` | Gia cố thực thi tiến trình ngoài (git, launcher, timeout) | `full` | `completed` |
| 2 | `20261110-131153-workflow-concurrency-fixes` | Sửa tranh chấp khóa và mất cập nhật trong workflow | `full` | `completed` |
| 3 | `20261110-131154-commands-input-fixes` | Sửa xử lý đầu vào và lỗi của lớp commands | `lite` | `completed` |
| 4 | `20261110-131155-global-setup-robustness` | Làm bền cơ chế setup và update global | `full` | `completed` |
| 5 | `20261110-131156-doctor-verification-errors` | Không nuốt lỗi trong doctor và verification | `lite` | `completed` |
| 6 | `20261110-131157-dedupe-utils-refactor` | Gom helper trùng lặp trong utils và core | `full` | `completed` |
| 7 | `20261110-131158-dead-code-and-size` | Xóa dead code và tách file sát trần | `full` | `completed` |
| 8 | `20261110-131159-test-quality` | Nâng chất lượng bộ test | `lite` | `completed` |
| 9 | `20261110-131200-docs-skills-sync` | Đồng bộ tài liệu, skill và token budget (đóng epic) | `full` | `completed` |

## Task Overview & Scope

### 1. `20261110-131152-security-exec-hardening` — Gia cố thực thi tiến trình ngoài (git, launcher, timeout)

- **Trạng thái:** `completed`
- **Mục tiêu:** Loại bỏ nguy cơ chạy executable giả nằm trong cwd hoặc repo khi gọi git và harnix launcher, sửa exit code khi timeout và dọn cây tiến trình, mà không đổi hành vi công khai.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261110-131153-workflow-concurrency-fixes` — Sửa tranh chấp khóa và mất cập nhật trong workflow

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm khóa workflow ổn định giữa các tiến trình, đưa mọi ghi plan.md và epic.json vào vùng được khóa hoặc merge an toàn, và sửa các lỗi trạng thái cục bộ (regex cờ g, now không inject).
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261110-131154-commands-input-fixes` — Sửa xử lý đầu vào và lỗi của lớp commands

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm các cờ --input, --evidence --criterion, --file và status nhất quán với --init và với các command khác, không còn bỏ qua im lặng hay báo lỗi nghèo hint.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261110-131155-global-setup-robustness` — Làm bền cơ chế setup và update global

- **Trạng thái:** `completed`
- **Mục tiêu:** Bảo đảm setup, update và uninstall global không để lại trạng thái treo sau lỗi giữa chừng, không trộn nội dung vào skill của người dùng và không chạm home thật khi chạy test.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 5. `20261110-131156-doctor-verification-errors` — Không nuốt lỗi trong doctor và verification

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm doctor --fix, chẩn đoán task và cache digest báo nguyên nhân lỗi thật thay vì nuốt bằng catch trần, giữ nguyên hành vi khi dữ liệu hợp lệ.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 6. `20261110-131157-dedupe-utils-refactor` — Gom helper trùng lặp trong utils và core

- **Trạng thái:** `completed`
- **Mục tiêu:** Thay các bản sao isMissing, isContainedPath, renameWithRetry, readBoundedText, readOptionalText và compareCodeUnits bằng một bản dùng chung, đúng như refactor thuần không đổi hành vi.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 7. `20261110-131158-dead-code-and-size` — Xóa dead code và tách file sát trần

- **Trạng thái:** `completed`
- **Mục tiêu:** Xóa mã chết đã xác nhận, thu hẹp bề mặt export và tách các file sát trần 300 dòng code để dễ bảo trì, giữ nguyên hành vi.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 8. `20261110-131159-test-quality` — Nâng chất lượng bộ test

- **Trạng thái:** `completed`
- **Mục tiêu:** Loại test chạy rỗng, assert yếu và phụ thuộc đồng hồ hoặc timer thật, gom helper test dùng chung, giữ coverage floor không giảm.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 9. `20261110-131200-docs-skills-sync` — Đồng bộ tài liệu, skill và token budget (đóng epic)

- **Trạng thái:** `completed`
- **Mục tiêu:** Loại lệnh riêng repo khỏi template và skill, sửa đường dẫn sai và tham chiếu treo, đồng bộ README, PRD, CHANGELOG và công cụ đo token; đóng epic bằng bản phát hành minor và release:check.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
