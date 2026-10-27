# Plan: Chặn corruption ngữ pháp execution-notes tại --save, phân biệt rõ nguyên nhân ở audit/checks

## Checklist triển khai

- [x] `S1` — Viết test hồi quy RED cho `--save` (tái hiện đúng kịch bản: save chỉ sửa plan.md, không kèm evidence mới, ngữ pháp sai vẫn được ghi xuống đĩa)
- [x] `S2` — Thêm `PlanningArtifactGrammarError` và validate ngữ pháp tại 3 điểm gọi `validateTaskArtifacts` trong `saveWorkflowLocked` (GREEN cho S1)
- [x] `S3` — Viết test hồi quy RED cho `inspectRequiredChecks` (ngữ pháp sai vẫn báo `inputs-unavailable` mơ hồ)
- [x] `S4` — Thêm reason code `plan-artifact-invalid`, sửa catch trong `inspectRequiredChecks` để phân biệt bằng `instanceof PlanningArtifactGrammarError` (GREEN cho S3)
- [x] `S5` — Đồng bộ `docs/IMPLEMENTATION_PLAN.md` §4.5J với reason code mới
- [x] `S6` — Chạy cổng kiểm chứng rộng, xác nhận không phá test cũ — pass sau khi gỡ worktree `.kilo/worktrees/axiomatic-justice` thừa (không liên quan phạm vi task, theo yêu cầu người dùng)

<!-- harnix:execution-notes:begin -->
slice:S1=passed
slice:S2=passed
slice:S3=passed
slice:S4=passed
slice:S5=passed
slice:S6=passed
check:chk-save-grammar-guard=passed
check:chk-checks-reason-code=passed
check:chk-docs-sync=passed
check:chk-full-suite=passed
<!-- harnix:execution-notes:end -->

## Chi tiết từng slice

### Slice `S1`

Thêm test mới vào `test/workflow/internal-workflow.test.ts`: tạo một task Full với evidence pass hợp lệ (execution-notes rỗng hoặc đúng ngữ pháp) qua `--save` bình thường; sau đó gọi `--save` lần hai chỉ đổi nội dung `plan.md` (thêm dòng execution-notes `slice:S1=done`, không kèm evidence mới) — assert RED: hiện tại lần save thứ hai **không** ném lỗi, và file `plan.md` trên đĩa chứa đúng nội dung sai ngữ pháp đó (chứng minh corruption đã lọt qua). Chạy `pnpm exec vitest run test/workflow/internal-workflow.test.ts` để xác nhận test mới thất bại (không throw như mong đợi) trước khi sửa S2.

Criteria: `save-rejects-malformed-plan-grammar`
Checks: `chk-save-grammar-guard`
Paths: `test/workflow/internal-workflow.test.ts`

### Slice `S2`

Trong `src/core/verification/input-freshness.ts`, thêm `export class PlanningArtifactGrammarError extends Error {}` và đổi 5 chỗ trong `canonicalizePlanningArtifactV1` đang `throw new Error("Planning execution-note ...")` (marker nested/malformed, marker unmatched/malformed, region malformed/too large/contract syntax, chỉ chấp nhận grammar inert, marker unclosed/malformed) sang `throw new PlanningArtifactGrammarError(...)` với **nguyên văn message không đổi**.

Trong `src/commands/internal-workflow.ts`, import `canonicalizePlanningArtifactV1`; thêm hàm cục bộ `function assertValidPlanArtifact(candidate, artifacts) { if (candidate.mode === "full" && artifacts?.plan !== undefined) canonicalizePlanningArtifactV1(artifacts.plan, "plan"); }` (bỏ qua giá trị trả về, chỉ cần tác dụng phụ validate); thay cả 3 chỗ `if (artifacts) validateTaskArtifacts(candidate, artifacts);` (dòng 94, 104, 124) bằng `if (artifacts) { validateTaskArtifacts(candidate, artifacts); assertValidPlanArtifact(candidate, artifacts); }`. Chạy lại test ở S1 để xác nhận GREEN, cộng `pnpm test:workflow` để không phá test cũ.

Criteria: `save-rejects-malformed-plan-grammar`
Checks: `chk-save-grammar-guard`
Paths: `src/core/verification/input-freshness.ts`, `src/commands/internal-workflow.ts`

### Slice `S3`

Thêm test mới vào `test/unit/check-report.test.ts`, dựa theo pattern có sẵn của test "explains v2 input, contract, missing-path, and invalid-sidecar freshness": dùng task Full (`mode: "full"`) có `plan.md`/`prd.md` thật trên đĩa tạm, ghi evidence pass hợp lệ qua `persistNewVerificationInputSnapshots` trong khi `plan.md` còn đúng ngữ pháp, sau đó ghi đè `plan.md` với execution-notes sai ngữ pháp (`slice:S1=done`) trực tiếp bằng `writeFile` (mô phỏng đúng lỗ hổng ở S1/S2 nếu chưa sửa, hoặc mô phỏng task cũ đã lỡ bị corrupt trước khi có fix). Assert RED: hiện tại `inspectRequiredChecks` trả `reasonCodes: ["inputs-unavailable"]` thay vì phân biệt được nguyên nhân. Chạy `pnpm exec vitest run test/unit/check-report.test.ts` để xác nhận RED trước khi sửa S4.

Criteria: `checks-distinguish-artifact-corruption`
Checks: `chk-checks-reason-code`
Paths: `test/unit/check-report.test.ts`

### Slice `S4`

Trong `src/core/verification/check-report.ts`: thêm `"plan-artifact-invalid"` vào union `RequiredCheckReasonCode` (giữ thứ tự alphabet của union hiện có); import `PlanningArtifactGrammarError` từ `input-freshness.ts`; sửa khối `try { current = await computeVerificationInputSnapshot(...); } catch { return inspection(check.id, "stale", ["inputs-unavailable"]); }` thành `catch (error) { if (error instanceof PlanningArtifactGrammarError) return inspection(check.id, "stale", ["plan-artifact-invalid"]); return inspection(check.id, "stale", ["inputs-unavailable"]); }`. Chạy lại test ở S3 để xác nhận GREEN, cộng toàn bộ `test/unit/check-report.test.ts` (bao gồm case `inputs-unavailable` hiện có ở dòng 95-97, phải vẫn còn đúng vì đó là lỗi file-missing thật, không phải grammar) để xác nhận không regressive.

Criteria: `checks-distinguish-artifact-corruption`
Checks: `chk-checks-reason-code`
Paths: `src/core/verification/check-report.ts`

### Slice `S5`

Trong `docs/IMPLEMENTATION_PLAN.md` §4.5J (dòng 459), thêm `plan-artifact-invalid` vào danh sách "safe categorical causes" hiện có (`snapshot-missing|snapshot-invalid|snapshot-mismatch|task-contract-changed|inputs-changed|inputs-missing|inputs-unavailable`), giữ nguyên phần còn lại của đoạn văn.

Criteria: `checks-distinguish-artifact-corruption`
Checks: `chk-docs-sync`
Paths: `docs/IMPLEMENTATION_PLAN.md`

### Slice `S6`

Chạy `pnpm build && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:workflow`; xác nhận toàn bộ pass, không có test nào bị yếu đi hay xoá để né lỗi.

Criteria: `save-rejects-malformed-plan-grammar`, `checks-distinguish-artifact-corruption`, `no-regression-existing-behavior`
Checks: `chk-full-suite`
Paths: `src/commands/internal-workflow.ts`, `src/core/verification/check-report.ts`, `src/core/verification/input-freshness.ts`, `docs/IMPLEMENTATION_PLAN.md`
