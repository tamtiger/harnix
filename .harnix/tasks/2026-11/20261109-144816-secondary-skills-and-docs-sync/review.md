# Gọn skill phụ, guide, reference còn lại và lập bảng quy tắc ↔ nơi sở hữu

- **ID:** 20261109-144816-secondary-skills-and-docs-sync
- **Mode:** lite
- **Epic:** 20261109-144812-skills-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-09 14:48:12 +07:00
- **Updated:** 2026-11-09 15:45:45 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Tách domain-briefs.md, gọn các reference sát trần (dotnet-microservices, gates, evidence), rà skill phụ và guide, lập bảng quy tắc ↔ nơi sở hữu có test kiểm, cập nhật AGENTS.md và docs bản gốc với trần mới, rồi đóng epic bằng release 2.30.0.

## Relevant paths

- `AGENTS.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/RULE_OWNERSHIP.md`
- `src/skills/harnix-arch-review/references/domain-briefs.md`
- `src/skills/harnix-implement/references/dotnet-microservices.md`
- `src/skills/harnix-verify/references/evidence.md`
- `src/skills/harnix-verify/references/gates.md`
- `test/workflow/docs-task-contract.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +9 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `docs/RULE_OWNERSHIP.md` | added | - |
| `package.json` | modified | +1 / -1 |
| `scripts/measure-tokens.mjs` | modified | +5 / -1 |
| `scripts/token-budget-usage.mjs` | added | - |
| `src/skills/catalog.ts` | modified | +2 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-arch-review/references/domain-briefs-operations.md` | added | - |
| `src/skills/harnix-arch-review/references/domain-briefs.md` | modified | +1 / -32 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +4 / -4 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-plan/references/epic-git.md` | added | - |
| `src/skills/harnix-plan/references/epic.md` | modified | +5 / -19 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +5 / -5 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +4 / -0 |
| `src/skills/harnix-verify/references/gates.md` | modified | +2 / -1 |
| `src/skills/technique-skills.ts` | modified | +2 / -0 |
| `src/templates/harnix/activation.ts` | modified | +2 / -1 |
| `src/templates/harnix/token-budgets.json` | added | - |
| `src/templates/harnix/token-budgets.ts` | added | - |
| `src/templates/harnix/workflow.md` | modified | +19 / -26 |
| `test/integration/commands/skills.test.ts` | modified | +2 / -1 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/skills/catalog.test.ts` | modified | +1 / -4 |
| `test/unit/skills/technique-skills.test.ts` | modified | +8 / -3 |
| `test/unit/templates/harnix/token-budgets.test.ts` | added | - |
| `test/workflow/gates-parity.test.ts` | added | - |
| `test/workflow/instruction-budget.test.ts` | modified | +37 / -14 |
| `test/workflow/lean-workflow.test.ts` | modified | +4 / -5 |
| `test/workflow/measure-tokens.test.ts` | modified | +46 / -0 |
| `test/workflow/reference-rules.test.ts` | modified | +1 / -1 |
| `test/workflow/rule-ownership.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): domain-briefs.md ≤ 1200 token sau khi tách theo miền (domain-briefs và domain-briefs-operations); dotnet-microservices.md, gates.md và evidence.md giữ trong trần 1200 token (không ép 900 vì giảm thêm phải bỏ quy tắc); danh sách miễn trừ trần reference rỗng và test trần reference xanh không miễn trừ.
- [x] `ac-2` (met): docs/RULE_OWNERSHIP.md liệt kê từng nhóm quy tắc (cổng ready/finish, thời điểm review, chính sách version, trạng thái task, secret, trần token) với nơi canonical của nó; một test kiểm mọi đường dẫn và tên reference trong bảng còn tồn tại.
- [x] `ac-3` (met): AGENTS.md và docs bản gốc nêu trần token mới và đường dẫn module token-budgets.ts; checklist sửa SKILL.md dùng trần mới; mỗi skill phụ và guide đã được rà trùng lặp và vẫn dưới trần.
- [x] `ac-4` (met): pnpm release:check xanh và phiên bản đóng epic là 2.30.0 bằng pnpm version:sync 2.30.0 --fold-dev; CHANGELOG gộp các bản dev.
- [x] `ac-5` (met): Tài liệu và snapshot đồng bộ: AGENTS.md, docs/HARNIX_WORKFLOW.md, docs/HARNIX_PRD.md và docs/IMPLEMENTATION_PLAN.md nếu bề mặt công khai đổi; pnpm selfhost:sync khi template workflow đổi; behavior-snapshot.golden.json chỉ đổi đúng chuỗi mới; bump 2.30.0-dev.N (member cuối đóng 2.30.0 bằng --fold-dev) kèm CHANGELOG trước verifying.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 15:37:56 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 15:38:04 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 15:39:28 +07:00)

## Evidence

- skipped (2026-11-09 15:27:19 +07:00): Task contract revised at persisted replan: Mục tiêu 900 token cho ba reference đòi bỏ quy tắc; giữ trong trần 1200 thay vì cắt nội dung.
- `chk-focus` — pass (2026-11-09 15:37:56 +07:00): pnpm exec vitest run test/workflow — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 15:38:04 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-09 15:39:28 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
