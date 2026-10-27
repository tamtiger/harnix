# Quy ước File Tạm Kiểm thử, Hướng dẫn An toàn Shell Windows và Git Safety Rules

- **ID:** 20261024-202204-shell-guidelines-scratch-dir-and-git-safety
- **Mode:** lite
- **Epic:** 20261024-202200-harnix-dx-workflow-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-24 21:24:00 +07:00
- **Updated:** 2026-10-24 22:30:56 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Giải quyết Vấn đề 6, 7 & Git Safety: (1) Chuẩn hóa thư mục scratch .harnix/tmp/ cho kiểm thử và scripts phụ trợ; (2) Hướng dẫn an toàn shell Windows và khuyến nghị --file cho UTF-8; (3) Bổ sung quy tắc Git safety trong AGENTS.md (kiểm tra branch trước commit, cấm pipe checkout); (4) Tối ưu hóa hook ngữ cảnh tránh lặp guides không cần thiết.

## Non-goals

- Không thay đổi cấu trúc repository ngoài các tài liệu và hook được chỉ định
- Không can thiệp vào các branch Git khác

## Relevant paths

- `docs/HARNIX_WORKFLOW.md`
- `rules/AGENTS.md`
- `AGENTS.md`
- `src/commands/internal-context.ts`
- `test/workflow/docs-task-contract.test.ts`
- `test/unit/commands/internal-context.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -1 |
| `docs/HARNIX_PRD.md` | modified | +5 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +6 / -3 |
| `package.json` | modified | +1 / -1 |
| `src/cli-workflow-commands.ts` | modified | +16 / -2 |
| `src/commands/internal-context.ts` | modified | +35 / -3 |
| `src/commands/status.ts` | modified | +42 / -0 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flags.ts` | modified | +4 / -2 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +21 / -5 |
| `src/core/workflow/check-output.ts` | modified | +7 / -1 |
| `src/core/workflow/completion.ts` | modified | +12 / -2 |
| `src/core/workflow/index.ts` | modified | +2 / -0 |
| `src/core/workflow/init-task.ts` | modified | +5 / -4 |
| `src/core/workflow/obligations.ts` | modified | +50 / -25 |
| `src/core/workflow/plan-sync.ts` | modified | +107 / -1 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -2 |
| `src/core/workflow/schema.ts` | modified | +50 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +1 / -1 |
| `src/core/workflow/transition.ts` | modified | +12 / -1 |
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
| `src/templates/harnix/activation.ts` | modified | +2 / -2 |
| `test/unit/commands/internal-context.test.ts` | added | - |
| `test/unit/commands/status.test.ts` | modified | +27 / -1 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +1 / -0 |
| `test/unit/core/tasks/task-validate-contracts.test.ts` | modified | +24 / -0 |
| `test/unit/core/workflow/check-output.test.ts` | modified | +1 / -0 |
| `test/unit/core/workflow/index.test.ts` | modified | +3 / -0 |
| `test/unit/core/workflow/obligations.test.ts` | modified | +51 / -59 |
| `test/unit/core/workflow/plan-sync.test.ts` | modified | +111 / -1 |
| `test/unit/core/workflow/replace-check.test.ts` | modified | +12 / -3 |
| `test/unit/core/workflow/schema.test.ts` | modified | +12 / -0 |
| `test/unit/core/workflow/set-criterion.test.ts` | modified | +11 / -5 |
| `test/unit/core/workflow/transition.test.ts` | modified | +16 / -2 |

_(5 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Cập nhật tài liệu quy trình docs/HARNIX_WORKFLOW.md, rules/AGENTS.md và root AGENTS.md làm rõ quy ước cho phép tạo file tạm kiểm thử trong .harnix/tmp/ và khuyến nghị dùng --file cho mọi payload UTF-8.
- [x] `ac-2` (met): Bổ sung điều khoản Git Safety vào rules/AGENTS.md và AGENTS.md: bắt buộc chạy git branch --show-current xác nhận nhánh trước khi commit và nghiêm cấm pipe lệnh checkout.
- [x] `ac-3` (met): Tối ưu hóa context hook trong src/core/managed/ để kiểm tra cache ngữ cảnh và tránh chèn lại danh sách guides nếu session và files liên quan không thay đổi.

## Required checks

- [x] `check-suite-v2` (full): Replacement for check-suite — pass (2026-10-24 22:30:41 +07:00)
- [x] `chk-docs-contract` (focused): Kiểm thử tính hợp lệ và đồng bộ của tài liệu và rules — pass (2026-10-24 22:25:21 +07:00)
- [x] `chk-unit-context-hook` (focused): Kiểm thử ngữ cảnh tối ưu hóa của internal-context command — pass (2026-10-24 22:25:29 +07:00)

## Evidence

- skipped (2026-10-24 22:16:54 +07:00): Task contract revised at persisted replan: Cập nhật input glob chính xác cho chk-docs-contract
- `chk-docs-contract` — pass (2026-10-24 22:25:21 +07:00): pnpm vitest run test/workflow/docs-task-contract.test.ts — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `chk-unit-context-hook` — pass (2026-10-24 22:25:29 +07:00): pnpm vitest run test/unit/commands/internal-context.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-24 22:27:31 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-24 22:28:11 +07:00): Task contract revised at persisted replan: Kích hoạt lại check suite sau khi fix template assertion và changelog fold
- `check-suite-v2` — pass (2026-10-24 22:30:41 +07:00): pnpm test — exit 0
