# Cải thiện công thái học của workflow --init

- **ID:** 20261113-165311-init-ergonomics
- **Mode:** lite
- **Epic:** 20261113-165307-agent-feedback-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 16:53:07 +07:00
- **Updated:** 2026-11-13 17:28:19 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

--init in thư mục task, nạp prd.md và plan.md từ file ngay lúc khởi tạo, và lỗi cờ lặp có hint nêu dạng danh sách đúng.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.
- Không chặn lệnh của agent; chỉ nhắc hoặc cảnh báo.

## Relevant paths

- `src/commands/workflow-command.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-lifecycle-handlers.ts`
- `src/core/workflow/init-task.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/commands/pretool-hint.ts` | modified | +29 / -1 |
| `src/commands/workflow-command.ts` | modified | +6 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -0 |
| `src/commands/workflow-flags.ts` | modified | +2 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +1 / -1 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +14 / -1 |
| `src/configurators/claude.ts` | modified | +1 / -1 |
| `src/core/platform/facts.ts` | modified | +1 / -1 |
| `src/core/stack/dotnet-projects.ts` | modified | +9 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -1 |
| `src/core/workflow/check-output.ts` | modified | +21 / -0 |
| `src/core/workflow/init-artifacts.ts` | added | - |
| `src/core/workflow/init-task.ts` | modified | +5 / -8 |
| `src/core/workflow/plan-sync.ts` | modified | +27 / -5 |
| `src/core/workflow/ready.ts` | modified | +13 / -1 |
| `src/core/workflow/run-check.ts` | modified | +6 / -1 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/suite-command.ts` | modified | +27 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +2 / -1 |
| `test/integration/commands/workflow-handlers.test.ts` | modified | +2 / -2 |
| `test/integration/commands/workflow-lifecycle-handlers.test.ts` | added | - |
| `test/platform/claude-global.test.ts` | modified | +1 / -1 |
| `test/platform/settings-json-fidelity.test.ts` | modified | +3 / -3 |
| `test/unit/commands/pretool-hint.test.ts` | modified | +30 / -0 |
| `test/unit/core/workflow/check-output.test.ts` | modified | +22 / -1 |
| `test/unit/core/workflow/init-artifacts.test.ts` | added | - |
| `test/unit/core/workflow/plan-sync.test.ts` | modified | +49 / -3 |
| `test/unit/core/workflow/run-check.test.ts` | modified | +12 / -0 |
| `test/unit/core/workflow/suite-command.test.ts` | modified | +15 / -1 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -1 |

_(1 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Kết quả --init chứa đường dẫn thư mục task theo dạng tương đối của repository.
- [x] `ac-2` (met): --init nhận --prd-file và --plan-file cho task Full, nội dung được ghi thay cho mẫu.

## Required checks

- [x] `chk-1` (focused): Test tập trung của init-ergonomics — pass (2026-11-13 17:26:21 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-13 17:27:53 +07:00)

## Decisions

- **d-criteria-already-repeatable** — Cờ danh sách --criteria/--check/--criterion đã nhận cả dạng lặp lẫn dấu phẩy (joinList, help ghi rõ) nên bỏ criterion về lỗi cờ lặp khỏi member này.
  - _Why:_ Đối chiếu code: workflow-command.ts dùng joinList cho các cờ danh sách, nên phản hồi cũ không còn đúng.

## Evidence

- skipped (2026-11-13 17:23:39 +07:00): Task contract revised at persisted replan: Test tích hợp được đổi tên để phản chiếu src/commands/workflow-lifecycle-handlers.ts theo test-structure
- `chk-1` — pass (2026-11-13 17:26:21 +07:00): pnpm exec vitest run test/unit/core/workflow/init-artifacts.test.ts test/integration/commands/workflow-lifecycle-handlers.test.ts test/unit/core/workflow/init-task.test.ts test/integration/commands... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-2` — pass (2026-11-13 17:27:53 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
