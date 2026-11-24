# Sửa heuristic advisory exercise: nhận id chk-exercise-* và nhắc khi đổi bề mặt CLI hoặc skill

- **ID:** 20261124-162009-exercise-advisory-matching
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-24 16:20:09 +07:00
- **Updated:** 2026-11-24 16:30:32 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | risk-broad-path-miss: low, risk-prose-skill-false-positive: low |

## Goal

Advisory ready --dry-run nhận check có đoạn exercise trong id hoặc mô tả bắt đầu bằng exercise, và còn nhắc khi relevantPaths chạm bề mặt CLI hoặc skill mà chưa có check chạy thật.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/**`
- `scripts/exercise-advisory.mjs`
- `src/core/workflow/exercise-advisory.ts`
- `src/core/workflow/ready.ts`
- `src/skills/**`
- `test/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/exercise-advisory.mjs` | added | - |
| `src/core/workflow/exercise-advisory.ts` | modified | +25 / -11 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/references/evidence.md` | modified | +1 / -1 |
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
| `test/unit/core/workflow/exercise-advisory.test.ts` | modified | +33 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): ready --dry-run không còn bỏ sót check có id dạng chk-exercise-api hoặc exercise-cli (đoạn exercise phân tách bằng dấu gạch) hay mô tả bắt đầu bằng exercise, và không nhận chuỗi exercises hay unexercised; tiêu chí văn bản quan sát được xử lý như cũ.
- [x] `ac-2` (met): Advisory còn kích hoạt khi relevantPaths của task chạm bề mặt CLI hoặc skill (src/commands/**, src/cli*, src/skills/**, bin) mà không có required check exercise nào; chỉ là advisory không chặn, không thêm trường vào TaskRecord, cùng lệnh gợi ý harnix skill harnix-exercise; task không chạm các đường dẫn đó hoặc đã có check exercise thì im lặng.
- [x] `ac-3` (met): Chạy bản build thật (node dist/cli.js workflow --transition ready/ready --dry-run trong thư mục tạm cô lập) cho đúng các ca: id chk-exercise-api không advisory; task chạm src/commands/** không có check exercise có advisory; tiêu chí văn bản quan sát được như cũ.
- [x] `ac-4` (met): Tài liệu, skill, PRD, AGENTS.md và CHANGELOG mô tả đúng quy tắc đặt tên và điều kiện kích hoạt; version nâng một lần lên 2.38.3.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-24 16:30:13 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh — pass (2026-11-24 16:27:55 +07:00)
- [x] `chk-exercise-cli` (focused): exercise: chạy dist/cli.js ready --dry-run trên task tạm — pass (2026-11-24 16:27:41 +07:00)

## Residual risks

- **risk-broad-path-miss** (low) — Task có relevantPaths là glob rộng như src/** không khớp mẫu bề mặt CLI hoặc skill nên advisory theo đường dẫn im lặng (bỏ sót); chỉ khớp khi đường dẫn bắt đầu bằng src/commands/, src/cli*, src/skills/ hoặc bin/.
- **risk-prose-skill-false-positive** (low) — Sửa chỉ lời văn SKILL.md hoặc reference mà không có check exercise vẫn nhận advisory theo đường dẫn; chấp nhận vì chỉ là advisory không chặn, bỏ qua bằng cách khai báo check exercise hoặc ghi lý do trong quyết định.

## Evidence

- `chk-exercise-cli` — pass (2026-11-24 16:27:41 +07:00): mode: full — 7 ca ready --dry-run chạy bằng dist/cli.js trong dự án tạm cô lập (id chk-exercise-api không advisory; id chk-exercises, đường dẫn src/commands và src/skills không có check exercise đều có advisory; đường dẫn src/core im lặng) _(1 earlier rerun not shown; see task.json for full history)_
- `chk-focused` — pass (2026-11-24 16:27:55 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-11-24 16:30:13 +07:00): pnpm test — exit 0
