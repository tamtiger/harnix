# Sửa các phát hiện review của epic workflow-friction-v2

- **ID:** 20261109-134036-review-fixes
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-09 13:40:36 +07:00
- **Updated:** 2026-11-09 14:04:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Khép các phát hiện review: breaker không còn bị vượt bằng --set-check cwd/description, lệnh gộp evidence + criterion dùng cùng quy tắc tươi với --criterion --met, dotnet test trần chỉ nhận thư mục có test project, kiểm tra symlink của chính file .sln, và sửa chú thích --reason.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +3 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/check-config-edit.ts` | modified | +29 / -2 |
| `src/core/workflow/criterion.ts` | modified | +1 / -1 |
| `src/core/workflow/evidence-criteria.ts` | modified | +17 / -10 |
| `src/core/workflow/evidence-flags.ts` | modified | +12 / -10 |
| `src/core/workflow/plan-edit.ts` | modified | +4 / -1 |
| `src/core/workflow/reason-rules.ts` | modified | +1 / -1 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/core/workflow/suite-command.ts` | modified | +9 / -10 |
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
| `test/unit/core/workflow/evidence-criteria.test.ts` | modified | +1 / -10 |
| `test/unit/core/workflow/suite-command.test.ts` | modified | +20 / -1 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |
| `test/workflow/check-cwd-edit.test.ts` | modified | +47 / -4 |
| `test/workflow/evidence-criterion-combo.test.ts` | modified | +41 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): --set-check chỉ đổi cwd hoặc description được áp dụng thẳng chỉ khi check chưa bị breaker chặn; check đã fail hai lần liên tiếp (breaker đang dừng) bị từ chối kèm hint --reset-breaker hoặc --replace-check cần user cho phép; check fail một lần vẫn sửa cwd thẳng; có test cho cả hai.
- [x] `ac-2` (met): --evidence ... --criterion <ids> --met áp dụng cùng quy tắc tươi với --criterion --met: mọi required check phủ criterion phải có pass còn tươi (pass vừa ghi được tính) hoặc baseline được chấp nhận, evidenceIds gồm các pass đó thay vì chỉ pass vừa ghi; vi phạm thì không ghi gì; có test hai check phủ một criterion.
- [x] `ac-3` (met): dotnet test trần kèm --cwd chỉ được suite gate chấp nhận khi thư mục cwd có test project (qua inspectDotnetDirectory hasTests), không phải mọi thư mục có .sln hoặc .csproj; có test thư mục thư viện bị từ chối.
- [x] `ac-4` (met): Kiểm tra đường dẫn .sln phân giải chính file (symlink hoặc junction trỏ ra ngoài repo bị từ chối) chứ không chỉ thư mục cha; có test file .sln là symlink ra ngoài.
- [x] `ac-5` (met): Chú thích của reason-rules.ts và handler set-title/set-goal nói đúng việc --reason được kiểm tra độ dài rồi bỏ đi, không lưu.
- [x] `ac-6` (met): Tài liệu và snapshot đồng bộ: AGENTS.md, docs/HARNIX_PRD.md, docs/IMPLEMENTATION_PLAN.md và hint trong check-config-edit.ts nêu đúng quy tắc breaker của cwd-only và quy tắc tươi của lệnh gộp; golden chỉ đổi đúng chuỗi mới; bump patch 2.29.1 kèm CHANGELOG trước verifying.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-09 14:04:00 +07:00)
- [x] `chk-focus` (focused): Test tập trung của các sửa review — pass (2026-11-09 14:01:35 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 14:01:47 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 14:01:35 +07:00): pnpm exec vitest run test/unit/core/workflow test/workflow test/unit/core/stack — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 14:01:47 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-09 14:04:00 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
