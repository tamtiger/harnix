# Sửa xử lý đầu vào và lỗi của lớp commands

- **ID:** 20261110-131154-commands-input-fixes
- **Mode:** lite
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 13:52:42 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Làm các cờ --input, --evidence --criterion, --file và status nhất quán với --init và với các command khác, không còn bỏ qua im lặng hay báo lỗi nghèo hint.

## Non-goals

- Không thêm cờ hay action mới
- Không chuyển logic sang core trong member này

## Relevant paths

- `src/commands`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +28 / -28 |
| `package.json` | modified | +1 / -1 |
| `src/commands/pause.ts` | modified | +2 / -1 |
| `src/commands/resume.ts` | modified | +7 / -3 |
| `src/commands/status.ts` | modified | +4 / -7 |
| `src/commands/workflow-handler-utils.ts` | modified | +22 / -7 |
| `src/commands/workflow-handlers.ts` | modified | +12 / -3 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +11 / -7 |
| `src/core/epics/epic.ts` | modified | +15 / -2 |
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
| `test/integration/commands/pause.test.ts` | modified | +52 / -0 |
| `test/safety/process-timeout.test.ts` | added | - |
| `test/unit/commands/status.test.ts` | modified | +10 / -0 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +41 / -0 |
| `test/unit/commands/workflow-lifecycle-handlers.test.ts` | modified | +14 / -0 |
| `test/unit/core/epics/epic.test.ts` | modified | +50 / -0 |
| `test/unit/core/tasks/task-resume.test.ts` | modified | +31 / -1 |
| `test/unit/core/workflow/plan-sync.test.ts` | modified | +51 / -1 |
| `test/unit/core/workflow/workflow-lock.test.ts` | modified | +24 / -0 |
| `test/unit/utils/check-runner.test.ts` | modified | +1 / -1 |
| `test/unit/utils/git.test.ts` | modified | +48 / -4 |
| `test/unit/utils/harnix-launcher.test.ts` | modified | +18 / -6 |
| `test/unit/utils/process-group.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): --set-check và --replace-check tách --input bằng splitGlobList như --init, nên src/{a,b}/** và đường dẫn có khoảng trắng giữ nguyên; có test.
- [x] `ac-2` (met): --evidence --criterion --met qua envelope hoặc stdin báo lỗi rõ hoặc đánh dấu criteria, không bỏ qua im lặng; có test.
- [x] `ac-3` (met): Lỗi chưa khởi tạo của status (mọi chế độ chiếu) có dòng Gợi ý như các command khác; có test.
- [x] `ac-4` (met): --file bị giới hạn kích thước như stdin và JSON hỏng báo lỗi chuẩn có hint; có test.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 13:50:01 +07:00)
- [x] `chk-gates` (focused): Contract tests nhanh (CLI, docs, cấu trúc test) — pass (2026-11-10 13:50:23 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 13:52:31 +07:00)

## Decisions

- **keep-summary-over-explain** — Giữ --summary thắng --explain trong resolveStatusMode.
  - _Why:_ Test status-mode.test.ts khóa thứ tự này như hợp đồng công khai; đổi sang lỗi là đổi hành vi ngoài phạm vi sửa lỗi.

## Evidence

- skipped (2026-11-10 13:46:50 +07:00): Task contract revised at persisted replan: Test status-mode hiện hành ghi rõ --summary thắng --explain là thứ tự ưu tiên có chủ đích của hợp đồng công khai, nên không đổi thành lỗi trong task này.
- `chk-focus` — pass (2026-11-10 13:50:01 +07:00): pnpm exec vitest run test/unit/commands test/integration/commands — exit 0
- `chk-gates` — pass (2026-11-10 13:50:23 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-10 13:52:31 +07:00): pnpm test — exit 0
