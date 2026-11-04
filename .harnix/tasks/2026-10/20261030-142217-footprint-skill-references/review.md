# Bỏ giới hạn footprint của setup

- **ID:** 20261030-142217-footprint-skill-references
- **Mode:** lite
- **Epic:** 20261030-142214-dev-maintenance
- **Status:** completed/finishing
- **Created:** 2026-10-30 14:22:14 +07:00
- **Updated:** 2026-10-30 15:14:13 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Quyết định của người dùng (2026-10-30): footprint của harnix setup không còn bị giới hạn byte; mục tiêu tối ưu là token của skill và reference. measure:footprint chỉ còn đo và in số liệu.

## Non-goals

- Chưa sửa code; task này kết thúc bằng quyết định có số liệu.

## Relevant paths

- `AGENTS.md`
- `scripts/footprint-budget.json`
- `scripts/footprint-budget.mjs`
- `scripts/measure-footprint.mjs`
- `test/workflow/measure-footprint-guard.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +3 / -3 |
| `docs/UPSTREAM_BASELINE.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/footprint-budget.json` | deleted | +0 / -1 |
| `scripts/footprint-budget.mjs` | deleted | +0 / -25 |
| `scripts/measure-footprint.mjs` | modified | +0 / -4 |
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
| `test/workflow/measure-footprint-guard.test.ts` | modified | +8 / -34 |

## Acceptance criteria

- [x] `ac-1` (met): measure:footprint chỉ in số file và byte, không còn đọc scripts/footprint-budget.json hay thất bại vì vượt ngân sách; scripts/footprint-budget.mjs và scripts/footprint-budget.json bị xóa; test guard được thay bằng test khẳng định lệnh đo không áp ngân sách; AGENTS.md, README.md, docs (PRD, IMPLEMENTATION_PLAN) và skill harnix-self-host không còn mô tả giới hạn; ngân sách token của skill và reference (instruction-budget) giữ nguyên.

## Required checks

- [x] `chk-gates` (focused): Test đo footprint, release-check, package-contract và các test hợp đồng — pass (2026-10-30 15:12:43 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 15:14:10 +07:00)

## Decisions

- **user-decision** — Người dùng quyết định bỏ giới hạn footprint: đây là kích thước của setup, không phải chi phí token; cái cần tối ưu là token của skill và reference.
  - _Why:_ Footprint chỉ là số byte ghi ra đĩa; ngân sách token trong instruction-budget mới phản ánh chi phí ngữ cảnh.

## Evidence

- `chk-gates` — pass (2026-10-30 15:12:43 +07:00): pnpm exec vitest run test/workflow — exit 0
- `chk-suite` — pass (2026-10-30 15:14:10 +07:00): pnpm test — exit 0
