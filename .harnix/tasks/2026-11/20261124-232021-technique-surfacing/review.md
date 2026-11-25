# Đưa gợi ý technique đến agent: techniqueHint và bỏ quy tắc Full luôn gợi ý

- **ID:** 20261124-232021-technique-surfacing
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 23:20:21 +07:00
- **Updated:** 2026-11-25 19:08:33 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Làm cho gợi ý technique skill thật sự đến được agent: một dòng chỉ cách nạp khi có gợi ý, và bớt gợi ý lặp vô ích.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `package.json`
- `scripts/exercise-technique-hint.mjs`
- `src/core/workflow/preflight.ts`
- `src/core/workflow/schema.ts`
- `src/core/workflow/technique-hint.ts`
- `test/unit/core/workflow/preflight.test.ts`
- `test/unit/core/workflow/technique-hint.test.ts`
- `test/workflow/behavior-snapshot.golden.json`
- `test/workflow/preflight-exercise.test.ts`
- `test/workflow/technique-hint-exercise.test.ts`
- `test/workflow/test-gates-script.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +4 / -4 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +3 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +5 / -3 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-advisories.mjs` | added | - |
| `scripts/exercise-run-check.mjs` | added | - |
| `scripts/exercise-technique-hint.mjs` | added | - |
| `src/commands/workflow-batch.ts` | added | - |
| `src/commands/workflow-command.ts` | modified | +8 / -0 |
| `src/commands/workflow-flags.ts` | modified | +18 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -6 |
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
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +6 / -3 |
| `src/skills/harnix-verify/references/evidence.md` | modified | +1 / -1 |

_(26 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): `workflow --preflight` thêm trường `techniqueHint` một dòng cố định chỉ khi có `suggestedTechniques` (nạp từng skill bằng `harnix skill <tên> --raw`); ngoại lệ so với quy tắc "preflight không emit command" được ghi tường minh trong `docs/HARNIX_WORKFLOW.md`; schema, golden và test preflight cập nhật.
- [x] `ac-2` (met): `suggestTechniques` không còn gợi ý `harnix-sequential-thinking` chỉ vì `mode === "full"`: chỉ khi title hoặc goal khớp refactor, kiến trúc, complex, đánh đổi, hoặc có từ 6 tiêu chí, hoặc từ 8 relevantPaths (dec-sequential-threshold); test preflight và technique-skills đồng bộ.
- [x] `ac-3` (met): Phương pháp và số đo cơ sở của phân tích mức nạp skill (88 phiên: technique 0 lần nạp, 11 trong 49 reference từng nạp) được ghi vào `research.md` của epic để so sánh lại sau vài tuần bằng cách phân tích transcript ngoài harnix; harnix không thêm bộ đếm hay telemetry.
- [x] `ac-4` (met): Tài liệu, CHANGELOG và phiên bản `2.40.0-dev.3` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-technique-hint.mjs` (preflight trong dự án tạm: task Full đơn giản không còn gợi ý sequential-thinking, task migration có `techniqueHint`).
- [x] `ac-5` (met): Test `test-gates-script.test.ts` bắt được lỗi dính tên file trong `test:gates` (token phải khớp `^test/...test.ts$`, không có `.ts` theo sau bởi ký tự khác khoảng trắng) và có test chứng minh chuỗi dính bị bắt; số file trong `test:gates` đếm lại sau mọi sửa `package.json`.

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-25 19:08:12 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-25 19:06:12 +07:00)
- [x] `chk-exercise-technique-hint` (focused): Exercise: preflight bằng CLI build thật trong dự án tạm (techniqueHint và gợi ý sequential-thinking) — pass (2026-11-25 19:08:22 +07:00)

## Decisions

- **dec-contract-exception** — techniqueHint là mở rộng hợp đồng một dòng: contract hiện nói preflight ngoài learning và baselineHint không emit prose hay command. Cần sửa tường minh docs/HARNIX_WORKFLOW.md và PRD, không in lệnh theo từng tên.
  - _Why:_ Người dùng cần chấp nhận khi duyệt epic; nếu từ chối, member này chỉ làm phần bỏ quy tắc Full luôn gợi ý.
- **dec-sequential-threshold** — sequential-thinking chỉ được gợi ý khi title hoặc goal khớp refactor|kiến trúc|complex|đánh đổi, hoặc task có từ 6 tiêu chí trở lên, hoặc từ 8 relevantPaths; mode full một mình không còn đủ.
  - _Why:_ Nghiên cứu 88 phiên: 15/16 lần preflight gợi ý là sequential-thinking vì mọi task Full, không ai nạp; gợi ý lặp mất tác dụng.
- **dec-gates-test-hardening** — Làm chặt test/workflow/test-gates-script.test.ts: mỗi token của test:gates phải khớp ^test/[^\s]+\.test\.ts$ và chuỗi script không chứa .ts theo sau bởi ký tự không phải khoảng trắng hoặc hết chuỗi; thêm test chứng minh chuỗi dính bị bắt.
  - _Why:_ Lỗi dính tên file trong test:gates (…test.tstest/…) tái diễn ở member 2 vì chính test hiện tại cũng nằm trong chuỗi dính nên không bắt được.

## Evidence

- `chk-focused` — pass (2026-11-25 19:06:12 +07:00): pnpm test:gates — exit 0
- `chk-exercise-technique-hint` — pass (2026-11-25 19:08:22 +07:00): mode: full; chạy scripts/exercise-technique-hint.mjs với dist/cli.js trong dự án tạm: 4 ca (task Full thường không bị gợi ý sequential-thinking, task refactor có, migration trỏ đúng skill, task đang làm không gợi ý và không có techniqueHint) _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-25 19:08:12 +07:00): pnpm test — exit 0
