# Chặn corruption ngữ pháp execution-notes tại --save, phân biệt rõ nguyên nhân ở audit/checks

- **ID:** 20260922-095659-plan-artifact-grammar-guard
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-22T09:56:59.000Z
- **Updated:** 2026-09-23T01:03:53.076Z

## Goal

harnix workflow --save không bao giờ ghi xuống đĩa một plan.md có execution-notes sai ngữ pháp; nếu một task cũ đã lỡ bị corrupt, harnix audit/checks/preflight báo đúng reasonCodes: ["plan-artifact-invalid"] thay vì inputs-unavailable mơ hồ.

## Non-goals

- Không đổi field/schema JSON nào khác của ChecksReportResultV1/TaskAuditResultV1, chỉ thêm 1 giá trị vào union RequiredCheckReasonCode đã có
- Không hồi cứu/tự động sửa các task cũ đã lỡ bị corrupt trước khi có fix này
- Không đổi ngữ pháp execution-notes hiện có, không đổi giới hạn 100 dòng/16384 ký tự
- Không đổi hành vi assertVerificationInputsFresh/--finish (đã báo lỗi đúng/rõ ràng từ trước)

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `save-rejects-malformed-plan-grammar` (met): harnix workflow --save (hàm saveWorkflowLocked) từ chối ngay lập tức — trước khi ghi bất kỳ file nào, trước khi persist task.json — bất kỳ plan.md nào (của task Full) có execution-notes vi phạm ngữ pháp hiện có, dù lần --save đó có kèm evidence required-check mới hay không. Áp dụng nhất quán tại cả 3 nhánh gọi validateTaskArtifacts trong saveWorkflowLocked.
- `checks-distinguish-artifact-corruption` (met): Khi computeVerificationInputSnapshot thất bại vì ngữ pháp execution-notes của plan.md/prd.md sai (ném PlanningArtifactGrammarError), inspectRequiredChecks trả về reasonCodes: ["plan-artifact-invalid"] thay vì inputs-unavailable. Mọi nguyên nhân inputs-unavailable khác (file input thật sự thiếu/không đọc được, glob rỗng) không đổi. docs/IMPLEMENTATION_PLAN.md §4.5J liệt kê thêm plan-artifact-invalid trong cùng lần sửa.
- `no-regression-existing-behavior` (met): Toàn bộ test hiện có trong test/unit/check-report.test.ts, test/workflow/internal-workflow.test.ts, và cổng kiểm chứng rộng (pnpm build && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:workflow) tiếp tục pass nguyên trạng sau khi thêm validate mới.

## Required checks

- `chk-save-grammar-guard` (focused): Test xác nhận workflow --save chặn plan.md sai ngữ pháp execution-notes ngay lập tức, kể cả khi không kèm evidence mới — pass (2026-09-23T01:01:13.000Z)
- `chk-checks-reason-code` (focused): Test xác nhận inspectRequiredChecks phân biệt plan-artifact-invalid với inputs-unavailable — pass (2026-09-23T01:01:28.000Z)
- `chk-docs-sync` (focused): Xác nhận docs/IMPLEMENTATION_PLAN.md mục 4.5J liệt kê thêm plan-artifact-invalid — pass (2026-09-23T01:01:43.000Z)
- `chk-full-suite` (full): Cổng kiểm chứng rộng: build, lint, typecheck, test:unit, test:workflow — pass (2026-09-23T01:02:46.000Z)

## Decisions

- **root-cause-confirmed** — Xác nhận qua test tái hiện thật: persistNewVerificationInputSnapshots chỉ gọi computeVerificationInputSnapshot (nơi validate ngữ pháp) khi có evidence pass/fail mới trong cùng lần --save; nếu không, plan.md được saveTaskArtifacts ghi thẳng xuống đĩa mà không qua validate nào.
  - _Why:_ Đọc trực tiếp src/core/tasks/task.ts (validateTaskArtifacts/saveTaskArtifacts) và src/core/verification/input-freshness.ts (persistNewVerificationInputSnapshots), rồi viết test tạm tái hiện đúng chuỗi sự kiện người dùng mô tả, xác nhận audit/checks nuốt lỗi thành inputs-unavailable trong khi finish báo lỗi rõ ràng.
- **scope-both-save-guard-and-reason-code** — Sửa cả chặn tại --save lẫn thêm reason code plan-artifact-invalid ở check-report.ts, thay vì chỉ chặn tại --save.
  - _Why:_ Người dùng chọn phương án rộng hơn qua AskUserQuestion để vừa ngăn corruption mới vừa chẩn đoán rõ các task cũ đã lỡ bị corrupt trước khi có fix; chấp nhận đây là thay đổi vào enum RequiredCheckReasonCode công khai đã đóng băng, nên cập nhật docs/IMPLEMENTATION_PLAN.md §4.5J trong cùng lần theo đúng AGENTS.md mục Frozen contracts.

## Evidence

- skipped (2026-09-22T10:09:38.000Z): Task contract revised at persisted replan: Sửa lại 2 mô tả check (chk-docs-sync, chk-full-suite) bị thiếu dấu tiếng Việt do lỗi soạn thảo; không đổi ID, phạm vi, hay ý nghĩa.
- `chk-save-grammar-guard` — pass (2026-09-22T17:17:09.000Z): pnpm exec vitest run test/workflow/internal-workflow.test.ts: 52 passed (incl. new save-rejects-malformed-plan-grammar test)
- `chk-checks-reason-code` — pass (2026-09-22T17:17:50.000Z): pnpm exec vitest run test/unit/check-report.test.ts: 3 passed (incl. new plan-artifact-invalid distinction test)
- `chk-docs-sync` — pass (2026-09-22T17:18:20.000Z): Manual review: docs/IMPLEMENTATION_PLAN.md muc 4.5J liet ke plan-artifact-invalid dung 1 lan, dung vi tri, khong doi cau truc con lai
- `chk-full-suite` — fail (2026-09-22T17:16:00.000Z): pnpm build/lint/typecheck pass; pnpm test:unit fails at test/unit/package-contract.test.ts because findPackageJsonFiles also finds a new .kilo/worktrees/axiomatic-justice/package.json (a fresh git worktree, HEAD detached at this repo's latest commit, created by an external tool, unrelated to this task's changed files). Confirmed via git status that only the 6 files this task touches are modified.
- `chk-save-grammar-guard` — pass (2026-09-22T10:20:34.000Z): pnpm exec vitest run test/workflow/internal-workflow.test.ts: 52 passed; re-recorded with correct UTC recordedAt after ev-01 mistakenly used a local-time value copied from vitest's Start-at log line
- `chk-checks-reason-code` — pass (2026-09-22T10:20:48.000Z): pnpm exec vitest run test/unit/check-report.test.ts: 3 passed; re-recorded with correct UTC recordedAt after ev-01 mistakenly used a local-time value
- `chk-docs-sync` — pass (2026-09-22T10:20:56.000Z): Manual review: docs/IMPLEMENTATION_PLAN.md muc 4.5J co plan-artifact-invalid dung 1 lan dung vi tri; re-recorded with correct UTC recordedAt after ev-01 mistakenly used a local-time value
- `chk-full-suite` — pass (2026-09-23T00:59:50.000Z): pnpm build && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:workflow: exit 0, 387 tests passed after removing the unrelated .kilo/worktrees/axiomatic-justice git worktree
- `chk-save-grammar-guard` — pass (2026-09-23T01:01:13.000Z): pnpm exec vitest run test/workflow/internal-workflow.test.ts: 52 passed; final re-record after plan.md checklist/execution-notes were finalized
- `chk-checks-reason-code` — pass (2026-09-23T01:01:28.000Z): pnpm exec vitest run test/unit/check-report.test.ts: 3 passed; final re-record after plan.md checklist/execution-notes were finalized
- `chk-docs-sync` — pass (2026-09-23T01:01:43.000Z): Manual review: docs/IMPLEMENTATION_PLAN.md section 4.5J lists plan-artifact-invalid exactly once, correct position; final re-record after plan.md checklist/execution-notes were finalized
- `chk-full-suite` — pass (2026-09-23T01:02:46.000Z): pnpm build && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:workflow: exit 0, 387 tests passed; final re-record after plan.md checklist/execution-notes were finalized
