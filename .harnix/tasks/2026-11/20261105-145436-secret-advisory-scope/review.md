# Chẩn đoán gate: secretAdvisory theo diff, baseline-accepted ở status, lỗi digest file đã xóa

- **ID:** 20261105-145436-secret-advisory-scope
- **Mode:** lite
- **Epic:** 20261105-145432-workflow-friction-v2
- **Status:** completed/finishing
- **Created:** 2026-11-05 14:54:32 +07:00
- **Updated:** 2026-11-09 11:19:51 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 7/7 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Làm các thông báo chẩn đoán đúng và đủ: secretAdvisory chỉ quét file thuộc diff của task, status hiện check đỏ đã được baseline chấp nhận, và lỗi input digest cho file đã xóa nêu glob thư mục cha thay thế.

## Relevant paths

- `src/commands/status.ts`
- `src/core/verification/check-report.ts`
- `src/core/verification/input-digest.ts`
- `src/core/workflow/finish.ts`
- `src/core/workflow/run-check.ts`
- `src/core/workflow/schema.ts`
- `src/core/workflow/secret-scan.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/prompts/repo-graph-tools-research.md` | added | - |
| `package.json` | modified | +1 / -1 |
| `src/commands/checks.ts` | modified | +11 / -1 |
| `src/commands/status.ts` | modified | +10 / -1 |
| `src/commands/workflow-command.ts` | modified | +0 / -2 |
| `src/core/tasks/task-state.ts` | modified | +2 / -4 |
| `src/core/tasks/transition-hint.ts` | added | - |
| `src/core/verification/input-digest.ts` | modified | +5 / -2 |
| `src/core/verification/input-hint.ts` | added | - |
| `src/core/workflow/baseline-status.ts` | added | - |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/secret-scan-changes.ts` | added | - |
| `src/core/workflow/secret-scan.ts` | modified | +20 / -7 |
| `src/core/workflow/suite-gate.ts` | modified | +2 / -13 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/epic.md` | modified | +4 / -0 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +1 / -1 |
| `test/integration/commands/workflow-command.test.ts` | modified | +12 / -0 |
| `test/unit/core/tasks/transition-hint.test.ts` | added | - |
| `test/unit/core/verification/input-hint.test.ts` | added | - |
| `test/unit/core/workflow/baseline-status.test.ts` | added | - |
| `test/unit/core/workflow/secret-scan-changes.test.ts` | added | - |
| `test/unit/core/workflow/secret-scan.test.ts` | modified | +44 / -0 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -2 |
| `test/workflow/check-edits-verifying.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): secretAdvisory chỉ quét các file thay đổi so với HEAD (git status/diff, gồm file chưa theo dõi) giao với relevantPaths và inputs của check; file không đổi trong task không bao giờ xuất hiện trong advisory.
- [x] `ac-2` (met): Ngoài git hoặc không đọc được diff thì quay về hành vi hiện tại và ghi chú trong hint; waiver bằng comment hiện có vẫn hoạt động.
- [x] `ac-3` (met): Mô tả secretAdvisory trong --schema (schema.ts) và workflow docs nêu phạm vi mới (chỉ file đổi trong task); Tài liệu và snapshot đồng bộ: docs/HARNIX_WORKFLOW.md, src/templates/harnix/workflow.md (chạy pnpm selfhost:sync), mô tả --schema và docs/HARNIX_PRD.md nếu bề mặt công khai đổi; behavior-snapshot.golden.json chỉ cập nhật cho đúng chuỗi mới; phiên bản bump 2.29.0-dev.N kèm CHANGELOG trước verifying.
- [x] `ac-4` (met): Khi một input glob không match file nào, lỗi nêu input đó, thư mục cha gần nhất còn tồn tại và lệnh mẫu với glob <dir>/** để dùng thay; thông điệp xuất hiện ở --run-check, --snapshot và --set-check.
- [x] `ac-5` (met): Không thêm loại check mới và không đổi công thức digest; glob thư mục cha còn tồn tại vẫn sinh digest hợp lệ (có test).
- [x] `ac-6` (met): harnix status --checks và --explain đánh dấu check có baseline với latest run fail đủ điều kiện finish là baseline.accepted true; không đổi trạng thái hay kết quả gate (authorizedRedBaseline dùng chung một hàm đánh giá).
- [x] `ac-7` (met): Khi baseline đã khai nhưng chưa đủ điều kiện để finish chấp nhận (latest run không phải fail, classification không thuộc pre-existing hoặc environment, baseline.result là pass, hoặc chưa có required check khác không baseline đã pass phủ cùng criteria), status nêu lý do cụ thể thay vì để im.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 11:17:25 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 11:19:21 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 11:17:33 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 11:17:25 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/core/verification test/unit/commands — exit 0
- `chk-gates` — pass (2026-11-09 11:17:33 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-09 11:19:21 +07:00): pnpm test — exit 0
