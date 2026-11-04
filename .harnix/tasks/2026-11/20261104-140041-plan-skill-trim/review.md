# Rút gọn harnix-plan/SKILL.md và chuyển phần ít dùng sang reference

- **ID:** 20261104-140041-plan-skill-trim
- **Mode:** lite
- **Epic:** 20261104-140039-skills-token-diet
- **Status:** completed/finishing
- **Created:** 2026-11-04 14:00:39 +07:00
- **Updated:** 2026-11-04 14:32:40 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Theo research.md (phương án B): harnix-plan là skill nạp nhiều nhất (khoảng 106000 token qua 59 lần nạp) và đang 1798 trên trần 1800 nên mỗi lần bump version có nguy cơ vượt trần; rút gọn khoảng 15 đến 20% mà không mất quy tắc bắt buộc.

## Relevant paths

- `src/skills/harnix-plan`
- `test/workflow/instruction-budget.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +7 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +18 / -28 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/templates/harnix/activation.ts` | modified | +1 / -1 |
| `src/templates/harnix/workflow.md` | modified | +1 / -1 |
| `test/integration/commands/skills.test.ts` | modified | +23 / -0 |
| `test/workflow/activation-instructions.test.ts` | modified | +4 / -0 |
| `test/workflow/instruction-budget.test.ts` | modified | +3 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): harnix-plan/SKILL.md giảm tối thiểu 15% token so với 1798 (đo bằng cùng phép đo của instruction-budget), phần chuyển ra nằm trong reference hiện có hoặc reference mới và SKILL.md giữ đúng một dòng trỏ tới mỗi reference; mọi quy tắc bắt buộc (Bypass, ready gate, epic, replan, Full phải dừng ở await) vẫn đọc được từ SKILL.md hoặc một reference được trỏ rõ; trần SKILL_BUDGET của harnix-plan hạ xuống mức còn khoảng đệm ít nhất 100 token so với số đo mới; checklist skill của harnix-self-host được duyệt.
- [x] `ac-2` (met): Đo lại token bằng pnpm measure:tokens sau thay đổi và ghi số trước và sau vào decision của task; research.md của epic session-friction-fixes không bị sửa.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-04 14:31:04 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-04 14:32:34 +07:00)

## Decisions

- **dec-plan-trim-measure** — harnix-plan/SKILL.md: 1798 token (7197 byte) trước, 1527 token sau, giảm 271 token (15.1%). measure:tokens: harnix-plan 1911 trước và nhỏ hơn sau (đo ở dạng có bọc JSON). Trần SKILL_BUDGET riêng của harnix-plan hạ 1800 xuống 1630 (đệm 103 token). Đã bỏ đường dẫn ./references/<topic>.md lặp với lệnh --reference vì test catalog chỉ buộc lệnh harnix skill ... --reference; giữ nguyên cụm 'observable acceptance criteria' mà test responsibility yêu cầu.
  - _Why:_ Số đo cùng phép đo (độ dài ký tự chia 4) của instruction-budget và research.md; không có quy tắc bắt buộc nào bị bỏ, các test skill-sources, reference-rules và catalog vẫn pass.
- **dec-plan-trim-measure-after** — Đo lại bằng pnpm measure:tokens sau khi build: harnix-plan 1911 xuống 1635 (giảm 276 token, dạng có bọc JSON), phiên Lite đầy đủ sessionLite 9170 xuống 8903 (giảm 267). Cập nhật cho dec-plan-trim-measure, vốn ghi sau là 'nhỏ hơn' khi dist chưa build lại.
  - _Why:_ Số đo sạch sau release:check (dist mới); thay cho câu chưa có số.

## Evidence

- `chk-focus` — pass (2026-11-04 14:31:04 +07:00): pnpm exec vitest run test/workflow/instruction-budget.test.ts test/workflow/skill-sources.test.ts test/workflow/docs-task-contract.test.ts test/unit/skills — exit 0
- `chk-suite` — pass (2026-11-04 14:32:34 +07:00): pnpm test — exit 0
