# Kế hoạch — TaskRecord v3

## Checklist thực thi

- [x] `V3-SCHEMA` — validator và kiểu TaskRecord schema v3
- [x] `DIGEST` — digest nội tuyến, không sidecar, kiểm tra tươi ở finish/status
- [x] `SAVE-FLOW` — save v3, migration v1/v2→v3, replan một bước, ready gate mới
- [x] `LEGACY` — bảo đảm đọc được 69 task lịch sử và plan cũ có execution-notes
- [x] `SELF-MIGRATE` — chính task này migrate v2→v3 (dogfood) rồi mới gỡ mã cũ
- [x] `PURGE` — gỡ ready-trace, sidecar, execution-notes grammar, `--audit-ready`
- [x] `DOCS` — đồng bộ docs, skill, template, AGENTS.md; sinh lại managed output
- [x] `GATE` — chạy bộ kiểm chứng đầy đủ và ghi evidence

Thứ tự bắt buộc: mã v2 chỉ bị gỡ ở `PURGE`, sau khi `SELF-MIGRATE` đã đưa task này sang v3, vì task này còn cần đường lưu evidence v2 cho đến lúc đó.

## Chi tiết từng lát cắt

### Slice `V3-SCHEMA`

Làm gì: thêm `schemaVersion: 3` vào `src/core/tasks/task.ts` (kiểu `TaskRecordV3`, `ValidationCheckV3`, `EvidenceV3`, manifest field, `validateTask`, `taskRecordFieldManifest(3)`). Check v3: `criterionIds` và `inputs` là mảng đã sắp xếp không trùng; check bắt buộc phải có ít nhất một criterion và một input; token `@task-contract` bị từ chối vì hợp đồng luôn được gộp ngầm. Evidence v3: pass của check bắt buộc phải có `inputDigest`; nếu check có `command` thì phải có `exitCode`, pass yêu cầu `exitCode === 0`, fail yêu cầu `exitCode !== 0`.

Kiểm chứng bằng: RED viết trước trong `test/unit/task-schema-v3.test.ts` (từ chối input `@task-contract`, check bắt buộc thiếu input, pass thiếu digest, exit code sai dấu; chấp nhận record hợp lệ; v1/v2 vẫn được đọc), rồi GREEN.

Criteria: `ac-schema`
Checks: `check-contract-unit`
Paths: `src/core/tasks/task.ts`, `test/unit/task-schema-v3.test.ts`

### Slice `DIGEST`

Làm gì: tạo `src/core/verification/input-digest.ts` với `computeInputDigest`/snapshot: băm nội dung thô các file khớp `inputs` (gitignore-aware, loại đúng ba file do workflow sở hữu của task đang active: `task.json`, `review.md`, `verification-inputs.json`) cùng hash hợp đồng task; `check-report.ts` và `canCompleteTask`/finish trong `src/core/workflow.ts` so digest tính lại với `evidence.inputDigest` cho task v3, task v1/v2 chưa hoàn tất báo `legacy-schema`. Không ghi bất kỳ sidecar nào.

Kiểm chứng bằng: RED trong `test/unit/input-digest.test.ts` (digest ổn định, đổi khi file input hoặc hợp đồng đổi, không đổi khi chỉ `review.md`/`task.json` của chính task đổi, không tạo file sidecar), rồi cập nhật `test/unit/check-report.test.ts`.

Criteria: `ac-no-sidecar`, `ac-schema`
Checks: `check-contract-unit`
Paths: `src/core/verification/input-digest.ts`, `src/core/verification/check-report.ts`, `src/core/workflow.ts`, `test/unit/input-digest.test.ts`, `test/unit/check-report.test.ts`

### Slice `SAVE-FLOW`

Làm gì: trong `src/commands/internal-workflow.ts` — task mới bắt buộc v3; migration v1/v2→v3 cho task chưa hoàn tất giữ nguyên status/checkpoint (bảo toàn tiêu chí và check bắt buộc, gỡ `@task-contract`, thêm evidence `task-schema-to-v3` đúng khuôn); mọi save khác lên task v1/v2 chưa hoàn tất bị từ chối kèm hướng dẫn migrate; `contractRevision` chấp nhận trong cùng lần save đặt checkpoint `replan` (task đã qua ready), tự thêm evidence kiểm toán, giữ bất biến cho nghĩa vụ đã có pass; ready gate Full chỉ đòi `prd.md`/`plan.md` không rỗng và plan có mục checklist; bỏ `persistNewVerificationInputSnapshots`, bỏ `canonicalizePlanningArtifactV1`; `workflowEnvelopeSchema` mô tả v3; `--snapshot` trả digest v3.

Kiểm chứng bằng: RED trong `test/workflow/task-contract-v3.test.ts` trên repo tạm và home tạm: vòng đời mẫu không sinh `verification-inputs.json` và tổng số dòng file dưới thư mục task ≤ 200; revision một bước; từ chối sửa nghĩa vụ đã pass; migration đúng khuôn và từ chối save khác lên task cũ; plan chứa vùng execution-notes cũ vẫn lưu được.

Criteria: `ac-migrate-unfinished`, `ac-no-execution-notes`, `ac-no-sidecar`, `ac-replan-one-step`, `ac-schema`
Checks: `check-save-flow`
Paths: `src/commands/internal-workflow.ts`, `src/core/tasks/workflow-helpers.ts`, `src/cli-program.ts`, `test/workflow/task-contract-v3.test.ts`

### Slice `LEGACY`

Làm gì: không đổi hành vi đọc; thêm bài kiểm tra bảo vệ để mọi thay đổi sau này không làm hỏng dữ liệu cũ.

Kiểm chứng bằng: `test/workflow/legacy-history.test.ts` nạp toàn bộ `.harnix/tasks/*/task.json` của repo này qua `validateTask` (ngoại lệ tường minh cho chính task đang active nếu đã migrate), chạy `status`, `tasks`, `roadmap` trên bản sao repo tạm chứa các task đó, và kiểm tra plan chứa vùng execution-notes cũ được đọc như văn bản tự do.

Criteria: `ac-legacy-read`, `ac-no-execution-notes`
Checks: `check-legacy-read`
Paths: `test/workflow/legacy-history.test.ts`, `src/core/tasks/task.ts`, `src/core/tasks/task-index.ts`

### Slice `SELF-MIGRATE`

Làm gì: sau khi `V3-SCHEMA`, `DIGEST`, `SAVE-FLOW` xanh, dùng chính đường migration mới để đưa task `20260928-205801-simplify-task-contract` từ v2 lên v3 bằng đúng một lần save; từ đây evidence còn lại của task này là v3.

Kiểm chứng bằng: `harnix workflow --inspect` trả `schemaVersion: 3` cùng evidence migration đúng khuôn; các test của `check-save-flow` bao phủ đúng khuôn này.

Criteria: `ac-migrate-unfinished`
Checks: `check-save-flow`
Paths: `.harnix/tasks/20260928-205801-simplify-task-contract/task.json`, `test/workflow/task-contract-v3.test.ts`

### Slice `PURGE`

Làm gì: xóa `src/core/tasks/ready-trace.ts`, phần sidecar và `PlanningArtifactGrammarError` của `src/core/verification/input-freshness.ts`, nhánh `--audit-ready` (`auditWorkflow`, cờ trong `src/cli-program.ts`), việc dùng `auditReadyTrace` trong `src/core/tasks/task-audit.ts`, cùng test tương ứng (`test/unit/ready-trace.test.ts`, `test/workflow/ready-trace.test.ts`, phần sidecar trong `test/unit/verification-inputs.test.ts`); cập nhật các test còn lại dùng khuôn cũ.

Kiểm chứng bằng: `pnpm typecheck` không còn tham chiếu treo; grep không còn `execution-notes`, `ready-trace`, `audit-ready` trong `src/`; toàn bộ suite xanh.

Criteria: `ac-no-execution-notes`, `ac-no-sidecar`
Checks: `check-save-flow`, `check-suite`
Paths: `src/core/tasks/ready-trace.ts`, `src/core/verification/input-freshness.ts`, `src/core/tasks/task-audit.ts`, `src/cli-program.ts`, `test/unit/ready-trace.test.ts`

### Slice `DOCS`

Làm gì: cập nhật `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` (mục 4 schema đóng băng), `README.md`, `AGENTS.md`, các skill `src/skills/harnix-*/SKILL.md`, template `src/templates/harnix/workflow.ts`; ghi rõ breaking change và quy tắc stale-sau-migration; sinh lại `.harnix/workflow.md` và `.harnix/.template-hashes.json` bằng `harnix update`, không sửa tay.

Kiểm chứng bằng: `test/workflow/docs-task-contract.test.ts` (docs và skill không còn mô tả sidecar/trace/execution-notes như hợp đồng hiện hành, có mô tả schema v3) cùng các test template/skill/self-host/cli-contract hiện có.

Criteria: `ac-docs-sync`
Checks: `check-docs-sync`
Paths: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `README.md`, `AGENTS.md`, `src/templates/harnix/workflow.ts`, `test/workflow/docs-task-contract.test.ts`

### Slice `GATE`

Làm gì: chạy `pnpm lint && pnpm typecheck && pnpm test` và từng check tập trung, chụp digest trước/sau, ghi evidence.

Kiểm chứng bằng: mọi required check có pass với digest hiện hành; toàn bộ tiêu chí được đánh dấu met.

Criteria: `ac-docs-sync`, `ac-legacy-read`, `ac-migrate-unfinished`, `ac-no-execution-notes`, `ac-no-sidecar`, `ac-replan-one-step`, `ac-schema`
Checks: `check-suite`
Paths: `package.json`, `src/core/tasks/task.ts`, `test/workflow/task-contract-v3.test.ts`
