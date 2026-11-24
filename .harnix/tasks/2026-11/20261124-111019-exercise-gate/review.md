# Buộc kiểm chạy thật sau implement: cảnh báo ready, runbook repo, mode full/partial/code-only

- **ID:** 20261124-111019-exercise-gate
- **Mode:** lite
- **Epic:** 20261124-111018-session-feedback-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 11:10:18 +07:00
- **Updated:** 2026-11-24 11:22:43 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Giảm số lần người dùng phải tự bắt lỗi sau khi task báo xong: ready dry-run cảnh báo khi tiêu chí có hành vi quan sát được mà không có check chạy thật, repo ghi sẵn cách chạy thật để agent khỏi bị nhắc lại, và evidence ghi rõ mức đã chạy.

## Non-goals

- Không đổi hợp đồng đóng băng của TaskRecord v3, chuyển trạng thái hay hook protocol
- Không thêm package, bin, daemon hay surface nền tảng mới
- Không biến cảnh báo thành lỗi chặn ở bản này
- Không thêm trường mới vào TaskRecord hay check

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/**`
- `package.json`
- `src/**`
- `test/**`
- `.harnix/spec/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -0 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +3 / -3 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/spec/exercise-runbook.ts` | added | - |
| `src/core/stack/verify-plan.ts` | modified | +5 / -0 |
| `src/core/workflow/exercise-advisory.ts` | added | - |
| `src/core/workflow/ready.ts` | modified | +6 / -1 |
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
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +2 / -2 |
| `test/unit/core/spec/exercise-runbook.test.ts` | added | - |
| `test/unit/core/workflow/exercise-advisory.test.ts` | added | - |
| `test/unit/core/workflow/ready.test.ts` | modified | +14 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): `harnix workflow --transition ready/ready --dry-run` thêm một mục vào `advisories` (không chặn, không đổi trạng thái) khi một tiêu chí mô tả hành vi quan sát được (route, giao diện, lệnh CLI) mà không check bắt buộc nào có id hoặc mô tả bắt đầu bằng `exercise`; mục đó nêu lệnh `harnix skill harnix-exercise`. Bộ nhận diện là heuristic có test cho cả trường hợp đúng và sai.
- [x] `ac-2` (met): Một file user-owned `.harnix/spec/exercise.md` (lệnh khởi động, cổng, công cụ như Playwright) nếu tồn tại được `harnix verify-plan` báo bằng trường `runbook` và được `harnix-exercise` (reference detection) chỉ định đọc trước khi chọn công cụ; thiếu file thì không đổi hành vi.
- [x] `ac-3` (met): `harnix-exercise`, `harnix-verify` và `harnix-implement` yêu cầu ghi mode `full|partial|code-only` trong summary của evidence và ghi rủi ro tồn dư khi một tiêu chí có hành vi quan sát được chỉ đạt `code-only`; khi sửa lỗi do người dùng báo, test hồi quy đi qua đường chạy thật, không chỉ test mô hình. Ngân sách token và checklist SKILL.md vẫn đạt.
- [x] `ac-4` (met): Tài liệu (README, AGENTS.md, PRD, workflow, template workflow.md, skills) được đồng bộ, pnpm selfhost:sync chạy khi template đổi, phiên bản nâng bằng pnpm version:sync theo chính sách member epic (X.Y.0-dev.N) kèm CHANGELOG.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI contract, ngân sách token, nguồn skill) — pass (2026-11-24 11:20:40 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-24 11:22:33 +07:00)

## Decisions

- **d-exercise-heuristic** — Nhận diện check exercise bằng id hoặc mô tả bắt đầu bằng exercise, không thêm trường vào TaskRecord; cảnh báo chỉ là advisory.
  - _Why:_ Giữ hợp đồng đóng băng v3; heuristic có thể báo nhầm hoặc sót nên không chặn.

## Evidence

- `chk-focused` — pass (2026-11-24 11:20:40 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-24 11:22:33 +07:00): pnpm test — exit 0
