# harnix-exercise: reference web và hạ bậc theo nền tảng

- **ID:** 20261119-140814-exercise-web-reference
- **Mode:** lite
- **Epic:** 20261119-140811-exercise-skill
- **Status:** completed/finishing
- **Created:** 2026-11-19 14:08:14 +07:00
- **Updated:** 2026-11-19 15:31:28 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Viết reference web cho harnix-exercise: mở browser thật để đi qua luồng chính, thu console, request lỗi và screenshot, với thứ tự công cụ có đường lui cho nền tảng không có browser tool.

## Non-goals

- Không đóng gói hay cài Playwright, agent-browser
- Không làm visual regression theo baseline và không chấm điểm thẩm mỹ ở v1

## Relevant paths

- `src/skills/harnix-exercise/**`
- `src/skills/technique-skills.ts`
- `test/unit/skills/technique-skills.test.ts`
- `test/workflow/skill-sources.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/preflight.ts` | modified | +5 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | added | - |
| `src/skills/harnix-exercise/references/api.md` | added | - |
| `src/skills/harnix-exercise/references/cli.md` | added | - |
| `src/skills/harnix-exercise/references/detection.md` | added | - |
| `src/skills/harnix-exercise/references/evidence.md` | added | - |
| `src/skills/harnix-exercise/references/safety.md` | added | - |
| `src/skills/harnix-exercise/references/web.md` | added | - |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +2 / -1 |
| `src/skills/technique-skills.ts` | modified | +18 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +4 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/preflight.test.ts` | modified | +1 / -0 |
| `test/unit/skills/technique-skills.test.ts` | modified | +5 / -0 |
| `test/workflow/exercise-skill-content.test.ts` | added | - |
| `test/workflow/preflight-exercise.test.ts` | added | - |
| `test/workflow/skill-sources.test.ts` | modified | +9 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Reference web mô tả quy trình khảo sát rồi hành động: mở trang, đợi trạng thái ổn định, chụp hoặc đọc DOM, chọn selector từ trạng thái đã render, rồi thao tác; ưu tiên selector theo vai trò hoặc data-testid, đợi theo điều kiện thay vì thời gian cố định.
- [x] `ac-2` (met): Thứ tự công cụ có phát hiện sự có mặt: Playwright của dự án, rồi agent-browser tùy chọn (hỏi người dùng trước khi tải Chrome), rồi browser tool của nền tảng, rồi hạ bậc code-only; nền tảng không có browser tool (Cursor, Kiro) vẫn có đường đi hợp lệ.
- [x] `ac-3` (met): Smoke web thu console error, request 4xx/5xx và screenshot làm bằng chứng, che PII và secret, chỉ chạy luồng có ghi dữ liệu trên môi trường cô lập sau khi người dùng đồng ý.
- [x] `ac-4` (met): Có hướng dẫn bắt flaky bằng chạy lặp trước khi ghi bằng chứng và nối với harnix-flaky-test; test lỗi không bị cách ly ngầm mà để circuit breaker xử lý.
- [x] `ac-5` (met): Reference nằm trong ngân sách token, có một dòng trỏ tới nó trong SKILL.md và test cấu trúc skill vẫn xanh.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh cho nguồn skill và ngân sách token — pass (2026-11-19 15:29:54 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-19 15:31:23 +07:00)

## Evidence

- `chk-focused` — pass (2026-11-19 15:29:54 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-19 15:31:23 +07:00): pnpm test — exit 0
