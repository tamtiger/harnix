# Changelog --fold-dev không lặp ý của bản dev

- **ID:** 20261030-142216-changelog-fold-optional-summary
- **Mode:** lite
- **Epic:** 20261030-142214-dev-maintenance
- **Status:** completed/finishing
- **Created:** 2026-10-30 14:22:14 +07:00
- **Updated:** 2026-10-30 16:34:27 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

version:sync --fold-dev luôn thêm một gạch đầu dòng tóm tắt dù các bản dev đã mô tả đủ; cho phép đóng epic mà không thêm bullet lặp.

## Non-goals

- Không đổi hành vi của --summary khi không có --fold-dev.

## Relevant paths

- `scripts/changelog-fold.mjs`
- `scripts/version-sync.mjs`
- `AGENTS.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +13 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +5 / -5 |
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
| `test/README.md` | modified | +4 / -0 |
| `test/support/golden-format.ts` | added | - |
| `test/workflow/behavior-snapshot.test.ts` | modified | +2 / -1 |
| `test/workflow/golden-format.test.ts` | added | - |
| `test/workflow/implementation-plan-integrity.test.ts` | added | - |
| `test/workflow/measure-footprint-guard.test.ts` | modified | +8 / -34 |
| `test/workflow/version-sync.test.ts` | modified | +18 / -0 |
| `vitest.config.ts` | modified | +4 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): version:sync <X.Y.0> --fold-dev chạy không cần --summary và khi đó entry gộp chỉ chứa các bullet của bản dev (test khẳng định đúng nội dung entry); khi có --summary thì thêm đúng một bullet như hiện tại (test); AGENTS.md và skill harnix-self-host nói rõ --summary là tùy chọn với --fold-dev.

## Required checks

- [x] `chk-fold` (focused): Test version-sync và changelog-fold — pass (2026-10-30 16:29:32 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 16:30:51 +07:00)

## Decisions

- **premise-wrong** — Giả định ban đầu của task (fold-dev luôn thêm bullet tóm tắt) sai: bullet lặp ở epic trước do người chạy truyền --summary. Mã đã cho --fold-dev không có summary; task chỉ thêm test đặc tính hóa và tài liệu.
  - _Why:_ Không sửa mã không hỏng; dùng chính tính năng này để đóng epic.

## Evidence

- skipped (2026-10-30 16:27:35 +07:00): Task contract revised at persisted replan: Mã đã hỗ trợ --fold-dev không cần --summary; điều còn thiếu chỉ là test nội dung entry và tài liệu, nên sửa tiêu chí cho đúng thực tế.
- skipped (2026-10-30 16:29:29 +07:00): Task contract revised at persisted replan: Đường dẫn test/unit/scripts khi tạo task không tồn tại; test của version-sync nằm ở test/workflow/version-sync.test.ts.
- `chk-fold` — pass (2026-10-30 16:29:32 +07:00): pnpm exec vitest run test/workflow/version-sync.test.ts — exit 0
- `chk-suite` — pass (2026-10-30 16:30:51 +07:00): pnpm test — exit 0
