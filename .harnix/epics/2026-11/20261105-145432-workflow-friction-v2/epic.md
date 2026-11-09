# Epic: Giảm ma sát vòng đời check và gate của workflow

Giảm ma sát vòng đời check và gate khi dùng Harnix trên monorepo .NET payment-hub: lỗi flag và --init --cwd, --remove-check và sửa cwd không replan, whitelist suite với cwd, hint transition, và các thông báo chẩn đoán (secretAdvisory, baseline-accepted, input digest).

- **Cập nhật:** 2026-11-09 10:47:00 +07:00

## Non-goals

- Chưa làm --diff-baseline / known-flaky và known-failing cấp project (epic riêng, cùng việc cho phép --filter trong lệnh suite).
- Không tự sinh slug từ title tiếng Việt (ID là slug tiếng Anh, chỉ gợi ý trong lỗi).
- Không phát hiện shell PowerShell 5.1 chủ động; không thêm loại check assert-absence; không đổi công thức digest.
- Không đổi frozen contract của TaskRecord v3.

## Next task

Không còn task nào chưa hoàn tất.

## Members (6 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261105-145437-transition-next-step-hint` | Hint transition tính theo trạng thái hiện tại và xác minh resume verifying | `lite` | `completed` |
| 2 | `20261105-145436-secret-advisory-scope` | Chẩn đoán gate: secretAdvisory theo diff, baseline-accepted ở status, lỗi digest file đã xóa | `lite` | `completed` |
| 3 | `20261105-145433-batched-flag-validation` | Gom lỗi flag của --init/--set-check và cho --init --cwd lan sang mọi check | `lite` | `completed` |
| 4 | `20261109-103107-remove-check-action` | Vòng đời check: thêm --remove-check và sửa cwd check chưa pass không replan | `lite` | `completed` |
| 5 | `20261105-145435-consistent-reason-and-combo` | Thống nhất quy tắc --reason và gộp --evidence với --criterion --met | `lite` | `completed` |
| 6 | `20261105-145434-suite-command-cwd` | Suite check chấp nhận dotnet test <sln> và gợi ý --cwd; cảnh báo sớm ở status | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261105-145437-transition-next-step-hint` — Hint transition tính theo trạng thái hiện tại và xác minh resume verifying

- **Trạng thái:** `completed`
- **Mục tiêu:** Thông báo Illegal task transition nêu đúng chuỗi lệnh kế tiếp; tái hiện báo cáo --replace-check ở verifying rơi về replan và sửa nếu còn lỗi.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261105-145436-secret-advisory-scope` — Chẩn đoán gate: secretAdvisory theo diff, baseline-accepted ở status, lỗi digest file đã xóa

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm các thông báo chẩn đoán đúng và đủ: secretAdvisory chỉ quét file thuộc diff của task, status hiện check đỏ đã được baseline chấp nhận, và lỗi input digest cho file đã xóa nêu glob thư mục cha thay thế.
- **Tiêu chí nghiệm thu:** 7 tiêu chí

### 3. `20261105-145433-batched-flag-validation` — Gom lỗi flag của --init/--set-check và cho --init --cwd lan sang mọi check

- **Trạng thái:** `completed`
- **Mục tiêu:** Giảm vòng thử-sai khi khởi tạo check: validate mọi flag một lượt, gợi ý slug và scope, --init --cwd kế thừa cho mọi --with-check không khai cwd, và --init liệt kê rõ check tự sinh (cảnh báo khi trùng suite).
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 4. `20261109-103107-remove-check-action` — Vòng đời check: thêm --remove-check và sửa cwd check chưa pass không replan

- **Trạng thái:** `completed`
- **Mục tiêu:** Dọn check thừa bằng --remove-check (chưa có evidence) và cho đổi cwd của check chưa pass trực tiếp bằng --set-check mà không nhảy về replan.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 5. `20261105-145435-consistent-reason-and-combo` — Thống nhất quy tắc --reason và gộp --evidence với --criterion --met

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm quy tắc --reason nhất quán và nêu trong --schema; cho phép ghi evidence và đánh dấu criterion trong một lệnh.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 6. `20261105-145434-suite-command-cwd` — Suite check chấp nhận dotnet test <sln> và gợi ý --cwd; cảnh báo sớm ở status

- **Trạng thái:** `completed`
- **Mục tiêu:** Giải mâu thuẫn whitelist lệnh suite với cwd của run-check trong monorepo .NET nhiều solution, và báo thiếu suite check ngay từ status thay vì đợi finish. Tham chiếu payment-hub: frt-payment-gateway có sln nhưng test nằm ở test/ nên verify-plan báo hasTests=false và chỉ lộ lệnh dotnet test trần của dự án con.
- **Tiêu chí nghiệm thu:** 7 tiêu chí
