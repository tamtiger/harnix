# Yêu cầu sản phẩm (PRD) - Task 2: Atomic Replace Check

## Bối cảnh và vấn đề
Khi một required validation check bị fail hoặc phát hiện phạm vi kiểm thử không phù hợp (ví dụ lint toàn bộ package bị vướng 18 lỗi pre-existing ngoài scope của task), agent cần thay thế check này bằng một check tập trung (focused check).
Tuy nhiên, trong kiến trúc hiện tại của Harnix:
1. Hợp đồng kiểm thử bị đóng băng từ lần đầu `ready`. Mọi thay đổi về obligations yêu cầu `contractRevision` tại checkpoint `replan`.
2. Kiểm tra `assertEvidencedChecksRetained` trong `src/core/workflow/obligations.ts` yêu cầu: check cũ bị fail phải được giữ nguyên định nghĩa và chuyển sang `required: false`, đồng thời trong cùng một bước lưu (`next`), phải có một replacement check `required: true` bao phủ toàn bộ `criterionIds` của check cũ.
3. Nếu agent dùng `--set-check` để thêm replacement check trước, thì ở bước tiếp theo khi retire check cũ, replacement check đã nằm trong `priorCheckIds` khiến kiểm tra `!priorCheckIds.has(replacement.id)` bị từ chối.
4. Ngược lại, nếu agent dùng `--set-check` để chuyển check cũ thành `required: false` trước, hệ thống lập tức từ chối vì chưa có replacement check trong payload đó.
5. Kết quả là việc thay thế check bị bế tắc nếu không có transport nguyên tử (atomic) thực hiện đồng thời cả hai thao tác.

## Mục tiêu
1. Bổ sung cờ lệnh chính thức `harnix workflow --replace-check <old-id> <new-id> --reason "<reason>"` (kèm các tùy chọn khai báo check mới nếu chưa tồn tại: `--description`, `--command`, `--scope`, `--input`, `--criteria`).
2. Thực hiện thao tác thay thế một cách nguyên tử (atomic):
   - Đảm bảo check cũ có evidence kết quả là `fail` hoặc `skipped` (không được phép thay thế check đã `pass`).
   - Giữ nguyên toàn bộ định nghĩa của check cũ, chỉ đánh dấu `required: false`.
   - Nếu check mới đã tồn tại trong `validationPlan`, đảm bảo check mới được kích hoạt `required: true` và bao phủ toàn bộ `criterionIds` của check cũ.
   - Nếu check mới chưa tồn tại, tự động tạo mới check với các thông số được cung cấp (mặc định lấy `criterionIds` của check cũ nếu không truyền `--criteria`).
   - Tự động thực hiện lưu replan kèm `contractRevision.reason` hợp lệ và ghi nhận evidence revision audit trail.
3. Cập nhật `src/core/workflow/obligations.ts` để cho phép replacement check có thể là check mới tạo HOẶC check chưa có passing evidence đã khai báo trước đó trong plan.

## Tiêu chí nghiệm thu (Acceptance Criteria)

### ac-1: Hỗ trợ flag --replace-check <old> <new> --reason và kiểm tra new check cover đủ criterionIds của old check
**Verifies:** `check-replace-command` (`pnpm vitest run test/unit/core/workflow/plan-edit.test.ts`)
- CLI nhận diện cờ `--replace-check <old-id> <new-id> --reason "<reason>"`.
- Kiểm tra tính hợp lệ: check cũ phải tồn tại, không được có passing evidence; check mới phải cover 100% `criterionIds` mà check cũ từng cover.
- Từ chối nếu `--reason` thiếu hoặc dưới 10 ký tự.

### ac-2: Thao tác thay thế là atomic, ghi nhận contractRevision hợp lệ và giữ nguyên định nghĩa của old check
**Verifies:** `check-replace-command` (`pnpm vitest run test/unit/core/workflow/plan-edit.test.ts`)
- Check cũ được giữ nguyên định nghĩa (`description`, `command`, `inputs`, `criterionIds`, `scope`), chỉ đổi `required` từ `true` sang `false`.
- Check mới được lưu với `required: true`.
- Toàn bộ thao tác hoàn thành trong một lần lưu atomic duy nhất, chuyển checkpoint sang `replan`, ghi nhận audit evidence `task-contract-revision-NN`.

### ac-3: Toàn bộ test suite unit, workflow và acceptance của Harnix vượt qua 100% exit code 0
**Verifies:** `check-suite` (`pnpm run test:acceptance`)
- Toàn bộ các bộ kiểm thử unit, integration, migration, workflow, platform và safety của Harnix vượt qua 100% không có lỗi hồi quy.
