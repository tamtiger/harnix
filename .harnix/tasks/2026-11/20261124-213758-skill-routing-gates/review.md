# Test định tuyến skill suggest và kiểm tham chiếu skill

- **ID:** 20261124-213758-skill-routing-gates
- **Mode:** lite
- **Epic:** 20261124-213757-external-skill-lessons
- **Status:** completed/finishing
- **Created:** 2026-11-24 21:37:58 +07:00
- **Updated:** 2026-11-24 21:57:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 2 | risk-lexical-scorer: medium, risk-audit-text-only: low |

## Goal

Bắt hồi quy định tuyến của harnix skill --suggest và mọi tham chiếu treo (skill, reference, cờ) trong nguồn skill bằng test tất định, không dùng model và không thêm dependency.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `docs/HARNIX_PRD.md`
- `package.json`
- `scripts/eval-skill-triggers.py`
- `scripts/exercise-skill-references.mjs`
- `scripts/exercise-skill-routing.mjs`
- `src/commands/skills-suggest.ts`
- `src/skills/**`
- `test/README.md`
- `test/support/skill-reference-audit.ts`
- `test/workflow/skill-reference-audit.test.ts`
- `test/workflow/skill-routing-cases.json`
- `test/workflow/skill-routing-exercise.test.ts`
- `test/workflow/skill-routing.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-skill-routing.mjs` | added | - |
| `src/commands/skills-suggest.ts` | modified | +25 / -10 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
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
| `test/README.md` | modified | +3 / -0 |
| `test/support/skill-reference-audit.ts` | added | - |
| `test/workflow/skill-reference-audit.test.ts` | added | - |
| `test/workflow/skill-routing-cases.json` | added | - |
| `test/workflow/skill-routing-exercise.test.ts` | added | - |
| `test/workflow/skill-routing.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Một fixture JSON liệt kê prompt `{query, expect, shouldTrigger}` gồm ca nên kích hoạt và ca gần-giống không được kích hoạt; một test vitest chạy `suggestSkills` và khẳng định top-1 đúng ở ca nên kích hoạt, không có skill sai đứng đầu ở ca gần-giống, và ghi hit@1, hit@3, tỉ lệ kích hoạt nhầm thành sàn chỉ tăng. Prompt không lặp nguyên từ vựng của mô tả skill.
- [x] `ac-2` (met): Một test quét mọi tên `harnix-*` và mọi cụm `harnix <lệnh> --cờ` trong SKILL.md và references của `src/skills` rồi báo tham chiếu treo: skill không tồn tại, reference không tồn tại, hoặc cờ không có trong bảng Commander hay `WORKFLOW_ACTIONS`; có test chứng minh fixture lỗi bị bắt và danh sách ngoại lệ (nếu có) chỉ được co lại.
- [x] `ac-3` (met): Nếu eval định tuyến lộ ca sai có thật của `suggestSkills`, bản sửa là tối thiểu và có test; không thêm chữ vào mô tả skill chỉ để qua test. Số phận của `scripts/eval-skill-triggers.py` (thay bằng test TS hay giữ làm công cụ thủ công) được ghi thành một decision.
- [x] `ac-4` (met): Tài liệu liên quan (test/README.md, CHANGELOG, AGENTS.md nếu đổi hợp đồng) được đồng bộ; phiên bản nâng một lần bằng `pnpm version:sync` theo chính sách member epic (X.Y.0-dev.N); mọi trần token giữ nguyên.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-24 21:57:23 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-24 21:55:08 +07:00)
- [x] `chk-exercise-routing` (focused): Exercise: chạy CLI build thật harnix skill --suggest trên các ca định tuyến và prompt không liên quan — pass (2026-11-24 21:57:29 +07:00)
- [x] `chk-exercise-references` (focused): Exercise: chạy CLI build thật harnix skill <tên> --reference <chủ đề> cho mọi cặp được nêu trong nguồn skill — pass (2026-11-24 21:57:31 +07:00)

## Decisions

- **dec-scope-dropped** — Bỏ khỏi epic: ma trận quyết định và ADR (harnix đã có --add-decision kèm rationale, schema đóng băng), tag nguồn gốc quyết định user/ai (không thêm trường), kiểm --run-check chạy 0 test (CLI đã từ chối ở run-check.ts), rubric tự chấm, scanner ngoài, điều phối nhiều agent, skill miền.
  - _Why:_ Đối chiếu với mã harnix hiện có và ràng buộc AGENTS.md (không mạng, không subagent bắt buộc, không đổi TaskRecord v3, trần token).
- **dec-license-ideas-only** — Chỉ lấy ý tưởng và viết lại bằng lời của harnix; không chép câu hay file nguyên văn từ 3 repo ngoài.
  - _Why:_ claude-code-skills không có LICENSE rõ ràng và knowledge/ chưng cất từ tài liệu bên thứ ba; hai repo kia là MIT và Apache-2.0 nhưng giữ cùng quy tắc cho nhất quán.
- **dec-python-trigger-script** — Giữ scripts/eval-skill-triggers.py làm công cụ thủ công kiểm trùng mô tả (cosine TF-IDF, ngưỡng 0.80); hiện chạy PASS với độ giống tối đa 0.171. Không đưa vào gate vì gate của repo chỉ dùng Node và script không được tham chiếu ở package.json hay CI.
  - _Why:_ Test routing mới đo hành vi suggestSkills, còn script này đo độ trùng giữa các mô tả; hai việc khác nhau. Đổi sang TypeScript chỉ khi trùng mô tả thành rủi ro thật.
- **dec-suggest-scorer-minimal** — suggestSkills chuyển từ khớp chuỗi con sang khớp theo token (bỏ stopword, bỏ chữ s số nhiều): hit@1 trên fixture từ 8/21 lên 11/21, prompt không liên quan trả rỗng. Sàn đặt đúng số đo (hit@1 0.5, hit@3 0.75, false trigger 0.2); không thêm trọng số IDF vì đổi kiểu điểm công khai.
  - _Why:_ Sửa tối thiểu theo tiêu chí ac-3; các ca còn sai là giới hạn của so khớp từ vựng (từ test trong tên flaky-test luôn cộng điểm), được ghi bằng sàn chỉ tăng để lần cải tiến sau có chỗ nâng.

## Residual risks

- **risk-lexical-scorer** (medium) — suggestSkills vẫn chỉ khớp từ vựng: hit@1 0.52 trên fixture, prompt không trùng từ nào với mô tả nhận danh sách rỗng, và từ test trong tên flaky-test cộng điểm cho mọi prompt nhắc test; sàn chỉ ghi lại mức hiện tại, cải tiến sau (ví dụ trọng số IDF) cần đổi kiểu điểm công khai. (Mitigation: Sàn chỉ tăng trong skill-routing-cases.json và test floor sát số đo nên cải tiến sau phải nâng sàn.)
- **risk-audit-text-only** (low) — Test tham chiếu treo chỉ đọc văn bản trong backtick và dòng bắt đầu bằng harnix; cờ viết ngoài các dạng đó hoặc lệnh dựng động không bị kiểm.

## Evidence

- `chk-focused` — pass (2026-11-24 21:55:08 +07:00): pnpm test:gates — exit 0
- `chk-exercise-routing` — pass (2026-11-24 21:57:29 +07:00): mode: full. Chạy dist/cli.js skill --suggest từ thư mục không có dự án Harnix cho 21 ca nên kích hoạt, 5 ca gần-giống và 2 prompt không liên quan: hit@1 0.52, hit@3 0.76, kích hoạt nhầm 0.20, prompt không liên quan trả rỗng; 0 lỗi. _(1 earlier rerun not shown; see task.json for full history)_
- `chk-exercise-references` — pass (2026-11-24 21:57:31 +07:00): mode: full. Chạy dist/cli.js skill <tên> --reference <chủ đề> cho mọi cặp được nêu trong nguồn skill: 0 lỗi. _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-24 21:57:23 +07:00): pnpm test — exit 0
