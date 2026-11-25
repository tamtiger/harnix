# Advisory không chặn: sửa code trước in_progress, tiêu chí nháp cũ, thiếu Could-Not-Verify, dòng premortem

- **ID:** 20261124-232020-workflow-advisories
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 23:20:20 +07:00
- **Updated:** 2026-11-25 18:57:51 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Cảnh báo sớm nhưng không chặn: sửa code trước in_progress, tiêu chí nháp đã cũ, bằng chứng chỉ code-only mà chưa ghi rủi ro, và câu hỏi premortem ở ready-review.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/*`
- `package.json`
- `scripts/exercise-advisories.mjs`
- `src/commands/workflow-handlers.ts`
- `src/core/workflow/*`
- `src/skills/harnix-implement/SKILL.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/skills/harnix-plan/references/ready-review.md`
- `test/unit/core/workflow/*`
- `test/workflow/*`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +3 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +4 / -2 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-advisories.mjs` | added | - |
| `scripts/exercise-run-check.mjs` | added | - |
| `src/commands/workflow-batch.ts` | added | - |
| `src/commands/workflow-command.ts` | modified | +8 / -0 |
| `src/commands/workflow-flags.ts` | modified | +18 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -6 |
| `src/core/status.ts` | modified | +4 / -2 |
| `src/core/workflow/check-log.ts` | added | - |
| `src/core/workflow/check-output.ts` | modified | +3 / -0 |
| `src/core/workflow/checks-batch.ts` | added | - |
| `src/core/workflow/evidence-mode-advisory.ts` | added | - |
| `src/core/workflow/exercise-advisory.ts` | modified | +6 / -1 |
| `src/core/workflow/finish-advice.ts` | modified | +3 / -13 |
| `src/core/workflow/git-advisories.ts` | added | - |
| `src/core/workflow/index.ts` | modified | +1 / -0 |
| `src/core/workflow/ready-review.ts` | modified | +1 / -0 |
| `src/core/workflow/relevant-paths.ts` | added | - |
| `src/core/workflow/run-check.ts` | modified | +43 / -7 |
| `src/core/workflow/run-checks.ts` | modified | +3 / -0 |
| `src/core/workflow/schema.ts` | modified | +2 / -2 |
| `src/core/workflow/secret-scan-changes.ts` | modified | +3 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +14 / -0 |
| `src/core/workflow/transition-advisories.ts` | added | - |
| `src/core/workflow/transition.ts` | modified | +9 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/ready-review.md` | modified | +1 / -0 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +6 / -3 |
| `src/skills/harnix-verify/references/evidence.md` | modified | +1 / -1 |
| `src/templates/harnix/workflow.md` | modified | +2 / -2 |
| `test/README.md` | modified | +1 / -0 |
| `test/integration/commands/workflow-batch.test.ts` | added | - |

_(18 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): `--transition ready/ready --dry-run` và `--transition in_progress/implementing` thêm advisory khi `git status` thấy file đổi trong `relevantPaths` lúc task còn `planning` hoặc `ready`, nêu tên file (tối đa 5); không có git hoặc cây sạch thì im lặng; chỉ thông tin, không đổi `valid`, exit code hay TaskRecord.
- [x] `ac-2` (met): `ready --dry-run` thêm advisory cho task có `createdAt` đã quá N ngày hoặc đã có commit chạm `relevantPaths` kể từ `createdAt` (nêu số ngày và số commit), tính từ `git log` chỉ đọc; im lặng khi không có git hoặc `relevantPaths` rỗng; N chốt bằng decision.
- [x] `ac-3` (met): `--transition verifying/finishing` hoặc `--finish --brief` thêm advisory khi evidence tươi nhất của tiêu chí quan sát được có `mode: code-only` hoặc `partial` mà task chưa có residual risk; có risk thì im lặng; không chặn.
- [x] `ac-4` (met): `READY_REVIEW_CHECKLIST` có thêm một dòng premortem ngắn (điều gì sai nhất làm plan thất bại và check nào bắt nó); test ready-review và parity với reference ready-review cập nhật; không nâng trần token.
- [x] `ac-5` (met): Tài liệu (HARNIX_WORKFLOW, PRD), một dòng trong `harnix-implement` nhắc advisory, CHANGELOG và phiên bản `2.40.0-dev.2` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-advisories.mjs` trong repo git tạm (sửa file trước in_progress, member cũ, code-only không có risk).

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-25 18:57:39 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-25 18:55:24 +07:00)
- [x] `chk-exercise-advisories` (focused): Exercise: chạy CLI build thật trong repo git tạm, kiểm advisory sửa code sớm, tiêu chí cũ, code-only không risk, dòng premortem — pass (2026-11-25 18:57:45 +07:00)

## Decisions

- **dec-advisory-vs-head** — Advisory sửa code trước in_progress so với git status trong relevantPaths, không lưu digest nên có thể dương tính giả khi repo đã bẩn từ trước và im lặng khi không có git; ngưỡng N ngày của advisory tiêu chí cũ do member chốt bằng decision (đề xuất 3 ngày hoặc có commit chạm relevantPaths).
  - _Why:_ Lưu digest cần thêm trường TaskRecord, vi phạm schema đóng băng.
- **dec-stale-threshold** — Advisory tiêu chí nháp cũ chạy khi task còn planning và (createdAt đã quá 3 ngày HOẶC có ít nhất 1 commit chạm relevantPaths kể từ createdAt, đếm bằng git log --since chỉ đọc); im lặng khi không có git hoặc relevantPaths rỗng.
  - _Why:_ Chốt N=3 theo đề xuất trong research.md mục 2 điểm 4; chỉ thông tin, không đổi valid hay exit code.
- **dec-advisory-surface** — Các advisory mới hiện ở mảng advisories của --transition --dry-run (target ready, in_progress/implementing, verifying/finishing) và được in dạng 'notice:' trên stderr khi chuyển thật sang in_progress/implementing hoặc verifying/finishing; không thêm trường vào TaskRecord hay vào JSON của --finish.
  - _Why:_ Kênh dry-run sẵn có và stderr notice (giống cảnh báo checklist) là nơi agent chắc chắn đọc; --finish --brief giữ nguyên để không đổi hợp đồng đầu ra.
- **trace-edited-before-ready** — Đã viết mã, test và script exercise của member này khi task còn planning vì phiên làm việc trước bị ngắt; ready/ready --dry-run sau đó tự bắt đúng điều này: advisory 'Files inside relevantPaths already changed while the task is planning' liệt kê AGENTS.md, CHANGELOG.md, README.md, docs/... và 37 file khác (lẫn thay đổi chưa commit của member 1, đúng như giới hạn heuristic so với HEAD đã ghi ở dec-advisory-vs-head). Ghi nhận đây là bằng chứng thật của ac-1 và là lỗi quy trình đã nêu trong phản hồi điểm 1.
  - _Why:_ Minh bạch việc sửa mã trước ready; không đổi nghĩa vụ nào, tiêu chí và check đã khai báo từ đầu vẫn là hợp đồng được freeze ở ready.

## Evidence

- `chk-focused` — pass (2026-11-25 18:55:24 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-exercise-advisories` — pass (2026-11-25 18:57:45 +07:00): mode: full; node scripts/exercise-advisories.mjs chạy dist/cli.js thật trong repo git tạm: 10 ca (file đổi trong relevantPaths lúc planning, cây sạch, đổi ngoài relevantPaths, notice stderr khi chuyển ready thật, commit chạm relevantPaths, draft mới, code-only không risk, có risk, full, dòng premortem) đều khớp _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-25 18:57:39 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
