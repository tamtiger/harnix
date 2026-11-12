# Làm gợi ý repo-map thực sự đến được agent khi đọc code

- **ID:** 20261112-131224-repo-map-nudge-reach
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-11-12 13:12:24 +07:00
- **Updated:** 2026-11-12 13:23:40 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | r-behavior: medium, r-csharp: medium |

## Goal

Agent dùng harnix repo-map thay cho Grep/Read lặp lại khi tìm symbol hoặc đọc thân hàm: gợi ý phải nằm ngoài khung untrusted, có mặt cả khi không có task active, dùng từ khóa theo tên công cụ thật (Grep, Read offset) và có cả ở harnix-review, mà không vượt trần token và không để hook gọi repo-map.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/internal-context.ts` | modified | +8 / -16 |
| `src/core/context/effective-context.ts` | modified | +5 / -3 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/templates/harnix/activation.ts` | modified | +1 / -1 |
| `test/unit/core/context/effective-context.test.ts` | modified | +4 / -3 |
| `test/workflow/internal-context-boundary.test.ts` | modified | +43 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Dòng gợi ý repo-map do Harnix sinh ra được render bên ngoài khung UNTRUSTED REPOSITORY CONTEXT trong hook context lean.
- [x] `ac-2` (met): Hook context của dự án đã init nhưng không có task active vẫn phát ra gợi ý repo-map tĩnh, mà không đọc cache hay chạy repo-map.
- [x] `ac-3` (met): Quy tắc Token economy trong khối luôn nạp nêu kích hoạt theo công cụ (Grep tìm symbol, Read hoặc sed -n lần hai trên một file) thay vì chỉ grep -r và sed -n, và khối vẫn không vượt trần alwaysLoaded.
- [x] `ac-4` (met): Skill harnix-review có chỉ thị dùng repo-map trước khi tìm symbol hoặc đọc lại một file, và mọi trần token trong token-budgets.json vẫn xanh.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-12 13:23:12 +07:00)
- [x] `chk-ctx` (focused): chk-ctx — pass (2026-11-12 13:23:28 +07:00)
- [x] `chk-gates` (focused): chk-gates — pass (2026-11-12 13:21:24 +07:00)

## Decisions

- **d-root-cause** — Gợi ý repo-map hiện bị đặt trong khung UNTRUSTED (bị bảo bỏ qua), vắng khi không có task active, và dùng từ khóa grep/sed thay vì tên công cụ Grep/Read.
  - _Why:_ Đối chiếu effective-context.ts (withLearning, taskSummaryHeader) và internal-context.ts (nhánh !active); giải thích vì sao epic repo-map-insights giao chỉ thị mà agent vẫn không dùng.
- **d-defer-pretooluse** — Hook PreToolUse nhắc khi gọi Grep/sed là non-goal của task này; chỉ đề xuất cho người dùng quyết định.
  - _Why:_ Nó đổi tích hợp Claude Code đã đóng băng (một nhóm UserPromptSubmit) và chạm setup, update, uninstall, doctor, registry.
- **d-token-offset** — Mọi chữ mới trong khối luôn nạp phải được bù bằng cách rút gọn chính khối đó (còn ~34 token, không nâng trần).
  - _Why:_ AGENTS.md: trần chỉ chặn tăng, không nâng để một thay đổi qua test.

## Residual risks

- **r-behavior** (medium) — Hành vi LLM không kiểm thử đơn vị được: sau phát hành cần đếm transcript (repo-map so với Grep/sed); nếu chưa đủ thì cân nhắc hook PreToolUse.
- **r-csharp** (medium) — Chưa xác minh repo-map --outline/--refs trên mã C# thật lớn; nếu yếu thì việc agent né repo-map là hợp lý và cần sửa extractor trước.

## Evidence

- skipped (2026-11-12 13:19:36 +07:00): Task contract revised at persisted replan: Hai test mới của ac-1 và ac-2 nằm trong internal-context-boundary.test.ts nên check tập trung phải chạy file này.
- `chk-ctx` — pass (2026-11-12 13:23:28 +07:00): pnpm exec vitest run test/unit/core/context/effective-context.test.ts test/unit/commands/internal-context.test.ts test/workflow/internal-context-hooks.test.ts test/workflow/internal-context-boundar... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-12 13:21:24 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-11-12 13:23:12 +07:00): pnpm test — exit 0
