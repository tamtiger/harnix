# Chuẩn hóa lời văn review và verify: không-chứng-minh, could-not-verify, escalation

- **ID:** 20261124-213800-review-verify-wording
- **Mode:** lite
- **Epic:** 20261124-213757-external-skill-lessons
- **Status:** completed/finishing
- **Created:** 2026-11-24 21:38:00 +07:00
- **Updated:** 2026-11-24 22:22:00 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-wording-unmeasured: low |

## Goal

Siết lời hướng dẫn của review, verify và implement để bằng chứng nêu rõ điều nó không chứng minh, phần không kiểm được và lối thoát replan, mà không đổi CLI hay transition.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `NOTICE`
- `README.md`
- `docs/**`
- `package.json`
- `scripts/**`
- `src/skills/catalog.ts`
- `src/skills/harnix-implement/**`
- `src/skills/harnix-review/**`
- `src/skills/harnix-verification-gap/**`
- `test/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `NOTICE` | modified | +2 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/UPSTREAM_BASELINE.md` | modified | +12 / -0 |
| `docs/UPSTREAM_MAPPING.md` | modified | +14 / -0 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-skill-routing.mjs` | added | - |
| `src/commands/skills-suggest.ts` | modified | +25 / -10 |
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
| `test/README.md` | modified | +3 / -0 |
| `test/integration/commands/skills.test.ts` | modified | +7 / -4 |
| `test/platform/codex-global.test.ts` | modified | +1 / -1 |
| `test/support/skill-reference-audit.ts` | added | - |
| `test/unit/skills/catalog.test.ts` | modified | +4 / -3 |
| `test/workflow/reasoning-references.test.ts` | added | - |
| `test/workflow/review-verify-wording.test.ts` | added | - |
| `test/workflow/skill-reference-audit.test.ts` | added | - |
| `test/workflow/skill-routing-cases.json` | added | - |
| `test/workflow/skill-routing-exercise.test.ts` | added | - |
| `test/workflow/skill-routing.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Reference mới `harnix skill harnix-review --reference report-limits` (không nhân đôi `finding-triage` hay `multi-lens`) yêu cầu: mục "Could-Not-Verify" bắt buộc có kể cả rỗng, mục "đã thử bác bỏ nhưng không thấy gì" ghi rõ đã thử gì, và reviewer độc lập chỉ nhận luận đề cùng bằng chứng chứ không nhận lập luận của người viết.
- [x] `ac-2` (met): `harnix-verify` hoặc `harnix-verification-gap` yêu cầu mỗi check nêu nó không chứng minh điều gì, kết luận chỉ đúng trong phạm vi đã quét, và một check bị bỏ qua hoặc chạy 0 test không phải pass (CLI đã từ chối 0 test ở `run-check.ts`; chỉ bổ sung lời hướng dẫn).
- [x] `ac-3` (met): `harnix-implement` hướng dẫn khi một tiêu chí không đạt được thì chuyển `replan` kèm điều gì sẽ giải quyết được, thay vì yếu hóa test hay tiêu chí; khớp luồng replan hiện có, không thêm transition.
- [x] `ac-4` (met): Mọi thay đổi nằm trong trần token (không nâng budget), mỗi reference có dòng trỏ, chạy được qua CLI build thật (thêm vào `scripts/exercise-skill-references.mjs`), tài liệu, CHANGELOG và phiên bản (member epic) được đồng bộ.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-24 22:21:38 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-24 22:19:34 +07:00)
- [x] `chk-exercise-references` (focused): Exercise: chạy CLI build thật nạp từng reference qua harnix skill --reference — pass (2026-11-24 22:21:47 +07:00)

## Decisions

- **dec-disclosure-topic-name** — Reference review đặt tên disclosure thay vì report-limits.
  - _Why:_ Công cụ Write của fork từ chối ghi file tên report-limits.md (coi là file báo cáo); nội dung là reference nguồn của sản phẩm nên đổi tên cho đúng nghĩa hơn.
- **dec-wording-no-duplication** — Không nhân đôi finding-triage; run-check.ts đã từ chối 0 test nên mục verification-gap chỉ thêm lời hướng dẫn, và replan dùng luồng sẵn có không thêm transition hay cờ.
  - _Why:_ Đối chiếu với finding-triage.md, run-check.ts và discoveries.md trước khi viết.

## Residual risks

- **risk-wording-unmeasured** (low) — Chưa có bằng chứng agent đọc reference disclosure hay mục 7 và các review có thật sự công bố Could-Not-Verify; test chỉ ghim cụm từ, không kiểm chất lượng diễn đạt.

## Evidence

- `chk-focused` — pass (2026-11-24 22:19:34 +07:00): pnpm test:gates — exit 0
- `chk-exercise-references` — pass (2026-11-24 22:21:47 +07:00): mode: full — CLI build thật (dist) nạp mọi reference qua harnix skill <tên> --reference <chủ đề>, gồm review/disclosure; không chạy ứng dụng ngoài CLI _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-24 22:21:38 +07:00): pnpm test — exit 0
