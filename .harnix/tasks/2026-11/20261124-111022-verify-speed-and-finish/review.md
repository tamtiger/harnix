# Tăng tốc phản hồi verify và gọn bước finish; đóng epic bằng bản minor

- **ID:** 20261124-111022-verify-speed-and-finish
- **Mode:** lite
- **Epic:** 20261124-111018-session-feedback-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 11:10:18 +07:00
- **Updated:** 2026-11-24 12:06:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 2 | risk-doctor-warning-exit: low, risk-outside-paths-deleted: low |

## Goal

Giảm token và lượt thao tác lúc verify và finish: run-checks in tóm tắt gọn kèm tên test hỏng, status --checks hiện thời lượng, finish đề xuất commit và cảnh báo file ngoài paths; member cuối đóng epic.

## Non-goals

- Không đổi hợp đồng đóng băng của TaskRecord v3, chuyển trạng thái hay hook protocol
- Không thêm package, bin, daemon hay surface nền tảng mới
- Không tự commit, branch hay push
- Không đổi cơ chế circuit breaker trước khi kiểm lại bằng chứng (chỉ ghi nhận kết quả kiểm)

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/**`
- `package.json`
- `src/**`
- `test/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +5 / -4 |
| `docs/HARNIX_PRD.md` | modified | +2 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +4 / -1 |
| `src/cli-workflow-commands.ts` | modified | +8 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +3 / -2 |
| `src/commands/status-mode.ts` | modified | +3 / -0 |
| `src/commands/status.ts` | modified | +14 / -5 |
| `src/commands/workflow-command.ts` | modified | +11 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +13 / -8 |
| `src/commands/workflow-flags.ts` | modified | +13 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +1 / -0 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +20 / -1 |
| `src/core/doctor/exercise-runbook-finding.ts` | added | - |
| `src/core/doctor/finding-codes-project.ts` | modified | +1 / -0 |
| `src/core/doctor/project.ts` | modified | +2 / -0 |
| `src/core/platform/user-path-hints.ts` | added | - |
| `src/core/platform/user-paths.ts` | modified | +3 / -2 |
| `src/core/repo-map/refs.ts` | modified | +3 / -1 |
| `src/core/spec/exercise-runbook.ts` | added | - |
| `src/core/stack/verify-plan.ts` | modified | +5 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +1 / -1 |
| `src/core/tasks/transition-hint.ts` | modified | +1 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -0 |
| `src/core/workflow/check-duration.ts` | added | - |
| `src/core/workflow/exercise-advisory.ts` | added | - |
| `src/core/workflow/finish-advice.ts` | added | - |
| `src/core/workflow/finish.ts` | modified | +4 / -0 |
| `src/core/workflow/index.ts` | modified | +3 / -1 |
| `src/core/workflow/init-epic.ts` | added | - |
| `src/core/workflow/init-task.ts` | modified | +22 / -4 |
| `src/core/workflow/ready.ts` | modified | +6 / -1 |
| `src/core/workflow/run-check.ts` | modified | +1 / -1 |
| `src/core/workflow/schema.ts` | modified | +2 / -0 |
| `src/core/workflow/target-task.ts` | modified | +19 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +2 / -1 |
| `src/skills/harnix-exercise/references/detection.md` | modified | +2 / -0 |
| `src/skills/harnix-exercise/references/evidence.md` | modified | +2 / -0 |
| `src/skills/harnix-exercise/references/runbook.md` | added | - |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |

_(32 more files not shown)_

## Acceptance criteria

- [x] `ac-2` (met): `harnix status --checks` hiện `durationMs` của lần pass gần nhất cho từng check để chọn check nhanh chạy trước.
- [x] `ac-3` (met): `harnix workflow --finish --brief` kèm gợi ý thông điệp commit (không commit) và cảnh báo (không chặn) khi working tree có file thay đổi ngoài `relevantPaths` của task.
- [x] `ac-5` (met): Tài liệu, skills, template được đồng bộ, selfhost:sync chạy; phiên bản đóng epic bằng bản minor `pnpm version:sync <X.(Y+1).0> --fold-dev` kèm CHANGELOG; chạy harnix-review một lần trên toàn bộ diff epic trước finish.
- [x] `ac-6` (met): Gợi ý thiếu runbook, không ghi file: khi repo có entry point chạy được (script start, dev hoặc serve, hoặc bin trong package.json) mà chưa có `.harnix/spec/exercise.md` có nội dung, `harnix doctor` in finding `exercise-runbook-missing` mức warning, không fixable, trỏ tới `harnix skill harnix-exercise --reference runbook`; mã nằm trong `DOCTOR_FINDING_CODES` kèm fixture sinh ra nó; không lệnh nào tạo hay sửa file đó.
- [x] `ac-7` (met): `harnix skill harnix-exercise --reference runbook` in mẫu `exercise.md` (lệnh khởi động, cổng, công cụ, dữ liệu cô lập, cách dừng) và có một dòng trỏ tới nó trong SKILL.md; ngân sách token và checklist SKILL.md vẫn đạt.
- [x] `ac-8` (met): `harnix-exercise` hướng dẫn agent, sau lần chạy thật đầu tiên thành công, đề xuất tạo `.harnix/spec/exercise.md` từ lệnh đã dùng và chỉ ghi khi người dùng đồng ý rõ ràng (không ghi tự động); `harnix-verify` hoặc `harnix-implement` nhắc đọc file này khi có.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI contract, ngân sách token, nguồn skill) — pass (2026-11-24 12:03:51 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-24 12:05:59 +07:00)

## Decisions

- **dec-ac1-ac4-already-done** — Bỏ ac-1 và ac-4 sau khi đối chiếu code: --run-check/--run-checks đã trả result, exitCode, durationMs mỗi check và outputTail tối đa 10 mục khi fail (brief bỏ tail); breaker đã truyền currentDigest nên digest mới được chạy lại và test retry-guard "allows rerun after two failures when input digest changes" đã ghim hành vi.
  - _Why:_ Không thêm code thừa; chỉ ghi kết quả kiểm (breaker không đổi theo ràng buộc epic).
- **dec-runbook-doctor-only** — Gợi ý thiếu exercise.md chỉ ở doctor (warning, không fixable); harnix update và init không tạo file này vì .harnix/spec là vùng người dùng sở hữu.
  - _Why:_ Giữ ranh giới không ghi khi không có yêu cầu rõ; người dùng đã yêu cầu chỉ gợi ý.

## Residual risks

- **risk-doctor-warning-exit** (low) — Finding exercise-runbook-missing là warning nên doctor ok:false (exit 1 nếu không có --allow-warnings) với repo có start/dev/serve hoặc bin mà chưa có runbook; hợp lệ theo chính sách warning-trước-error nhưng có thể làm đỏ CI đang chạy doctor. (Mitigation: Không fixable, người dùng tắt bằng --allow-warnings hoặc viết runbook; chưa nâng lên error.)
- **risk-outside-paths-deleted** (low) — commitAdvice.outsidePaths bỏ sót file đã xóa nằm ngoài relevantPaths (không thể so khớp glob với file không còn); chọn bỏ sót thay vì báo nhầm.

## Evidence

- skipped (2026-11-24 12:00:24 +07:00): Task contract revised at persisted replan: Bỏ vế "harnix update nhắc một dòng": update không chạy chẩn đoán doctor, nên thêm đường nhắc riêng là phạm vi thừa so với bằng chứng; doctor là nơi cảnh báo.
- `chk-focused` — pass (2026-11-24 12:03:51 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-24 12:05:59 +07:00): pnpm test — exit 0
