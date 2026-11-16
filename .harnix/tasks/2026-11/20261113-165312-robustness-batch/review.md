# Gom các lỗi độ bền nhỏ của CLI và hook

- **ID:** 20261113-165312-robustness-batch
- **Mode:** lite
- **Epic:** 20261113-165307-agent-feedback-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 16:53:07 +07:00
- **Updated:** 2026-11-13 17:42:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Sửa các lỗi nhỏ đã repro: đường dẫn tương đối bị che trong lệnh, repo-map --refs với mã số, coveredBy sau replace-check, hook lấy nhầm task repo khác và lộ secret khi xem diff cấu hình.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.
- Không chặn lệnh của agent; chỉ nhắc hoặc cảnh báo.

## Relevant paths

- `src/cli-helpers.ts`
- `src/commands/status.ts`
- `src/core/repo-map/refs.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +16 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +4 / -1 |
| `src/commands/pretool-hint.ts` | modified | +41 / -1 |
| `src/commands/status.ts` | modified | +2 / -1 |
| `src/commands/workflow-command.ts` | modified | +6 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -0 |
| `src/commands/workflow-flags.ts` | modified | +2 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +1 / -1 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +14 / -1 |
| `src/configurators/claude.ts` | modified | +1 / -1 |
| `src/core/platform/facts.ts` | modified | +1 / -1 |
| `src/core/repo-map/refs.ts` | modified | +3 / -2 |
| `src/core/stack/dotnet-projects.ts` | modified | +9 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -1 |
| `src/core/workflow/check-output.ts` | modified | +23 / -0 |
| `src/core/workflow/init-artifacts.ts` | added | - |
| `src/core/workflow/init-task.ts` | modified | +5 / -8 |
| `src/core/workflow/plan-sync.ts` | modified | +32 / -5 |
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
| `test/unit/cli-helpers.test.ts` | modified | +8 / -0 |
| `test/unit/commands/pretool-hint.test.ts` | modified | +35 / -0 |
| `test/unit/commands/status.test.ts` | modified | +14 / -0 |
| `test/unit/core/repo-map/refs.test.ts` | modified | +14 / -0 |

_(7 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Thông báo lỗi giữ nguyên đường dẫn tương đối của lệnh check (ví dụ `.harnix/tmp/...`) thay vì thay bằng `[PATH]`.
- [x] `ac-2` (met): `harnix repo-map --refs` nhận mã định danh toàn số như `00908` mà vẫn giữ giới hạn độ dài.
- [x] `ac-3` (met): `coveredBy` của tiêu chí không liệt kê check đã bị thay bởi --replace-check.

## Required checks

- [x] `chk-1` (focused): Test tập trung của robustness-batch — pass (2026-11-13 17:34:53 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-13 17:41:56 +07:00)

## Decisions

- **d-hook-context-dropped** — Bỏ mục hook lấy nhầm task repo khác và mục cảnh báo secret khi xem diff cấu hình khỏi member này.
  - _Why:_ Không repro được trong repo này (hook chỉ đọc task của root đích theo cwd sự kiện) và việc in secret là hành vi của agent chứ không phải lỗi sản phẩm; nếu gặp lại sẽ mở task riêng kèm bằng chứng.

## Evidence

- `chk-1` — pass (2026-11-13 17:34:53 +07:00): pnpm exec vitest run test/unit/cli-helpers.test.ts test/unit/core/repo-map/refs.test.ts test/unit/commands/status.test.ts — exit 0
- `chk-2` — pass (2026-11-13 17:41:56 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
