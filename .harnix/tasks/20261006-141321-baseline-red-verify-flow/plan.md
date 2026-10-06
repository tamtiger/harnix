# Kế hoạch: baseline đỏ có ủy quyền và đổi check ở verify

Nguyên tắc: RED trước, GREEN sau, mỗi slice chạy check tập trung của nó; chạy `check-suite` một lần ở verify.

## Checklist

- [x] Slice 1 — Ghi baseline bằng flag (ac-1): `src/core/workflow/baseline.ts` + flag `--baseline <check-id> --result --classification --authorized-by --scope`
- [x] Slice 2 — Finish/verify chấp nhận suite đỏ sẵn có ủy quyền kèm check focused (ac-2)
- [x] Slice 3 — Đổi check ở verifying quay về `verifying/verifying` (ac-3)
- [x] Slice 4 — Tài liệu, template, quyết định delta, phiên bản dev (ac-4)
- [x] Slice 5 — Verify toàn bộ: format, lint, typecheck, test, check-suite

## Slice 1 — Flag baseline (ac-1)

Tệp: `src/core/workflow/baseline.ts` (mới, ≤300 dòng), `src/commands/workflow-flags.ts`, `src/commands/workflow-handlers.ts`, `src/commands/workflow-command.ts`, `src/core/workflow/index.ts`, `src/core/workflow/brief.ts`, `src/core/workflow/schema.ts`; test `test/unit/core/workflow/baseline.test.ts` (mới) và `test/integration/commands/workflow-flags.test.ts`.

1. RED: test `setBaselineWorkflow` ghi `baseline` lên một check required của task `ready` mà không cần `--reason`, không đổi `checkpoint`, không đổi `inputDigest` hiện tại của check; test từ chối `classification` ngoài tập đóng, thiếu `--authorized-by`, check không tồn tại, task terminal; test flag không áp dụng cho hành động khác phải báo lỗi rõ.
2. GREEN: `setBaselineWorkflow(root, { checkId, result, classification, authorizedBy, scope })` đi qua `saveWorkflow`; loại `baseline` khỏi so sánh bất biến check (`assertFrozenRequiredChecks`, `assertEvidencedChecksRetained`) và khỏi digest của check, vì đây là dữ liệu review như decisions.
3. Thêm `--baseline` vào `BRIEF_ACTIONS` và `workflow --schema`; finish/`status --explain` in `baseline` đã ủy quyền.

## Slice 2 — Suite đỏ sẵn đi kèm check focused (ac-2)

Tệp: `src/core/workflow/suite-gate.ts`, `src/core/workflow/completion.ts`, `src/core/workflow/ready.ts` (advisory); test `suite-gate.test.ts`, `completion.test.ts`, `finish.test.ts`.

1. RED: finish thành công khi check suite có baseline `{result: fail, classification: pre-existing|environment, authorizedBy}`, evidence mới nhất của suite là `fail`, và có ít nhất một check focused required pass tươi phủ mọi criterion của suite; finish bị chặn khi thiếu `authorizedBy`, khi `introduced|unknown`, khi suite chưa từng chạy, khi check focused stale hoặc không phủ đủ criterion, và khi baseline xanh (cổng mặc định giữ nguyên).
2. GREEN: hàm `baselineProof(task, check)` dùng chung; `assertSuiteGateFinishing` và `canCompleteTask` miễn pass tươi của chính check suite đó trong tổ hợp hợp lệ; criterion `met` dựa trên evidence của check focused.
3. `harnix workflow --finish` in cảnh báo `baselineAuthorized: [<check-id>]` trong output đầy đủ và `--brief`.

## Slice 3 — Đổi check ở verifying (ac-3)

Tệp: `src/core/tasks/workflow-helpers.ts` (`assertReplanExit`, `assertLegalTransition`), `src/core/workflow/plan-edit.ts` (`saveObligationEdit`), `src/core/workflow/replace-check.ts`; test `plan-edit.test.ts`, `replace-check.test.ts`.

1. RED: từ `verifying/verifying` có check pass, `--replace-check` cho check fail khác hoặc `--set-check` cho check chưa pass trả task về `verifying/verifying` trong một lệnh, giữ nguyên evidence và `inputDigest` của check đã pass; edit chạm check đã pass vẫn bị từ chối; task ở `in_progress` hoặc `ready` vẫn đi replan như cũ.
2. GREEN: `assertReplanExit` cho phép thoát `verifying/replan` về `verifying/verifying`; `saveObligationEdit` tự chuyển về `verifying/verifying` sau save `replan` khi `task.status === "verifying"` và mọi check đã pass còn nguyên; ngược lại ở lại replan.
3. Cập nhật thông điệp lỗi của `assertReplanExit`.

## Slice 4 — Tài liệu và phiên bản (ac-4)

Tệp: `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` (mục transport và thoát replan), `src/templates/harnix/workflow.md` rồi đồng bộ `.harnix/workflow.md` bằng đúng cách repo đang dùng, `src/skills/harnix-plan` và `src/skills/harnix-verify`, `CHANGELOG.md`, `package.json`.

1. RED: mở rộng `test/workflow/docs-task-contract.test.ts` để đòi nội dung về `--baseline`, quyết định không so sánh delta kèm lý do, và thoát replan ở verifying.
2. GREEN: viết tài liệu; `pnpm version:sync 2.2.0-dev.4 --summary "<tóm tắt>" --kind changed` một lần (bản dev của member epic), sinh lại output được quản lý nếu canonical đổi.

## Slice 5 — Verify

`pnpm format`, rồi `harnix workflow --run-check` cho từng check focused và `check-suite` (`pnpm run test`, gồm lint, typecheck theo script); ghi evidence, đánh dấu criterion, chuyển `verifying/finishing`, finish. Không commit; trước commit hiển thị thay đổi và message để bạn duyệt.

## Ràng buộc

- Mọi file `src/core/workflow` ≤300 dòng code; test ≤400 dòng; builder từ `test/support/builders.ts`; không đổi `test/workflow/behavior-snapshot.golden.json`.
- Không đổi tên field frozen; `baseline` giữ tập khóa đóng hiện có.
