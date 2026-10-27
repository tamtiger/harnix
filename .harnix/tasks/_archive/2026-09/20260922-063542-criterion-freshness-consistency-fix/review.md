# Sửa lỗi tiêu chí pending giả khi một check bao phủ nhiều tiêu chí

- **ID:** 20260922-063542-criterion-freshness-consistency-fix
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-22T06:37:55.000Z
- **Updated:** 2026-09-22T09:09:37.007Z

## Goal

Khi một required check đang ở trạng thái passed, mọi acceptance criterion mà check đó bao phủ phải được tính met nếu có ít nhất một evidence pass có inputDigest khớp đúng với evidence mới nhất hiện hành của check, không còn bắt buộc evidence đó phải là evidence có id trùng với evidence mới nhất tuyệt đối.

## Non-goals

- Không đổi field/schema JSON công khai của harnix checks, harnix audit, harnix status, hoặc RequiredCheckReasonCode
- Không thêm transport --evidence --supersedes
- Không nới quy tắc retire-check cho phép thay thế một check đã từng pass
- Không đổi thuật toán latest-evidence-by-timestamp dùng chung bởi classifier inspectRequiredChecks

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `criterion-fresh-any-evidence` (met): Cả criterionHasFreshSupport (src/core/tasks/task-audit.ts) và canCompleteTask (src/core/workflow.ts) coi một criterion/evidence là tươi nếu evidence có result: "pass", checkId trỏ tới một required check đang passed, và evidence.inputDigest bằng đúng inputDigest của evidence mới nhất hiện hành của check đó; không còn bắt buộc evidence.id trùng với id của evidence mới nhất. Hành vi TaskRecord schema v1 giữ nguyên không đổi ở cả hai hàm.
- `regression-test-multi-criteria-check` (met): test/unit/task-audit.test.ts và test/workflow/routing.test.ts mỗi file có một test mới: một check v2 bao phủ >=2 acceptance criteria, mỗi criterion trỏ tới một evidence pass khác nhau (không phải evidence mới nhất) nhưng cùng inputDigest với evidence mới nhất thật sự của check; createTaskAudit trả về completion.criteria.pending: 0 và completion.status: pass, và canCompleteTask trả về true, khi check ở trạng thái passed. Test RED trước khi sửa, GREEN sau khi sửa.
- `finish-stale-message-detail` (met): Khi assertVerificationInputsFresh phát hiện input không còn tươi cho một check, thông báo lỗi ném ra chứa id và recordedAt của evidence mới nhất đang được đối chiếu, bên cạnh danh sách changed:/missing: path hiện có. Không có field/schema JSON công khai nào thay đổi.
- `finish-work-skill-race-guidance` (met): src/skills/harnix-finish-work/SKILL.md bổ sung một câu giải thích rằng --finish tính lại độ tươi dựa trên nội dung file tại đúng thời điểm gọi lệnh, nên chỉnh sửa xen giữa (kể cả autoSave/formatter) sẽ khiến --finish báo stale một cách chính đáng; thông báo lỗi mới nêu rõ evidence/thời điểm liên quan để phân biệt với một snapshot bị hỏng thật sự.

## Required checks

- `chk-criterion-fresh-support` (focused): Unit test xác nhận criterionHasFreshSupport và canCompleteTask chấp nhận evidence khớp digest hiện hành, không bắt buộc là evidence mới nhất tuyệt đối — pass (2026-09-22T07:37:06.000Z)
- `chk-finish-stale-message` (focused): Unit/integration test xác nhận thông báo lỗi stale của assertVerificationInputsFresh nêu evidence id và recordedAt — pass (2026-09-22T07:37:21.000Z)
- `chk-finish-work-skill-docs` (focused): Xác nhận SKILL.md của harnix-finish-work mô tả cảnh báo khoảng hở thời gian trước khi gọi --finish — pass (2026-09-22T07:41:00.000Z)
- `chk-full-suite` (full): Cổng kiểm chứng rộng: build, lint, typecheck, test:unit, test:workflow — pass (2026-09-22T07:39:51.000Z)

## Decisions

- **root-cause-confirmed** — Nguyên nhân gốc là criterionHasFreshSupport trong task-audit.ts đòi evidence phải là evidence mới nhất tuyệt đối của check, không phải sự khác biệt thuật toán giữa finish và requiredChecks.
  - _Why:_ Đọc trực tiếp input-freshness.ts, check-report.ts, status.ts xác nhận cả ba dùng chung một classifier latest-evidence-by-timestamp; sai lệch chỉ nằm ở lớp completion-criteria cao hơn trong task-audit.ts.
- **scope-no-frozen-contract-change** — Chỉ sửa logic completion và cải thiện message lỗi/tài liệu, không thêm --evidence --supersedes và không nới quy tắc retire-check.
  - _Why:_ Người dùng chọn phương án phạm vi hẹp hơn qua AskUserQuestion để tránh sửa đổi frozen contract (evidence append-only, retire-check rule ở AGENTS.md/IMPLEMENTATION_PLAN.md mục 4) khi nguyên nhân gốc đã xác nhận không đòi hỏi thay đổi đó.
- **scope-extend-canCompleteTask** — Mở rộng slice S1/S2 sang canCompleteTask trong src/core/workflow.ts, cùng chk-criterion-fresh-support required check, thay vì chỉ sửa criterionHasFreshSupport như phạm vi ban đầu.
  - _Why:_ TDD phát hiện completion.status vẫn fail sau khi chỉ sửa task-audit.ts vì canCompleteTask (gate thật sự của harnix workflow --finish) có cùng lỗi logic độc lập. Đây là mở rộng kỹ thuật cần thiết để AC criterion-fresh-any-evidence đúng như PRD mô tả, không phải một quyết định sản phẩm mới hay thay đổi frozen contract.
- **user-authorized-kilo-worktree-removal** — Gỡ bỏ git worktree thừa .kilo/worktrees/swift-wildebeest bằng git worktree remove (không phải rm -rf thô) và xoá thư mục .kilo còn lại (untracked, đã git-ignore hoàn toàn).
  - _Why:_ Người dùng yêu cầu trực tiếp ('xóa .kilo luôn đi') sau khi được xác nhận đây là worktree hợp lệ, HEAD detached tại đúng commit main, working tree sạch, không có thay đổi chưa commit nào bị mất. Việc này giải quyết dứt điểm 1 trong 2 lỗi có sẵn chặn chk-full-suite.
- **user-authorized-readme-section** — Bổ sung mục '## Từ yêu cầu người dùng đến workflow agent' vào README.md để test/workflow/templates.test.ts pass, đúng nội dung mà test đã khoá cứng bằng các cụm từ cụ thể.
  - _Why:_ Người dùng yêu cầu trực tiếp ('Để tôi tự viết bổ sung mục đó vào README luôn') sau khi được xác nhận đây là lỗi có sẵn trên main, không liên quan 4 tiêu chí gốc của task. Nội dung mục mới chỉ tóm tắt lại (bằng tiếng Việt, cho người dùng cuối) đúng model Bypass/Lite/Full đã có sẵn trong AGENTS.md và AGENTS template — không tạo ra quy tắc mới, không cần đồng bộ ngược lại AGENTS.md/template vì hai nơi đó đã là nguồn gốc chính xác hơn và bị ràng buộc byte budget riêng.

## Evidence

- skipped (2026-09-22T06:55:38.000Z): Task contract revised at persisted replan: Sửa lại toàn bộ nội dung tiếng Việt bị thiếu dấu do lỗi soạn thảo ban đầu của agent; không thay đổi phạm vi, ID, hay ý nghĩa của bất kỳ tiêu chí/check nào.
- skipped (2026-09-22T07:08:57.000Z): Task contract revised at persisted replan: Mở rộng required check chk-criterion-fresh-support (inputs, command, mô tả) và acceptanceCriteria liên quan để bao phủ cả canCompleteTask trong src/core/workflow.ts, sau khi TDD phát hiện hàm này có cùng lỗi logic độc lập với criterionHasFreshSupport và là gate thật sự của workflow --finish.
- `chk-criterion-fresh-support` — pass (2026-09-22T07:15:19.000Z): pnpm exec vitest run test/unit/task-audit.test.ts test/workflow/routing.test.ts: 33 passed (2 files)
- `chk-finish-stale-message` — pass (2026-09-22T07:15:50.000Z): pnpm exec vitest run test/unit/verification-inputs.test.ts test/workflow/internal-workflow.test.ts: 67 passed (2 files)
- `chk-finish-work-skill-docs` — pass (2026-09-22T07:16:20.000Z): Manual review: SKILL.md now documents the --finish freshness race and how to read the evidence id/recordedAt in the stale message
- `chk-full-suite` — fail (2026-09-22T07:17:19.000Z): pnpm build/lint/typecheck pass; pnpm test:unit fails at test/unit/package-contract.test.ts (findPackageJsonFiles also finds .kilo/worktrees/swift-wildebeest/package.json) and pnpm test:workflow fails at test/workflow/templates.test.ts (README missing an expected section). Both confirmed pre-existing on main via git stash of this task's changes, unrelated to task-audit.ts/workflow.ts/input-freshness.ts/SKILL.md edits.
- `chk-criterion-fresh-support` — pass (2026-09-22T07:20:45.000Z): pnpm exec vitest run test/unit/task-audit.test.ts test/workflow/routing.test.ts: 33 passed (2 files); re-recorded after plan.md checklist/prose was finalized
- `chk-finish-stale-message` — pass (2026-09-22T07:21:08.000Z): pnpm exec vitest run test/unit/verification-inputs.test.ts test/workflow/internal-workflow.test.ts: 67 passed (2 files); re-recorded after plan.md checklist/prose was finalized
- `chk-finish-work-skill-docs` — pass (2026-09-22T07:21:40.000Z): Manual review re-confirmed after plan.md checklist/prose was finalized: SKILL.md documents the --finish freshness race and how to read the evidence id/recordedAt in the stale message
- `chk-full-suite` — pass (2026-09-22T07:32:42.000Z): pnpm build && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:workflow: exit 0, 385 tests passed (270 unit incl. 1 skipped, 116 workflow) after removing the unrelated .kilo git worktree and adding the missing README section
- `chk-criterion-fresh-support` — pass (2026-09-22T07:37:06.000Z): pnpm exec vitest run test/unit/task-audit.test.ts test/workflow/routing.test.ts: 33 passed (2 files); final re-record after plan.md S5 checklist/decisions finalized
- `chk-finish-stale-message` — pass (2026-09-22T07:37:21.000Z): pnpm exec vitest run test/unit/verification-inputs.test.ts test/workflow/internal-workflow.test.ts: 67 passed (2 files); final re-record after plan.md S5 checklist/decisions finalized
- `chk-finish-work-skill-docs` — pass (2026-09-22T07:37:50.000Z): Manual review re-confirmed final time: SKILL.md documents the --finish freshness race and how to read the evidence id/recordedAt in the stale message; final re-record after plan.md S5 checklist/decisions finalized
- `chk-full-suite` — pass (2026-09-22T07:39:51.000Z): pnpm build && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:workflow: exit 0, 385 tests passed, final re-record after version:sync to 1.1.9 (release preparation)
- `chk-finish-work-skill-docs` — pass (2026-09-22T07:41:00.000Z): Manual review re-confirmed: SKILL.md content unchanged (only managed version frontmatter bumped to 1.1.9 by version:sync), still documents the --finish freshness race and how to read the evidence id/recordedAt in the stale message
