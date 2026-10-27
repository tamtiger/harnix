# Implementation Plan: Bổ sung cờ CLI còn thiếu của workflow

## Hiện trạng đã đối chiếu với mã
- `src/commands/workflow-command.ts` khai báo option; `workflow-flags.ts` có `WorkflowFlags`, `VALUE_ACTIONS`, hai thông báo "requires exactly one of ..."; `workflow-flag-owners.ts` có `EDIT_ACTIONS` (tập action nhận `--task`, hiện thiếu `setCriterion`) và owner của từng cờ (`--cwd` chỉ cho `setCheck`, `replaceCheck`, `runCheck`; `--severity` cho `addRisk`); `workflow-handlers.ts` đã 302 dòng; `workflow-lifecycle-handlers.ts` giữ `init`.
- `src/core/workflow/plan-edit.ts` (266 dòng): `addRiskWorkflow`, `activeV3` (đã dùng `resolveEditableTask` nên mọi action sửa task theo `--task`), `saveObligationEdit`.
- `src/core/workflow/init-task.ts`: lệnh mặc định lấy từ `buildVerifyPlan(root)` không đệ quy; `defaultCheck`; `declaredCheck`. `init-spec.ts`: `KEYS = id, command, criteria, input, scope, description`.
- `src/core/workflow/brief.ts` `BRIEF_ACTIONS`; `schema.ts` `transports`; `test/workflow/cli-contract.test.ts` liệt kê đúng thứ tự các option.

## Hợp đồng (contract)
- `addRiskWorkflow(root, { id, text, severity?, mitigation? })`: `mitigation` rỗng bị bỏ qua; có giá trị thì `text` lưu `"<text> (Mitigation: <mitigation>)"`; cờ `--mitigation` thuộc owner `addRisk`.
- `InitTaskOptions.cwd?: string`; `--cwd` thêm `init` vào `actions` của owner. Với `cwd` (khác `.`): `buildVerifyPlan(root, { recursive: true })`, package có `path === cwd` cung cấp `commands.test`; thiếu thì lỗi `workflow --init --cwd <path> found no test command for that package; pass --command <cmd> explicitly.`; `defaultCheck` nhận `cwd` và `inputs` mặc định `["<cwd>/**"]`.
- `InitCheckSpec.cwd?: string`; `KEYS` thêm `cwd`; `declaredCheck` đặt `cwd`.
- `EDIT_ACTIONS` thêm `setCriterion`, `removeDecision`, `removeCriterion`; hint của `--task` nêu đủ.
- Module `src/core/workflow/plan-remove.ts`: `removeDecisionWorkflow(root, id, injectedNow?)` và `removeCriterionWorkflow(root, id, injectedNow?)`; cả hai chỉ khi `task.status === "planning"` (lỗi `... only while the task is in planning.`); decision hoặc criterion không tồn tại thì lỗi; criterion: gỡ khỏi `criterionIds` mọi check, từ chối nếu một check phủ nó có bằng chứng ghi trong `evidence`, hoặc nếu một check `required` sẽ còn `criterionIds` rỗng (lỗi nêu id check).
- Cờ: `--remove-decision <id>`, `--remove-criterion <id>`; `WorkflowFlags.removeDecision/removeCriterion`; `VALUE_ACTIONS`; hai thông báo "exactly one of" nêu thêm; `BRIEF_ACTIONS` thêm `removeDecision`, `removeCriterion`; `workflowEnvelopeSchema().transports` mô tả hai cờ và cập nhật `--init`, `--add-risk`, `--set-criterion`; export từ `core/workflow/index.ts` và `internal-workflow.ts`; handler trong file mới `workflow-edit-handlers.ts` gộp vào `WORKFLOW_HANDLERS`.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `plan-remove.test.ts` (mới), `plan-edit.test.ts` (mitigation), `init-task.test.ts` (`--cwd`: lấy lệnh test của package, `check-suite` full kèm cwd, inputs `<cwd>/**`, lỗi khi thiếu lệnh; `.` như không có cwd), `init-spec.test.ts` (`cwd=`), `set-criterion.test.ts` (`--task` không đổi con trỏ active), `workflow-flags.test.ts`/`workflow-handlers.test.ts` (owner, `--task` cho ba action, `--mitigation` ngoài `--add-risk` bị từ chối), `cli-contract.test.ts` (thứ tự option mới), `index.test.ts` (export).

### Slice 2 (GREEN)
- [x] [chk-focus] Cài `plan-remove.ts`, `mitigation`, `cwd` cho init và `with-check`, `EDIT_ACTIONS`; nối cờ, owner, handler (`workflow-edit-handlers.ts`), brief, schema, export; chạy lại test Slice 1.
- [x] [chk-focus] Cập nhật golden đúng các chuỗi mới (`HARNIX_UPDATE_GOLDEN=1`), `docs/HARNIX_WORKFLOW.md` và `src/templates/harnix/workflow.md` (cookbook cờ mới) rồi `pnpm selfhost:sync`.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates-2] `pnpm run test:gates`; `pnpm version:sync 2.12.0-dev.6 --summary <text> --kind added` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Không đổi schema TaskRecord v3 và hợp đồng `--run-check`/`--evidence`; hai cờ xóa chỉ hoạt động ở `planning`.
- Mỗi file trong `src/` dưới 300 dòng code, complexity dưới 20; handler mới ở file riêng; hướng phụ thuộc `commands -> core`.
- Test dưới 400 dòng, dựng dữ liệu qua `test/support/builders.ts` và fixtures workflow.
- Golden chỉ cập nhật cho đúng chuỗi mới, không để làm refactor pass.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3, ac-5, ac-6 | chk-focus | `pnpm exec vitest run test/unit/core/workflow test/unit/commands test/integration/commands/workflow-flags.test.ts test/workflow/cli-contract.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
