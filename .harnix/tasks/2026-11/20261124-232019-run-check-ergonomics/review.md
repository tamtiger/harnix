# Chạy check bớt ma sát: run-check không nhắc lệnh, log lỗi đầy đủ, batch finish có run-checks

- **ID:** 20261124-232019-run-check-ergonomics
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 23:20:19 +07:00
- **Updated:** 2026-11-25 18:13:28 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-log-sensitive: low |

## Goal

Bỏ ma sát khi chạy check: --run-check lấy lệnh từ khai báo, log lỗi đầy đủ đọc lại được, và chuỗi hoàn tất task chạy được trong một lệnh batch.

## Relevant paths

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `scripts/exercise-run-check.mjs`
- `src/commands/workflow-batch.ts`
- `src/commands/workflow-command.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-handlers.ts`
- `src/core/status.ts`
- `src/core/workflow/actions.ts`
- `src/core/workflow/check-log.ts`
- `src/core/workflow/check-output.ts`
- `src/core/workflow/run-check.ts`
- `src/core/workflow/run-checks.ts`
- `src/core/workflow/schema.ts`
- `src/core/workflow/secret-scan.ts`
- `src/templates/harnix/workflow.md`
- `test/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -0 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-run-check.mjs` | added | - |
| `src/commands/workflow-batch.ts` | added | - |
| `src/commands/workflow-command.ts` | modified | +8 / -0 |
| `src/commands/workflow-flags.ts` | modified | +18 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -6 |
| `src/core/status.ts` | modified | +4 / -2 |
| `src/core/workflow/check-log.ts` | added | - |
| `src/core/workflow/check-output.ts` | modified | +3 / -0 |
| `src/core/workflow/checks-batch.ts` | added | - |
| `src/core/workflow/index.ts` | modified | +1 / -0 |
| `src/core/workflow/run-check.ts` | modified | +43 / -7 |
| `src/core/workflow/run-checks.ts` | modified | +3 / -0 |
| `src/core/workflow/schema.ts` | modified | +2 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +14 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
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
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +6 / -3 |
| `src/skills/harnix-verify/references/evidence.md` | modified | +1 / -1 |
| `src/templates/harnix/workflow.md` | modified | +2 / -2 |
| `test/integration/commands/workflow-batch.test.ts` | added | - |
| `test/integration/commands/workflow-command.test.ts` | modified | +1 / -1 |
| `test/integration/commands/workflow-handlers.test.ts` | modified | +10 / -1 |
| `test/integration/scenarios/cli-real-process.test.ts` | modified | +8 / -1 |
| `test/unit/core/status.test.ts` | modified | +13 / -0 |
| `test/unit/core/workflow/check-log.test.ts` | added | - |
| `test/unit/core/workflow/checks-batch.test.ts` | added | - |
| `test/unit/core/workflow/index.test.ts` | modified | +1 / -0 |
| `test/unit/core/workflow/run-check.test.ts` | modified | +2 / -2 |
| `test/unit/core/workflow/run-checks.test.ts` | modified | +10 / -1 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -2 |
| `test/workflow/run-check-exercise.test.ts` | added | - |
| `test/workflow/run-check-log.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): `harnix workflow --run-check <id>` không có `--` chạy đúng lệnh và cwd đã khai báo của check (không qua shell, cùng đường thực thi với `--run-checks`); argv truyền vào mà khác khai báo vẫn bị từ chối kèm hint.
- [x] `ac-2` (met): Khi một check fail, output tới trần 64 KB được ghi vào `.harnix/tmp/check-logs/<id>.log` (git-ignored, che đường dẫn tuyệt đối, mã ANSI và chuỗi giống secret, nằm ngoài input digest) và kết quả CLI có `logPath`; lần pass không ghi log; không thêm trường nào vào evidence hay TaskRecord.
- [x] `ac-3` (met): `--run-checks` được phép đứng cùng `--criterion <ids> --met`, `--transition verifying/finishing` và `--finish` (thứ tự cố định run-checks, criterion, transition, finish); task đang `in_progress` được tự chuyển `verifying/verifying` trước khi chạy; dừng ở lần fail đầu (task giữ `verifying`, báo `ran`, `remaining` và các bước `skipped`); task ở trạng thái khác `in_progress` hoặc `verifying` bị từ chối kèm hint; trong batch này `--finish` chỉ hợp lệ khi có cả `--transition verifying/finishing`; `status --explain` `nextAction` kèm lệnh batch gợi ý. Không gộp `ready/ready`, bước ủy quyền triển khai hay review.
- [x] `ac-4` (met): `WORKFLOW_ACTIONS`, `--schema`, workflow-flag-owners, golden (chỉ chuỗi mới), docs (HARNIX_WORKFLOW, PRD), CHANGELOG và phiên bản `2.40.0-dev.1` đồng bộ; template `workflow.md` chỉ đổi dòng cookbook sẵn có (không tăng quá mức, ngân sách còn dư khoảng 200 token cho cả epic); kiểm bằng CLI thật qua `scripts/exercise-run-check.mjs` trong dự án tạm (không nhắc lệnh, check fail để lại log, batch finish).

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-25 18:13:07 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-25 18:11:09 +07:00)
- [x] `chk-exercise-run-check` (focused): Exercise: chạy CLI build thật trong dự án tạm, run-check không nhắc lệnh, log lỗi và batch finish — pass (2026-11-25 18:13:19 +07:00)

## Decisions

- **dec-scope-dropped** — Không làm: hook Edit/Write chặn hoặc cảnh báo sửa code (chỉ phủ Claude, thêm đọc task.json mỗi lần Edit, ranh giới hook không giữ state mờ); action --complete mới (chỉ mở rộng batch sẵn có, giữ ready/await, ủy quyền triển khai và review); lưu digest lúc vào planning (đổi schema TaskRecord đóng băng); bộ đếm mức dùng skill trong harnix (không telemetry, làm lệnh đọc thành ghi); member epic dạng Full.
  - _Why:_ Đối chiếu 3 báo cáo review với mã và AGENTS.md; xem research.md của epic.
- **dec-log-fail-only** — Log lỗi chỉ ghi khi check fail, ghi đè mỗi lần, tối đa 64 KB, ở .harnix/tmp/check-logs (git-ignored), đã che đường dẫn, ANSI và chuỗi giống secret. Đây là lần đầu harnix lưu output lệnh ra đĩa, đảo quyết định ghi ở run-check.ts (never persisted); cần người dùng xác nhận khi duyệt epic.
  - _Why:_ Cần xác nhận của người dùng; phương án nhẹ hơn là nới đuôi tóm tắt 600 lên khoảng 2000 ký tự và bỏ log.
- **dec-workflow-md-budget** — Template workflow.md còn dư khoảng 200 token cho cả epic: chỉ member 1 (sửa dòng cookbook sẵn có, không tăng) và member 6 (một dòng cho --scaffold-docs) được chạm; các member khác viết vào docs/HARNIX_WORKFLOW.md, PRD hoặc reference, không nâng token-budgets.json.
  - _Why:_ Trần token chỉ chặn tăng; không nâng để một thay đổi qua test.
- **dec-batch-autotransition** — Batch --run-checks tự chuyển task in_progress sang verifying/verifying qua transitionWorkflow (đủ cổng của transition) và từ chối task ready hoặc planning kèm hint, nên batch không thay thế cổng ready, ủy quyền triển khai hay review; --finish trong batch luôn đi kèm --transition verifying/finishing.
  - _Why:_ Giữ điểm dừng bắt buộc của quy trình; chuỗi ngắn hơn mà không thêm action mới (không dùng --complete).
- **dec-log-fail-only-done** — Log lỗi của check chỉ ghi khi fail ở .harnix/tmp/check-logs/<id>.log (ghi đè, 64 KB cuối, bỏ ANSI, đường dẫn máy và chuỗi giống secret bằng rule của secret-scan), pass xóa log cũ; log nằm ngoài input digest (kiểm bằng test snapshot), không vào evidence hay TaskRecord, và việc ghi log lỗi không làm hỏng việc ghi evidence.
  - _Why:_ Đảo quyết định cũ never persisted của run-check.ts theo xác nhận mặc định của người dùng khi duyệt epic; phương án nhẹ hơn là chỉ nới đuôi tóm tắt.

## Residual risks

- **risk-log-sensitive** (low) — Log lỗi lưu output lệnh ra đĩa (git-ignored): rule che secret là heuristic nên một giá trị nhạy cảm không khớp rule vẫn có thể nằm trong log cục bộ; lệnh batch không chạy được trên task chưa start nên agent vẫn phải ghi ready và ủy quyền triển khai bằng tay.

## Evidence

- `chk-focused` — pass (2026-11-25 18:11:09 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-exercise-run-check` — pass (2026-11-25 18:13:19 +07:00): mode: full - scripts/exercise-run-check.mjs chạy dist/cli.js 2.40.0-dev.1 thật trong dự án tạm với npm test: run-check không nhắc lệnh chạy đúng lệnh khai báo, check fail để lại log đã che đường dẫn máy, lệnh khác khai báo bị từ chối, batch gặp check fail dừng với skipped và task giữ verifying, batch cuối hoàn tất task bằng một lệnh; 0 failed _(3 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-25 18:13:07 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
