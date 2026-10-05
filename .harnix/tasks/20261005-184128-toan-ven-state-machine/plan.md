# Kế hoạch — Toàn vẹn state machine và dữ liệu task

## Checklist theo slice

- [x] Slice 1 (ac-1, R-004): module `src/core/workflow/epic-members.ts` (chuẩn bị, ghi, rollback member); `save.ts` kiểm trước, ghi member trước task chính, gỡ member mới khi lỗi trước commit.
- [x] Slice 2 (ac-2, R-007): `transitionTask` đòi `blocker.resumeStatus === status trước`; `transitionWorkflow` bỏ `blocker` khi resume và chỉ cho resume về `resumeStatus`.
- [x] Slice 3 (ac-3, R-008): `obligationsChanged` tính đổi `waived`/`waiverReason`; replan giữ `status` của criterion đã chứng minh.
- [x] Slice 4 (ac-4, R-023, R-024): `assertLegalTransition` chặn thoát `replan` ngoài `ready/ready` (và `planning/planning` khi status `planning`); `ready.ts` có `collectReadyIssues` dùng chung cho transition thật và dry-run; dry-run trả `advisories`.
- [x] Slice 5 (ac-5, R-026, R-027): migration giữ `inputs`; test hồi quy `--replace-check` kế thừa `command`.
- [x] Slice 6 (ac-6, R-028): `--batch` dùng lại logic `plan-edit`; `workflow --schema` mô tả envelope; sinh lại golden đúng một lần nếu schema đổi.
- [x] Slice 7 (ac-7, R-036, R-025): epic `.json`/`.md` ghi atomic có newline cuối; sơ đồ §4 `HARNIX_WORKFLOW.md` khớp `transitions`; test đối chiếu sơ đồ với bảng.
- [x] Slice 8 (ac-8): `typecheck`, `lint`, `test` (coverage) xanh cục bộ; evidence chính thức ghi bằng `--run-check` ở giai đoạn verifying.

## Thứ tự RED rồi GREEN

- **Slice 1:** RED `epic-members.test.ts` + `save.test.ts`: gửi lại member đã có evidence bị từ chối và task.json của member không đổi; replay giống hệt thành công; một member thứ hai trùng khiến lần save không để lại member nào; lỗi sau khi ghi member nhưng trước commit task gỡ member mới tạo. GREEN: module + sửa `save.ts`.
- **Slice 2:** RED `task-state.test.ts` (`verifying→blocked{resumeStatus:"planning"}` bị từ chối; `resumeStatus` đúng thì được) và `transition.test.ts` (`--transition planning/planning` từ `blocked` resume được và task không còn `blocker`; resume sai đích bị từ chối). GREEN: sửa `task-state.ts`, `transition.ts`.
- **Slice 3:** RED `obligations.test.ts`: sau ready, `--save` đổi `pending→waived` bị từ chối với gợi ý `contractRevision`; qua `replan` + reason thì được; đổi `waiverReason` tương tự; `--criterion --met` vẫn chạy; criterion đã `met` không thể đổi sang `waived` trong replan. GREEN: sửa `obligations.ts`.
- **Slice 4:** RED `transition.test.ts`/`ready.test.ts`: từ `in_progress/replan` sang `in_progress/implementing` bị từ chối, sang `ready/ready` thì chạy lại cổng ready; `planning/replan` về `planning/planning` được; dry-run `valid` trùng kết quả transition thật trên cùng tập fixture (bảng: thiếu criterion, thiếu suite, thiếu prd/plan, chưa baseline, glob không khớp); `advisories` chứa glob và baseline. GREEN: `workflow-helpers.ts`, `ready.ts`, `transition.ts`.
- **Slice 5:** RED `migration.test.ts`: v2 với required check `inputs:["src/**","@task-contract"]` migrate với inputs thu hẹp bị từ chối, giữ nguyên thì được; `replace-check.test.ts` đã có test kế thừa `command` (xác nhận). GREEN: `migration.ts`.
- **Slice 6:** RED `batch-apply.test.ts`/`batch.test.ts`: id decision/risk trùng bị từ chối, severity mặc định `low`, text rỗng bị từ chối, sau ready cần `reason` 10–1000 ký tự và dùng đường `saveObligationEdit`; `schema.test.ts` có mô tả envelope. GREEN: sửa `batch-apply.ts`, `batch.ts`, `schema.ts`.
- **Slice 7:** RED `epic.test.ts` (ghi dùng `atomicWriteFile`, newline cuối) và `test/workflow/state-machine-doc.test.ts` (mọi cạnh status→status trong sơ đồ có trong `transitions` và ngược lại). GREEN: `epic.ts` và tài liệu.

Ghi chú TDD: sơ đồ tài liệu dùng test đối chiếu thay cho RED văn bản.

## Mỗi check chứng minh điều gì

- `check-state` (core, command, workflow, migration): ac-1 đến ac-6.
- `check-migration` (`pnpm run test:migration`) và test tài liệu: ac-5, ac-7.
- `check-typecheck`, `check-lint`, `check-suite`: cổng chất lượng cuối (ac-8).

## Bảo toàn

Không đổi schema TaskRecord/epic, tên status/checkpoint, exit code. Golden chỉ sinh lại nếu `workflow --schema` đổi (slice 6): xem diff, chỉ giữ chữ schema. Không commit khi chưa được duyệt. File `.harnix/` và `docs/prompts/harnix-comprehensive-review.md` chưa theo dõi: giữ nguyên.
