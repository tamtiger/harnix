# harnix-exercise: lõi skill, phát hiện loại dự án và đăng ký

- **ID:** 20261119-140812-exercise-skill-core
- **Mode:** lite
- **Epic:** 20261119-140811-exercise-skill
- **Status:** completed/finishing
- **Created:** 2026-11-19 14:08:12 +07:00
- **Updated:** 2026-11-19 15:24:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Tạo technique skill harnix-exercise (SKILL.md cùng reference detection và evidence), đăng ký trong technique-skills và để preflight/--suggest gợi ý khi task có hành vi chạy được cần kiểm chứng.

## Non-goals

- Chưa viết hướng dẫn chi tiết cho API, CLI hay web (thuộc các member sau)
- Không thêm stage workflow hay lệnh công khai mới

## Relevant paths

- `src/core/workflow/preflight.ts`
- `src/skills/harnix-exercise/**`
- `src/skills/harnix-implement/SKILL.md`
- `src/skills/harnix-verify/SKILL.md`
- `src/skills/technique-skills.ts`
- `test/integration/commands/skills.test.ts`
- `test/unit/core/workflow/preflight.test.ts`
- `test/unit/skills/technique-skills.test.ts`
- `test/workflow/skill-sources.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/preflight.ts` | modified | +5 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | added | - |
| `src/skills/harnix-exercise/references/detection.md` | added | - |
| `src/skills/harnix-exercise/references/evidence.md` | added | - |
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
| `src/skills/technique-skills.ts` | modified | +10 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +4 / -0 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/preflight.test.ts` | modified | +1 / -0 |
| `test/unit/skills/technique-skills.test.ts` | modified | +5 / -0 |
| `test/workflow/preflight-exercise.test.ts` | added | - |
| `test/workflow/skill-sources.test.ts` | modified | +9 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): harnix skill harnix-exercise --raw in được skill hợp lệ theo parseSkill, có trong catalog technique skills, description bắt đầu bằng 'Use when '.
- [x] `ac-2` (met): Quy trình trong SKILL.md đi từ tiêu chí chấp nhận sang kịch bản (happy, biên, lỗi), chọn công cụ có phát hiện sự có mặt, sinh test gắn [chk-id], khởi chạy có kiểm soát rồi ghi bằng chứng qua harnix workflow --run-check; không bịa hành vi ngoài tiêu chí hay contract.
- [x] `ac-3` (met): Reference detection nêu cách suy ra loại dự án (API, CLI, web, thư viện) từ manifest, OpenAPI, route và entrypoint, xử lý khi không chắc, và hạ bậc xuống test code-only kèm báo rõ chế độ thực sự đã chạy (full, screenshot, code-only).
- [x] `ac-4` (met): Hàm suggestTechniques trong preflight và harnix skill --suggest gợi ý harnix-exercise khi tiêu chí hoặc mô tả task nhắc tới API, endpoint, CLI, giao diện hoặc browser (cả tiếng Việt lẫn tiếng Anh); test ghim cả trường hợp có gợi ý lẫn trường hợp không gợi ý.
- [x] `ac-5` (met): Skill và reference nằm trong ngân sách token của token-budgets.json, không nhắc lệnh riêng của repo, mỗi reference có một dòng trỏ tới nó và dòng phiên bản đã cập nhật.
- [x] `ac-6` (met): SKILL.md của harnix-implement và harnix-verify mỗi nơi có đúng một dòng trong mục Technique skills trỏ tới harnix skill harnix-exercise (implement: kiểm chứng hành vi chạy được sau khi code; verify: trước khi ghi bằng chứng), vẫn trong trần token của từng skill; test ghim hai dòng này.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh (nguồn skill, ngân sách token, kiến trúc, CLI contract) cho skill mới — pass (2026-11-19 15:21:54 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-19 15:23:36 +07:00)

## Evidence

- `chk-focused` — pass (2026-11-19 15:21:54 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-19 15:23:36 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
