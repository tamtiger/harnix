# Giảm chi phí context mỗi lượt: bỏ Status khỏi băm, learningMax, gom note gần trùng

- **ID:** 20261124-232022-context-cost
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 23:20:22 +07:00
- **Updated:** 2026-11-25 19:18:57 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | risk-near-duplicate-threshold: low, risk-status-hidden: low |

## Goal

Giảm chi phí context mỗi lượt: không chèn lại khối hook chỉ vì đổi trạng thái, cho đặt giới hạn ghi chú học và gom note gần trùng.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `package.json`
- `scripts/exercise-context-cost.mjs`
- `src/commands/internal-context.ts`
- `src/core/config/*`
- `src/core/context/*`
- `src/core/journal/learning-summary.ts`
- `test/README.md`
- `test/unit/*`
- `test/workflow/*`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +6 / -6 |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +2 / -1 |
| `docs/HARNIX_PRD.md` | modified | +4 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +6 / -4 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-advisories.mjs` | added | - |
| `scripts/exercise-context-cost.mjs` | added | - |
| `scripts/exercise-run-check.mjs` | added | - |
| `scripts/exercise-technique-hint.mjs` | added | - |
| `src/commands/internal-context.ts` | modified | +9 / -1 |
| `src/commands/workflow-batch.ts` | added | - |
| `src/commands/workflow-command.ts` | modified | +8 / -0 |
| `src/commands/workflow-flags.ts` | modified | +18 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -6 |
| `src/core/config/config-schema.ts` | modified | +17 / -3 |
| `src/core/config/config-validate.ts` | modified | +7 / -0 |
| `src/core/config/config.ts` | modified | +2 / -0 |
| `src/core/context/effective-context.ts` | modified | +1 / -0 |
| `src/core/journal/learning-summary.ts` | modified | +33 / -11 |
| `src/core/status.ts` | modified | +4 / -2 |
| `src/core/workflow/check-log.ts` | added | - |
| `src/core/workflow/check-output.ts` | modified | +3 / -0 |
| `src/core/workflow/checks-batch.ts` | added | - |
| `src/core/workflow/evidence-mode-advisory.ts` | added | - |
| `src/core/workflow/exercise-advisory.ts` | modified | +6 / -1 |
| `src/core/workflow/finish-advice.ts` | modified | +3 / -13 |
| `src/core/workflow/git-advisories.ts` | added | - |
| `src/core/workflow/index.ts` | modified | +1 / -0 |
| `src/core/workflow/preflight.ts` | modified | +5 / -2 |
| `src/core/workflow/ready-review.ts` | modified | +1 / -0 |
| `src/core/workflow/relevant-paths.ts` | added | - |
| `src/core/workflow/run-check.ts` | modified | +43 / -7 |
| `src/core/workflow/run-checks.ts` | modified | +3 / -0 |
| `src/core/workflow/schema.ts` | modified | +3 / -3 |
| `src/core/workflow/secret-scan-changes.ts` | modified | +3 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +14 / -0 |
| `src/core/workflow/technique-hint.ts` | added | - |
| `src/core/workflow/transition-advisories.ts` | added | - |
| `src/core/workflow/transition.ts` | modified | +9 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/ready-review.md` | modified | +1 / -0 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |

_(36 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Phần băm quyết định ẩn khối hook không còn gồm dòng `Status: x/y`: hai lượt cùng session chỉ khác Status thì lượt sau in rỗng; đổi id, title, goal hoặc learning thì vẫn in lại.
- [x] `ac-2` (met): `.harnix/config.yaml` nhận `context.learningMax` (0 đến 5, mặc định 5; `0` tắt note chưa duyệt); validator, schema và doctor chấp nhận; config cũ không đổi hành vi.
- [x] `ac-3` (met): Khi chọn note cho ngữ cảnh, bỏ note có độ giống token (Jaccard từ 0,6) với note đã chọn; fixture hai note gần trùng chỉ cho vào một; hook protocol và redaction không đổi.
- [x] `ac-4` (met): Tài liệu, CHANGELOG, golden và schema config, phiên bản `2.40.0-dev.4` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-context-cost.mjs` (stdin hook event hai lượt trong dự án tạm có task và note học).

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-25 19:18:27 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-25 19:16:35 +07:00)
- [x] `chk-exercise-context-cost` (focused): Exercise chạy CLI build thật: hook context hai lượt cùng session và learningMax trong dự án tạm — pass (2026-11-25 19:18:49 +07:00)

## Decisions

- **dec-status-out-of-hash** — Dòng Status: x/y của header bị thay bằng Status: * trước khi băm để quyết định ẩn khối hook; chỉ dòng đầu tiên khớp mẫu [a-z_-]+/[a-z_-]+ bị thay. Đổi id, title, goal hoặc ghi chú học vẫn in lại.
  - _Why:_ Chuyển trạng thái là việc thường xuyên nhất trong một task nên không đáng chèn lại cả khối; đo bằng CLI thật: lượt sau khi chỉ đổi trạng thái giảm từ khoảng 640 ký tự xuống 0.
- **dec-learning-max-hook-only** — context.learningMax chỉ giới hạn khối hook; trường learning của workflow --preflight vẫn tối đa 5 (nhưng đã được gom note gần trùng vì dedupe nằm trong summarizeLearning). Ngưỡng gom Jaccard 0,6 đặt trong NEAR_DUPLICATE_THRESHOLD.
  - _Why:_ Tiêu chí ac-2 và ac-3 nói về ngữ cảnh hook; đổi preflight cần quyết định riêng và đổi golden.

## Residual risks

- **risk-near-duplicate-threshold** (low) — Ngưỡng 0,6 là phỏng đoán: hai ghi chú khác ý nhưng dùng nhiều từ chung có thể bị gộp nhầm, ghi chú bị gộp không tới được agent; chưa đo trên journal thật.
- **risk-status-hidden** (low) — Sau khi agent nén ngữ cảnh, khối đã bị ẩn không được chèn lại và agent không thấy Status mới; rủi ro này đã có với cơ chế ẩn cũ, nay rộng hơn vì đổi trạng thái cũng bị ẩn. Agent đọc trạng thái thật bằng harnix status --summary hoặc preflight.

## Evidence

- `chk-focused` — pass (2026-11-25 19:16:35 +07:00): pnpm test:gates — exit 0
- `chk-exercise-context-cost` — pass (2026-11-25 19:18:49 +07:00): mode: full. node scripts/exercise-context-cost.mjs chạy dist/cli.js thật trong dự án tạm: lượt 1 643 ký tự, lượt 2 cùng trạng thái 0, sau khi chỉ đổi trạng thái 0 (trước đó in lại khối), sau khi đổi tiêu đề 646, ghi chú học hiện mặc định (824 ký tự) và biến mất khi learningMax 0 (627 ký tự). _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-25 19:18:27 +07:00): pnpm test — exit 0
