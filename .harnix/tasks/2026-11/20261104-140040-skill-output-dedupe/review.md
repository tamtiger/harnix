# Hướng dẫn nạp skill bằng --raw để bỏ phần JSON lặp

- **ID:** 20261104-140040-skill-output-dedupe
- **Mode:** lite
- **Epic:** 20261104-140039-skills-token-diet
- **Status:** completed/finishing
- **Created:** 2026-11-04 14:00:39 +07:00
- **Updated:** 2026-11-04 14:21:43 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Theo research.md (mục 3): đầu ra JSON của harnix skill <name> thừa khoảng 110 đến 130 token mỗi lần nạp so với --raw (description, version và frontmatter lặp, ký tự escape). Hướng đã chọn (người dùng, 2026-11-04): không đổi hợp đồng byte-identical của content mà hướng dẫn agent nạp bằng --raw.

## Relevant paths

- `docs/HARNIX_WORKFLOW.md`
- `src/templates/harnix/activation.ts`
- `src/templates/harnix/workflow.md`
- `test/integration/commands/skills.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
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
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
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

## Acceptance criteria

- [x] `ac-1` (met): Khối luôn nạp (src/templates/harnix/activation.ts) và src/templates/harnix/workflow.md hướng dẫn nạp skill bằng harnix skill harnix-<stage> --raw; mọi khối luôn nạp vẫn không quá 1500 token (instruction-budget); --raw in đúng nội dung của content, đầu ra không --raw và hợp đồng byte-identical không đổi; một test chứng minh với từng skill workflow rằng đầu ra --raw ngắn hơn JSON, và decision ghi số byte của JSON và --raw cho harnix-plan, harnix-implement, harnix-verify.
- [x] `ac-2` (met): Tài liệu nêu cách nạp skill bằng --raw ở nơi đang nhắc lệnh nạp skill (docs/HARNIX_WORKFLOW.md, docs/HARNIX_PRD.md nếu có) và CHANGELOG có bullet tương ứng.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-04 14:20:11 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-04 14:21:37 +07:00)

## Decisions

- **dec-raw-measure** — Đo bằng harnix skill <name> (JSON) và --raw, đơn vị byte: harnix-plan 7644 và 7196, harnix-implement 7026 và 6574, harnix-verify 7624 và 7104; chênh 448 đến 520 byte, khoảng 112 đến 130 token mỗi lần nạp (4 ký tự một token).
  - _Why:_ Số đo trước thay đổi, cùng phép đo của research.md; --raw đã tồn tại nên không đổi hợp đồng content byte-identical.

## Evidence

- skipped (2026-11-04 14:17:25 +07:00): Task contract revised at persisted replan: Đổi hướng theo quyết định người dùng: dùng --raw thay vì bỏ frontmatter khỏi content vì content byte-identical là hợp đồng đóng băng
- skipped (2026-11-04 14:17:26 +07:00): Task contract revised at persisted replan: Đồng bộ với tiêu chí ac-1 mới
- skipped (2026-11-04 14:17:26 +07:00): Task contract revised at persisted replan: Test của hướng --raw
- `chk-focus` — pass (2026-11-04 14:20:11 +07:00): pnpm exec vitest run test/integration/commands/skills.test.ts test/workflow/instruction-budget.test.ts test/workflow/activation-instructions.test.ts test/workflow/docs-task-contract.test.ts test/wo... — exit 0
- `chk-suite` — pass (2026-11-04 14:21:37 +07:00): pnpm test — exit 0
