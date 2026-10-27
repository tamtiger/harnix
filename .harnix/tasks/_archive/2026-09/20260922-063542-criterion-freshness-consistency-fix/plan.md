# Plan: Sửa lỗi tiêu chí "pending" giả khi check bao phủ nhiều tiêu chí

## Checklist triển khai

- [x] `S1` — Viết test hồi quy RED tái hiện lỗi (nhiều criteria dùng chung một check, evidence khác nhau cùng digest hợp lệ, criteria.pending sai) — mở rộng sang cả `canCompleteTask`
- [x] `S2` — Sửa `criterionHasFreshSupport` và `canCompleteTask` để chấp nhận evidence khớp digest hiện hành, không bắt buộc là evidence-id mới nhất tuyệt đối (GREEN)
- [x] `S3` — Cải thiện thông báo lỗi "stale" của `assertVerificationInputsFresh` để nêu evidence id/`recordedAt`
- [x] `S4` — Bổ sung hướng dẫn về khoảng hở thời gian trước `--finish` trong SKILL.md của harnix-finish-work
- [x] `S5` — Chạy cổng kiểm chứng rộng (build/lint/typecheck/test:unit/test:workflow) và xác nhận `harnix audit` không còn tự mâu thuẫn trên kịch bản tái hiện — pass sau khi gỡ worktree `.kilo/worktrees/swift-wildebeest` thừa (`git worktree remove`) và bổ sung mục README còn thiếu, theo đúng yêu cầu của người dùng ngoài phạm vi PRD ban đầu

<!-- harnix:execution-notes:begin -->
slice:S1=passed@2026-09-22T07:15:19.000Z
slice:S2=passed@2026-09-22T07:15:19.000Z
slice:S3=passed@2026-09-22T07:15:50.000Z
slice:S4=passed@2026-09-22T07:16:20.000Z
slice:S5=passed@2026-09-22T07:32:42.000Z
check:chk-criterion-fresh-support=passed@2026-09-22T07:15:19.000Z
check:chk-finish-stale-message=passed@2026-09-22T07:15:50.000Z
check:chk-finish-work-skill-docs=passed@2026-09-22T07:16:20.000Z
check:chk-full-suite=failed@2026-09-22T07:17:19.000Z
<!-- harnix:execution-notes:end -->

## Chi tiết từng slice

### Slice `S1`

Thêm test mới vào `test/unit/task-audit.test.ts` và `test/workflow/routing.test.ts`: một TaskRecordV2 có một required check `criterionIds: ["a","b"]`; hai acceptance criteria `a`, `b` mỗi cái trỏ tới một evidence pass riêng (id khác nhau, `recordedAt` khác nhau) nhưng cả hai evidence đều có `inputDigest` bằng với evidence thật sự mới nhất của check. Gọi `createTaskAudit` (mock `dependencies.inspectRequiredChecks` trả `"passed"`) và `canCompleteTask` trực tiếp trên cùng dạng TaskRecord. Assert test RED: `completion.criteria.pending` > 0 dù `requiredChecks.passed` đầy đủ, và `canCompleteTask` trả `false` dù mọi evidence liên quan đều còn hợp lệ — chạy `pnpm exec vitest run test/unit/task-audit.test.ts test/workflow/routing.test.ts` để xác nhận cả hai test mới thất bại trước khi sửa S2.

Ghi chú: phát hiện qua TDD rằng `canCompleteTask` ([src/core/workflow.ts](../../../src/core/workflow.ts)) có cùng lỗi logic độc lập với `criterionHasFreshSupport`, và là gate thật sự của `harnix workflow --finish` — mở rộng phạm vi kỹ thuật của slice này để bao phủ cả hai, không đổi AC/ID nào.

Criteria: `regression-test-multi-criteria-check`
Checks: `chk-criterion-fresh-support`
Paths: `test/unit/task-audit.test.ts`, `test/workflow/routing.test.ts`

### Slice `S2`

Trong `src/core/tasks/task-audit.ts`, sửa `criterionHasFreshSupport`: thay điều kiện `latestByCheck.get(evidence.checkId)?.id !== evidence.id` bằng so sánh `inputDigest` — evidence được chấp nhận khi `latestByCheck.get(evidence.checkId)` tồn tại, có `result === "pass"`, và `latestByCheck.get(evidence.checkId)!.inputDigest === evidence.inputDigest`. Áp dụng đúng phép sửa tương tự cho `canCompleteTask` trong `src/core/workflow.ts` (điều kiện lọc `freshPasses` dòng 80): thay `latestByCheck.get(evidence.checkId)?.id === evidence.id` bằng so sánh `inputDigest` cho schemaVersion v2, giữ nguyên so sánh id cho schemaVersion v1. Giữ nguyên mọi điều kiện khác ở cả hai hàm. Chạy lại `test/unit/task-audit.test.ts test/workflow/routing.test.ts` để xác nhận GREEN, và chạy toàn bộ `pnpm test:unit` + `pnpm test:workflow` để xác nhận không phá test cũ.

Criteria: `criterion-fresh-any-evidence`
Checks: `chk-criterion-fresh-support`
Paths: `src/core/tasks/task-audit.ts`, `src/core/workflow.ts`

### Slice `S3`

Trong `src/core/verification/input-freshness.ts`, sửa câu thông báo lỗi trong `assertVerificationInputsFresh` để bao gồm `latest.id` và `latest.recordedAt` của evidence đang được đối chiếu, ví dụ: "Verification inputs are stale for check <id>: evidence <latest.id> recorded at <latest.recordedAt> no longer matches current content (<changed/missing list>)." Không đổi field JSON công khai nào. Cập nhật/thêm test trong `test/unit/verification-inputs.test.ts` và `test/workflow/internal-workflow.test.ts` xác nhận message mới chứa evidence id và recordedAt.

Criteria: `finish-stale-message-detail`
Checks: `chk-finish-stale-message`
Paths: `src/core/verification/input-freshness.ts`, `test/unit/verification-inputs.test.ts`, `test/workflow/internal-workflow.test.ts`

### Slice `S4`

Trong `src/skills/harnix-finish-work/SKILL.md`, ngay sau câu hiện có ở dòng "Confirm that evidence still describes the current files...", thêm một câu giải thích khoảng hở thời gian (autoSave/formatter có thể làm file trôi giữa lúc ghi evidence và lúc gọi `--finish`) và cách đọc thông báo lỗi mới (evidence id + recordedAt) để phân biệt với snapshot hỏng thật sự.

Criteria: `finish-work-skill-race-guidance`
Checks: `chk-finish-work-skill-docs`
Paths: `src/skills/harnix-finish-work/SKILL.md`

### Slice `S5`

Chạy cổng kiểm chứng rộng: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:workflow`. Dựng lại kịch bản tái hiện thủ công (task tạm trong sandbox test) để xác nhận `harnix audit` không còn báo `requiredChecks.passed` đầy đủ trong khi `completion.criteria.pending` > 0 cho các tiêu chí mà check đó bao phủ.

Criteria: `criterion-fresh-any-evidence`, `regression-test-multi-criteria-check`, `finish-stale-message-detail`, `finish-work-skill-race-guidance`
Checks: `chk-full-suite`
Paths: `src/core/tasks/task-audit.ts`, `src/core/workflow.ts`, `src/core/verification/input-freshness.ts`, `src/skills/harnix-finish-work/SKILL.md`
