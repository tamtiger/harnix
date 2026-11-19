# harnix-exercise: reference API, CLI và an toàn

- **ID:** 20261119-140813-exercise-api-cli-reference
- **Mode:** lite
- **Epic:** 20261119-140811-exercise-skill
- **Status:** completed/finishing
- **Created:** 2026-11-19 14:08:13 +07:00
- **Updated:** 2026-11-19 15:28:19 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Viết các reference api, cli và safety cho harnix-exercise: gọi thử API thật, chạy CLI, kiểm thư viện từ góc nhìn consumer, với giới hạn an toàn bắt buộc.

## Non-goals

- Không đóng gói hay cài Hurl, Schemathesis
- Không hướng dẫn kiểm thử web (member khác)

## Relevant paths

- `src/skills/harnix-exercise/**`
- `src/skills/technique-skills.ts`
- `test/unit/skills/technique-skills.test.ts`
- `test/workflow/skill-sources.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
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
| `src/skills/technique-skills.ts` | modified | +16 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +4 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/preflight.test.ts` | modified | +1 / -0 |
| `test/unit/skills/technique-skills.test.ts` | modified | +5 / -0 |
| `test/workflow/exercise-skill-content.test.ts` | added | - |
| `test/workflow/preflight-exercise.test.ts` | added | - |
| `test/workflow/skill-sources.test.ts` | modified | +9 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Reference api nêu thứ tự công cụ: test của framework dự án trước, Hurl cho API không có OpenAPI, Schemathesis tùy chọn khi có OpenAPI kèm cảnh báo nó tạo, sửa, xóa dữ liệu thật; mỗi lựa chọn có điều kiện phát hiện và bằng chứng thu được (file .hurl, JUnit, exit code).
- [x] `ac-2` (met): Reference api có mẫu ép chế độ sandbox/mock, helper gọi route, kiểm hình dạng response theo contract, và test hồi quy đặt tên theo lỗi đã gặp.
- [x] `ac-3` (met): Reference cli nêu cách chạy lệnh thật bằng mảng executable cộng args, kiểm stdout, stderr, exit code, và smoke thư viện qua một script chạy như một consumer.
- [x] `ac-4` (met): Reference safety bắt buộc: DB tạm hoặc mock, không gọi production, không đọc hay in secret, che PII trong artifact, cổng khai báo và timeout, dọn tiến trình con, hỏi người dùng trước khi cài công cụ hoặc mở cổng; Windows và POSIX đều chạy được.
- [x] `ac-5` (met): Các reference nằm trong ngân sách token, mỗi reference có một dòng trỏ tới nó trong SKILL.md, và test cấu trúc skill vẫn xanh.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh cho nguồn skill và ngân sách token — pass (2026-11-19 15:26:37 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-19 15:28:07 +07:00)

## Evidence

- `chk-focused` — pass (2026-11-19 15:26:37 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-19 15:28:07 +07:00): pnpm test — exit 0
