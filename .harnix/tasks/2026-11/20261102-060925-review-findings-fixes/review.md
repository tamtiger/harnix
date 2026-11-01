# Sửa các phát hiện của đợt review lại epic harnix-session-review

- **ID:** 20261102-060925-review-findings-fixes
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-02 06:09:25 +07:00
- **Updated:** 2026-11-02 06:23:09 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Sửa toàn bộ phát hiện A-I của đợt review lại epic harnix-session-review, gộp vào mục 2.24.0 chưa phát hành, không bump version.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +15 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +5 / -4 |
| `docs/HARNIX_WORKFLOW.md` | modified | +5 / -3 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +3 / -1 |
| `src/cli-hints.ts` | modified | +25 / -0 |
| `src/commands/archive.ts` | modified | +2 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +2 / -2 |
| `src/commands/context-report.ts` | modified | +2 / -2 |
| `src/commands/epic.ts` | modified | +27 / -4 |
| `src/commands/internal-context.ts` | modified | +7 / -22 |
| `src/commands/learning.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -2 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +4 / -12 |
| `src/commands/status.ts` | modified | +9 / -19 |
| `src/commands/tasks.ts` | modified | +2 / -2 |
| `src/commands/workflow-flags.ts` | modified | +19 / -6 |
| `src/core/context/session-cache.ts` | added | - |
| `src/core/epics/epic-location.ts` | modified | +9 / -0 |
| `src/core/epics/epic.ts` | modified | +3 / -2 |
| `src/core/global/setup.ts` | modified | +1 / -1 |
| `src/core/spec/project-skills.ts` | modified | +4 / -0 |
| `src/core/stack/verify-detection.ts` | modified | +27 / -19 |
| `src/core/stack/workspace-detection.ts` | modified | +8 / -17 |
| `src/core/tasks/read-tracker.ts` | modified | +6 / -2 |
| `src/core/workflow/epic-replay.ts` | added | - |
| `src/core/workflow/run-check.ts` | modified | +18 / -5 |
| `src/core/workflow/save.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-notes.md` | modified | +3 / -0 |
| `src/templates/harnix/workflow.md` | modified | +8 / -4 |
| `src/utils/atomic-write.ts` | modified | +26 / -2 |
| `src/utils/project-discovery.ts` | modified | +8 / -0 |

_(22 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Đọc file dùng biên là root dự án: junction thư mục thoát root bị chặn, symlink anh em trong repo vẫn đọc được
- [x] `ac-2` (met): Hint --set-baseline và hint cờ id --remove-* đúng với hành vi thật
- [x] `ac-3` (met): findNextEpic giữ best-effort cho status khi thư mục epics không an toàn, resume --next vẫn báo lỗi rõ
- [x] `ac-4` (met): Cache context hit chạm mtime (LRU) và test không còn assert luôn đúng
- [x] `ac-5` (met): Repair epic khi .active còn hoặc replay epic khác nội dung có notice (hoặc ghi decision bỏ)
- [x] `ac-6` (met): Tài liệu frozen và CHANGELOG 2.24.0 đồng bộ, không còn chuỗi 2.24.0-dev, gates xanh

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-02 06:22:03 +07:00)
- [x] `chk-focused` (focused): chk-focused — pass (2026-11-02 06:16:22 +07:00)
- [x] `chk-gates` (focused): chk-gates — pass (2026-11-02 06:16:34 +07:00)
- [x] `chk-suite` (focused): chk-suite — pass (2026-11-02 06:18:24 +07:00)

## Decisions

- **dec-1** — Các sửa gộp vào mục 2.24.0 chưa phát hành: không bump version, không chạy version:sync, chỉ sửa CHANGELOG bằng tay.
  - _Why:_ Bản 2.24.0 chưa phát hành, tránh tạo thêm phiên bản.
- **dec-2** — Mục F không phải lỗi: persistCandidate ghi task rồi epic, còn .active chỉ đặt sau persist; khi .active còn thì gửi lại cùng envelope đi nhánh save thường và upsert epic. Test hồi quy xác nhận, không sửa code.
  - _Why:_ Test kịch bản .active còn đã xanh ngay lần đầu.
- **dec-3** — Mục D: status khi không có task active bọc findNextEpic bằng catch (best-effort, bỏ epicContext); resume --next giữ lỗi rõ về đường dẫn thoát root. Mục G: replay giữ epic đã lưu và in notice trên stderr, JSON không đổi. Mục J bỏ qua có chủ đích; JSDoc atomic-write đã nói caller's job.
  - _Why:_ Giữ hợp đồng JSON, chỉ thêm notice.

## Evidence

- `chk-focused` — pass (2026-11-02 06:16:22 +07:00): pnpm exec vitest run test/unit/utils/safe-read.test.ts test/unit/core/context/session-cache.test.ts test/unit/core/workflow/epic-replay.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-02 06:16:34 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-02 06:18:24 +07:00): pnpm test — exit 0
- `check-suite` — pass (2026-11-02 06:22:03 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
