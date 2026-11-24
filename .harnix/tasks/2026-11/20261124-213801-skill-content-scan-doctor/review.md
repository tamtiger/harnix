# Finding doctor quét nội dung đáng ngờ trong skill ngoài và đóng epic bằng bản minor

- **ID:** 20261124-213801-skill-content-scan-doctor
- **Mode:** lite
- **Epic:** 20261124-213757-external-skill-lessons
- **Status:** completed/finishing
- **Created:** 2026-11-24 21:38:01 +07:00
- **Updated:** 2026-11-24 23:03:31 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | risk-scan-recall: low, risk-scan-evasion: low |

## Goal

Thêm finding doctor chỉ đọc cảnh báo nội dung đáng ngờ trong skill và guide của dự án (nguồn ngoài), rồi đóng epic bằng bản minor sau một lượt harnix-review trên toàn diff.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `package.json`
- `scripts/exercise-skill-scan.mjs`
- `src/core/doctor/**`
- `test/README.md`
- `test/integration/commands/doctor.test.ts`
- `test/unit/core/doctor/**`
- `test/workflow/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -1 |
| `CHANGELOG.md` | modified | +9 / -0 |
| `NOTICE` | modified | +2 / -0 |
| `README.md` | modified | +2 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/UPSTREAM_BASELINE.md` | modified | +12 / -0 |
| `docs/UPSTREAM_MAPPING.md` | modified | +14 / -0 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-skill-routing.mjs` | added | - |
| `scripts/exercise-skill-scan.mjs` | added | - |
| `src/commands/skills-suggest.ts` | modified | +49 / -11 |
| `src/core/doctor/finding-codes-project.ts` | modified | +1 / -0 |
| `src/core/doctor/project.ts` | modified | +2 / -0 |
| `src/core/doctor/skill-content-finding.ts` | added | - |
| `src/core/doctor/skill-content-rules.ts` | added | - |
| `src/skills/catalog.ts` | modified | +14 / -3 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-debug/references/rival-hypotheses.md` | added | - |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/references/discoveries.md` | modified | +2 / -0 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-plan/references/pre-ready-risk.md` | added | - |
| `src/skills/harnix-research/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/references/source-verification.md` | added | - |
| `src/skills/harnix-review/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-review/references/disclosure.md` | added | - |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +5 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/README.md` | modified | +4 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +7 / -4 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/support/skill-reference-audit.ts` | added | - |
| `test/unit/core/doctor/skill-content-finding.test.ts` | added | - |
| `test/unit/core/doctor/skill-content-rules.test.ts` | added | - |
| `test/unit/skills/catalog.test.ts` | modified | +4 / -3 |
| `test/workflow/reasoning-references.test.ts` | added | - |
| `test/workflow/review-verify-wording.test.ts` | added | - |
| `test/workflow/skill-content-benign.test.ts` | added | - |
| `test/workflow/skill-content-limits.test.ts` | added | - |
| `test/workflow/skill-content-performance.test.ts` | added | - |
| `test/workflow/skill-reference-audit.test.ts` | added | - |
| `test/workflow/skill-routing-cases.json` | added | - |
| `test/workflow/skill-routing-exercise.test.ts` | added | - |

_(3 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Finding doctor mới `skill-suspicious-content` (thuộc `DOCTOR_FINDING_CODES`, mức `warning`, không fixable) quét chỉ đọc skill và guide của dự án trong `.harnix/spec/skills` và `.harnix/spec/guides` bằng regex thuần TypeScript, không mạng, không ghi file; chỉ gồm rule độ chính xác cao: chỉ dẫn ghi đè hay giấu hành động khỏi người dùng, pipe-to-shell, đọc credential (`~/.ssh`, `.aws`), gửi biến môi trường ra mạng, ký tự Unicode vô hình hoặc bidi. Không có rule base64 vì dễ bắt nhầm.
- [x] `ac-2` (met): Mỗi rule có fixture sinh ra finding và có fixture sạch (kể cả văn bản bàn về bảo mật một cách hợp lệ) không bị bắt; skill do Harnix sở hữu trong `src/skills` không bị quét; mức severity theo quy ước doctor và quyết định mức được ghi thành một decision vì ảnh hưởng exit code.
- [x] `ac-3` (met): Chạy thật `harnix doctor` bằng CLI build trên một dự án tạm có skill độc hại và skill sạch (thêm vào một script `scripts/exercise-*.mjs`), xác nhận finding xuất hiện đúng và `doctor` không ghi gì.
- [x] `ac-4` (met): Member cuối đóng epic: `pnpm version:sync <X.(Y+1).0> --fold-dev` kèm CHANGELOG, tài liệu và `pnpm selfhost:sync` nếu template đổi, và chạy `harnix-review` một lần trên toàn bộ diff epic trước finish.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-24 23:01:57 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-24 22:59:58 +07:00)
- [x] `chk-exercise-doctor` (focused): Exercise: chạy harnix doctor bằng CLI build thật trên dự án tạm có skill độc hại và skill sạch — pass (2026-11-24 23:00:01 +07:00)

## Decisions

- **dec-severity-warning** — Finding skill-suspicious-content ra mức warning (đúng quy ước finding mới), một mã duy nhất, chỉ rule chính xác cao, bỏ rule base64.
  - _Why:_ Người dùng chốt 2026-11-24. Nội dung đáng ngờ trong skill là rủi ro bảo mật thật nên đáng làm doctor đỏ; chỉ quét skill và guide của dự án nên hiếm khi xuất hiện; có thể hạ xuống info nếu false positive thực tế gây phiền.
- **dec-rules-precision** — Rule env-exfiltration chỉ bắt đẩy cả môi trường (printenv, env, os.environ, process.env nguyên khối) ra mạng, không bắt một biến trong header; pipe-to-shell cần URL; credential-read cần lệnh đọc với đường dẫn kho credential; rule ghi đè bỏ qua khối code, code inline và chuỗi trích dẫn; không có rule base64.
  - _Why:_ Một token trong header Authorization và 'curl | sh' nhắc trong cảnh báo là dùng hợp lệ phổ biến; finding là warning nên đổi exit code, nên ưu tiên độ chính xác hơn độ phủ.
- **trace-epic-review** — Review độc lập toàn diff epic bởi reviewer riêng (chỉ đọc, không nhận kết luận của người viết): verdict ban đầu not-ready với 6 finding. F1 ReDoS PIPE_TO_SHELL, F2 lỗi gõ test:gates bỏ qua instruction-budget và skill-scan-exercise, F3 false positive câu cảnh báo, F4 phạm vi quét và cắt im lặng, F5 hồi quy tiền tố của suggestSkills, F6 lời văn disclosure. Cả 6 đã sửa test-first, các check chạy lại exit 0; chưa có lượt review thứ hai độc lập trên bản sửa.
  - _Why:_ Đáp ứng tiêu chí ac-4: một lượt harnix-review trên toàn diff epic trước finish; ghi rõ bản sửa chưa được reviewer thứ hai kiểm.

## Residual risks

- **risk-scan-recall** (low) — Rule regex tiếng Anh/Việt theo mẫu cố định: bỏ sót lời ghi đè diễn đạt khác, nội dung đặt trong khối code hay chuỗi trích dẫn, và URL dựng lúc chạy (false negative); ngược lại một skill hợp lệ dùng đúng mẫu (ví dụ tài liệu cài đặt dùng curl URL | sh) sẽ bị cảnh báo và làm doctor thoát 1 (false positive). Không thay được việc đọc skill trước khi nhập; có thể hạ xuống info nếu phiền.
- **risk-scan-evasion** (low) — Rule quét skill là heuristic: kẻ tấn công có thể đặt từ phủ định (never, do not, không) trước câu độc để né, dòng lệnh dài hơn trần khoảng giữa (200 đến 300 ký tự) không khớp, và learned.md cùng project-facts không được quét (ngoài phạm vi đã duyệt). Một kết quả sạch không chứng minh file an toàn; finding info báo khi lần quét bị cắt. (Mitigation: Giữ rule chính xác cao, test hiệu năng và fixture độc/sạch, tài liệu nói rõ giới hạn; mở rộng phạm vi chỉ khi người dùng duyệt.)

## Evidence

- `chk-focused` — pass (2026-11-24 22:59:58 +07:00): pnpm test:gates — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `chk-exercise-doctor` — pass (2026-11-24 23:00:01 +07:00): node scripts/exercise-skill-scan.mjs — exit 0 _(4 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-24 23:01:57 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
