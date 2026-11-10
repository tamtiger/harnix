# Không nuốt lỗi trong doctor và verification

- **ID:** 20261110-131156-doctor-verification-errors
- **Mode:** lite
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 14:10:45 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | digest-error-code-untested: low |

## Goal

Làm doctor --fix, chẩn đoán task và cache digest báo nguyên nhân lỗi thật thay vì nuốt bằng catch trần, giữ nguyên hành vi khi dữ liệu hợp lệ.

## Non-goals

- Không đổi mã finding hiện có
- Finding mới ra mức warning trước

## Relevant paths

- `src/core/doctor`
- `src/core/verification`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +30 / -0 |
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
| `src/core/doctor/doctor.ts` | modified | +38 / -23 |
| `src/core/doctor/finding-codes-project.ts` | modified | +2 / -0 |
| `src/core/doctor/project-tasks.ts` | modified | +20 / -1 |
| `src/core/epics/epic.ts` | modified | +15 / -2 |
| `src/core/global/discovery.ts` | modified | +5 / -7 |
| `src/core/global/locking.ts` | modified | +5 / -2 |
| `src/core/global/setup.ts` | modified | +6 / -0 |
| `src/core/global/toml-guard.ts` | modified | +5 / -2 |
| `src/core/global/transaction.ts` | modified | +39 / -1 |
| `src/core/global/uninstall.ts` | modified | +6 / -0 |
| `src/core/global/update.ts` | modified | +7 / -5 |
| `src/core/tasks/task-resume.ts` | modified | +12 / -6 |
| `src/core/verification/input-digest.ts` | modified | +13 / -3 |
| `src/core/verification/snapshot-cache.ts` | modified | +20 / -1 |
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

_(17 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): doctor --fix ghi nhận lỗi của restoreFullArtifacts, fixProject và refreshRepoMap (finding hoặc fixErrors, đã che đường dẫn); có test.
- [x] `ac-2` (met): project-tasks.ts chỉ gắn nhãn task-invalid khi lỗi parse hoặc validate; lỗi I/O khác có finding riêng; có test.
- [x] `ac-3` (met): snapshot-cache chỉ dùng snapshot có danh sách entry gồm path và sha256, cache hỏng trả undefined; có test.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 14:08:02 +07:00)
- [x] `chk-gates` (focused): Contract tests nhanh (CLI, docs, cấu trúc test) — pass (2026-11-10 14:08:12 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 14:10:35 +07:00)

## Residual risks

- **digest-error-code-untested** (low) — hashEntries thêm mã lỗi errno vào thông điệp nhưng chưa có test vì không dựng được lỗi đọc khả chuyển sau khi glob khớp file.

## Evidence

- skipped (2026-11-10 14:07:10 +07:00): Task contract revised at persisted replan: Nhánh đọc lỗi của hashEntries không có fixture khả chuyển (glob không khớp thư mục), nên chỉ giữ phần được kiểm chứng trong tiêu chí và ghi phần mã lỗi thành rủi ro.
- `chk-focus` — pass (2026-11-10 14:08:02 +07:00): pnpm exec vitest run test/unit/core/doctor test/unit/core/verification — exit 0
- `chk-gates` — pass (2026-11-10 14:08:12 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-10 14:10:35 +07:00): pnpm test — exit 0
