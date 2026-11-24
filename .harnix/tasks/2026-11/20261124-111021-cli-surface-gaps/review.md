# Lấp khoảng trống bề mặt CLI: tạo epic bằng cờ, status --task, repo-map --refs

- **ID:** 20261124-111021-cli-surface-gaps
- **Mode:** lite
- **Epic:** 20261124-111018-session-feedback-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 11:10:18 +07:00
- **Updated:** 2026-11-24 11:54:51 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 1 | r-init-epic-needs-test-command: low |

## Goal

Bỏ nhu cầu viết JSON thủ công để dựng epic, cho phép xem trạng thái task không active, và để repo-map --refs dùng được với workspace và với mã dạng chuỗi.

## Non-goals

- Không đổi hợp đồng đóng băng của TaskRecord v3, chuyển trạng thái hay hook protocol
- Không thêm package, bin, daemon hay surface nền tảng mới
- Không thêm lệnh public mới ngoài các cờ nêu trong tiêu chí
- Không tự commit hay tạo nhánh

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
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +4 / -3 |
| `docs/HARNIX_PRD.md` | modified | +2 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +3 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +4 / -1 |
| `src/cli-workflow-commands.ts` | modified | +8 / -2 |
| `src/commands/audit.ts` | modified | +2 / -2 |
| `src/commands/checks.ts` | modified | +3 / -2 |
| `src/commands/status-mode.ts` | modified | +3 / -0 |
| `src/commands/status.ts` | modified | +5 / -5 |
| `src/commands/workflow-command.ts` | modified | +11 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +13 / -8 |
| `src/commands/workflow-flags.ts` | modified | +13 / -4 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +20 / -1 |
| `src/core/platform/user-path-hints.ts` | added | - |
| `src/core/platform/user-paths.ts` | modified | +3 / -2 |
| `src/core/repo-map/refs.ts` | modified | +3 / -1 |
| `src/core/spec/exercise-runbook.ts` | added | - |
| `src/core/stack/verify-plan.ts` | modified | +5 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +1 / -1 |
| `src/core/tasks/transition-hint.ts` | modified | +1 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -0 |
| `src/core/workflow/exercise-advisory.ts` | added | - |
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
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/references/detection.md` | modified | +2 / -0 |
| `src/skills/harnix-exercise/references/evidence.md` | modified | +2 / -0 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/epic.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +2 / -2 |

_(21 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): `harnix workflow --init-epic --title <t> --slug <english-kebab-case> --goal <g> --member "<title>|<english-slug>"...` (từ 2 member trở lên, slug theo quy ước ID tiếng Anh, mọi lỗi gom thành một thông báo) tạo epic cùng toàn bộ member ở trạng thái planning trong một lần lưu; ID epic và member có tiền tố `clock` tăng dần mỗi giây, `createdAt` lấy từ clock, member đầu tiên được kích hoạt; có `--dry-run` chỉ in kế hoạch, và action được thêm đủ vào `WORKFLOW_ACTIONS`, `--schema`, `--brief`, golden và checklist hành động.
- [x] `ac-2` (met): `harnix status --task <id>` (chỉ đọc, không đổi con trỏ active) áp dụng cho `--summary`, `--criteria`, `--checks` và `--explain`; id không tồn tại trả hint kèm id gần đúng.
- [x] `ac-3` (met): Hint của `repo-map` nêu đúng cờ đi với cờ: `--workspace` chỉ dùng với `--query`, `--events`, `--refresh` (kèm gợi ý chạy `--refs` trong một project); `--refs` với mã không phải định danh (có dấu `:` hay `-`) nêu rõ chỉ nhận `[A-Za-z0-9_$]` và gợi ý `--query <text>`; cả hai có test pin nội dung hint.
- [x] `ac-4` (met): Tài liệu (PRD cho lệnh công khai, workflow, README, template workflow.md) và skills được đồng bộ, selfhost:sync chạy, phiên bản nâng một lần theo chính sách member epic kèm CHANGELOG.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI contract, ngân sách token, nguồn skill) — pass (2026-11-24 11:52:29 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-24 11:54:35 +07:00)

## Decisions

- **dec-ac3-hint-only** — Thu hẹp ac-3 chỉ còn hint: cho --refs chạy trên nhiều workspace root hoặc tìm mã dạng chuỗi là thiết kế lại repo-map, quá lớn so với bằng chứng ở 2 session (s07, s18).
  - _Why:_ Giữ member nhỏ, không đổi hành vi repo-map; cải thiện thông báo là phần rẻ nhất bỏ được việc đoán cờ.

## Residual risks

- **r-init-epic-needs-test-command** (low) — init-epic dùng chung việc suy lệnh test của --init: repo không có lệnh test phải truyền --command, và member Full chưa hỗ trợ (mọi member là Lite).

## Evidence

- `chk-focused` — pass (2026-11-24 11:52:29 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-24 11:54:35 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
