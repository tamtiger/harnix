# Làm bền cơ chế setup và update global

- **ID:** 20261110-131155-global-setup-robustness
- **Mode:** full
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 14:02:36 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 4 | update-per-target: low, registry-platform-hardcode: low, crash-between-file-and-manifest: low, doctor-global-env-guard: low |

## Goal

Bảo đảm setup, update và uninstall global không để lại trạng thái treo sau lỗi giữa chừng, không trộn nội dung vào skill của người dùng và không chạm home thật khi chạy test.

## Non-goals

- Không thay registry platform thành map (ghi vào residual risk)
- Không thêm platform mới

## Relevant paths

- `src/commands/setup.ts`
- `src/configurators`
- `src/core/global`
- `src/core/managed`
- `src/core/platform`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +28 / -28 |
| `package.json` | modified | +1 / -1 |
| `src/commands/global-uninstall.ts` | modified | +2 / -1 |
| `src/commands/global-update.ts` | modified | +2 / -1 |
| `src/commands/pause.ts` | modified | +2 / -1 |
| `src/commands/resume.ts` | modified | +7 / -3 |
| `src/commands/setup.ts` | modified | +2 / -1 |
| `src/commands/status.ts` | modified | +4 / -7 |
| `src/commands/workflow-handler-utils.ts` | modified | +22 / -7 |
| `src/commands/workflow-handlers.ts` | modified | +12 / -3 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +11 / -7 |
| `src/core/epics/epic.ts` | modified | +15 / -2 |
| `src/core/global/discovery.ts` | modified | +5 / -7 |
| `src/core/global/locking.ts` | modified | +5 / -2 |
| `src/core/global/setup.ts` | modified | +6 / -0 |
| `src/core/global/toml-guard.ts` | modified | +5 / -2 |
| `src/core/global/transaction.ts` | modified | +39 / -1 |
| `src/core/global/uninstall.ts` | modified | +6 / -0 |
| `src/core/global/update.ts` | modified | +7 / -5 |
| `src/core/tasks/task-resume.ts` | modified | +12 / -6 |
| `src/core/workflow/plan-sync.ts` | modified | +13 / -3 |
| `src/core/workflow/run-checks.ts` | modified | +8 / -1 |
| `src/core/workflow/transition.ts` | modified | +2 / -1 |
| `src/core/workflow/workflow-lock.ts` | modified | +5 / -3 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/utils/check-runner.ts` | modified | +27 / -5 |
| `src/utils/git.ts` | modified | +18 / -1 |
| `src/utils/harnix-launcher.ts` | modified | +13 / -11 |
| `src/utils/process-group.ts` | added | - |
| `src/utils/test-process.ts` | modified | +10 / -0 |
| `test/integration/commands/pause.test.ts` | modified | +52 / -0 |
| `test/platform/global-robustness.test.ts` | added | - |
| `test/safety/process-timeout.test.ts` | added | - |
| `test/unit/commands/status.test.ts` | modified | +10 / -0 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +41 / -0 |
| `test/unit/commands/workflow-lifecycle-handlers.test.ts` | modified | +14 / -0 |
| `test/unit/core/epics/epic.test.ts` | modified | +50 / -0 |

_(9 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Rollback giao dịch global xóa các thư mục do giao dịch tạo; setup lỗi giữa chừng không để lại root rỗng gây untracked-collision (test fault-injection).
- [x] `ac-2` (met): Một file đã tồn tại mà chưa có mục trong manifest luôn được giữ làm untracked-collision, kể cả khi nội dung bằng desired (hợp đồng Phase 6); test khóa hành vi này và không có đường adopt.
- [x] `ac-3` (met): Collision của SKILL.md bảo vệ cả thư mục skill; references/*.md không bị ghi vào skill của người dùng.
- [x] `ac-4` (met): toml-guard phát hiện UserPromptSubmit dạng dotted hoặc quoted key và không sinh TOML không hợp lệ.
- [x] `ac-5` (met): Việc phát hiện platform đã cài của update --global không để lỗi root của một platform làm hỏng platform khác, và releaseGlobalLocks nhả đủ mọi khóa mà không che lỗi gốc; có test.
- [x] `ac-6` (met): Các điểm vào global từ chối khi homeResolver được truyền mà thiếu environment, không rơi về process.env thật.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 14:00:28 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 14:01:58 +07:00)

## Residual risks

- **update-per-target** (low) — update --global chọn cả platform khi bất kỳ target nào có sidecar: một máy chỉ có Antigravity Desktop sẽ được tạo thêm plugin CLI. Chưa sửa vì cần đổi chữ ký setupGlobal.
- **registry-platform-hardcode** (low) — user-paths.ts còn hard-code tên platform nên thêm platform chưa chỉ cần một record như AGENTS.md mô tả; ngoài phạm vi epic này.
- **crash-between-file-and-manifest** (low) — Nếu tiến trình bị dừng sau khi ghi file nhưng trước khi ghi sidecar, file Harnix tự sinh bị coi là collision ở lần chạy sau (đặc biệt Antigravity). Hợp đồng Phase 6 cấm adopt nên chỉ giảm bằng rollback dọn thư mục; cần quyết định sản phẩm nếu muốn xử lý tận gốc.
- **doctor-global-env-guard** (low) — doctor global trong test chỉ chặn thiếu homeResolver hoặc roots, chưa chặn thiếu environment; cần mã finding mới (warning trước) kèm fixture.

## Evidence

- skipped (2026-11-10 13:58:28 +07:00): Task contract revised at persisted replan: Test global reconcile hiện hành ghi rõ hợp đồng Phase 6: không bao giờ nhận file chưa sở hữu dù nội dung giống hệt. Việc adopt trái hợp đồng đóng băng nên không làm.
- `chk-focus` — pass (2026-11-10 14:00:28 +07:00): pnpm exec vitest run test/platform test/unit/core/global test/unit/core/managed — exit 0
- `chk-suite` — pass (2026-11-10 14:01:58 +07:00): pnpm test — exit 0
