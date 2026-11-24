# Reference suy luận trước ready, debug giả thuyết đối thủ và chuẩn nguồn research

- **ID:** 20261124-213759-reasoning-references
- **Mode:** lite
- **Epic:** 20261124-213757-external-skill-lessons
- **Status:** completed/finishing
- **Created:** 2026-11-24 21:37:59 +07:00
- **Updated:** 2026-11-24 22:13:07 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-reference-wording-unmeasured: low |

## Goal

Đưa ba nhóm kỹ thuật suy luận chuyển được từ repo ngoài vào harnix dưới dạng reference ngắn nằm trong trần token: rủi ro trước ready, giả thuyết đối thủ khi debug, chuẩn nguồn khi research.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/**`
- `package.json`
- `scripts/**`
- `src/skills/**`
- `src/skills/catalog.ts`
- `test/workflow/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `NOTICE` | modified | +2 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/UPSTREAM_BASELINE.md` | modified | +12 / -0 |
| `docs/UPSTREAM_MAPPING.md` | modified | +11 / -0 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-skill-routing.mjs` | added | - |
| `src/commands/skills-suggest.ts` | modified | +25 / -10 |
| `src/skills/catalog.ts` | modified | +9 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-debug/references/rival-hypotheses.md` | added | - |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-plan/references/pre-ready-risk.md` | added | - |
| `src/skills/harnix-research/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/references/source-verification.md` | added | - |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/README.md` | modified | +3 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +3 / -2 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/support/skill-reference-audit.ts` | added | - |
| `test/unit/skills/catalog.test.ts` | modified | +3 / -2 |
| `test/workflow/reasoning-references.test.ts` | added | - |
| `test/workflow/skill-reference-audit.test.ts` | added | - |
| `test/workflow/skill-routing-cases.json` | added | - |
| `test/workflow/skill-routing-exercise.test.ts` | added | - |
| `test/workflow/skill-routing.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Reference `harnix skill harnix-plan --reference pre-ready-risk` gom ba kỹ thuật viết lại bằng lời của harnix: premortem (mỗi nguyên nhân top có tripwire, giảm thiểu, điều kiện dừng, ghi bằng `--add-risk`), điều kiện chịu lực và "killer condition" (thành criterion hoặc spike trước ready), và câu hỏi cửa một chiều hay hai chiều (một chiều buộc Full); có mục khi nào không dùng.
- [x] `ac-2` (met): Reference `harnix skill harnix-debug --reference rival-hypotheses`: ghi dấu hiệu kỳ vọng của mỗi giả thuyết trước khi xem bằng chứng, lý do loại một giả thuyết trở thành ràng buộc phủ định, không nới một invariant check trước khi loại trừ nguyên nhân từ đầu vào, và "chưa đủ để phân biệt" là kết quả hợp lệ; khớp quy tắc một giả thuyết mỗi lần và ba giả thuyết thất bại thì quay lại planning.
- [x] `ac-3` (met): Reference `harnix skill harnix-research --reference source-verification`: nguồn chưa kiểm chứng ghi `unverified`, link mở được hoặc tên đúng chưa chứng minh nội dung, `unverifiable` khác `wrong`, lỗi mạng không phải bằng chứng, tách Evidence, Inference và Assumption, và kết luận chỉ đúng trong phạm vi đã quét.
- [x] `ac-4` (met): Mỗi reference mới nằm trong trần token (không nâng `token-budgets.json`), được đăng ký trong `src/skills/catalog.ts` (test đăng ký reference bắt thiếu), có đúng một dòng trỏ tới nó trong SKILL.md tương ứng (harnix-plan sát trần nên phải rút chữ tương đương), chạy được qua `harnix skill <tên> --reference <chủ đề>` bằng CLI build thật (script `scripts/exercise-skill-references.mjs` tự phát hiện dòng trỏ mới) và nội dung là diễn đạt lại, không chép câu nguyên văn từ repo ngoài.
- [x] `ac-5` (met): Tài liệu, CHANGELOG và phiên bản (`pnpm version:sync`, member epic) được đồng bộ; checklist SKILL.md (không nhắc lệnh riêng của repo, dòng phiên bản) được duyệt.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-24 22:11:54 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-24 22:10:02 +07:00)
- [x] `chk-exercise-references` (focused): Exercise: chạy CLI build thật cho mọi cặp skill và reference được nhắc trong nguồn skill — pass (2026-11-24 22:12:45 +07:00)

## Decisions

- **dec-plan-budget-headroom** — harnix-plan/SKILL.md đo thực tế 1596/1700 token (số 1686 trước đó là của fixture khác), nên thêm một dòng trỏ không cần rút chữ và không nâng token-budgets.json.
  - _Why:_ Đo bằng scripts/measure-tokens.mjs (budgetUsage) sau khi thêm dòng trỏ; test instruction-budget xanh.
- **dec-provenance-recorded** — Ghi provenance cho hai repo có giấy phép rõ (research-agent-skills MIT, thinking-framework-skills Apache-2.0) vào NOTICE, UPSTREAM_BASELINE 2.6 và UPSTREAM_MAPPING 8.8; claude-code-skills không có LICENSE nên chỉ ghi nhận đã đọc, không NOTICE, không chép.
  - _Why:_ Đồng bộ với thông lệ của các upstream trước (hve-core, addyosmani) và quy tắc idea-only của epic.

## Residual risks

- **risk-reference-wording-unmeasured** (low) — Chưa đo hiệu quả thực tế của ba reference: chỉ có test hợp đồng nội dung, đăng ký, trỏ một dòng và chạy CLI thật; chưa có bằng chứng rằng agent dùng chúng và giảm lỗi. (Mitigation: Theo dõi vài task thật dùng plan, debug, research; bỏ hoặc rút nếu không ai nạp.)

## Evidence

- `chk-focused` — pass (2026-11-24 22:10:02 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-exercise-references` — pass (2026-11-24 22:12:45 +07:00): mode: full. scripts/exercise-skill-references.mjs chạy dist/cli.js build mới cho mọi cặp skill và reference được nhắc trong nguồn skill, gồm harnix-plan pre-ready-risk, harnix-debug rival-hypotheses, harnix-research source-verification; 0 lỗi. _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-24 22:11:54 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
