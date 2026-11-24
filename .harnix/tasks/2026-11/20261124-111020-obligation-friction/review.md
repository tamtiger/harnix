# Giảm ma sát khi khai báo obligation: gộp lỗi ready, hint đúng thứ tự, slug tự sinh

- **ID:** 20261124-111020-obligation-friction
- **Mode:** lite
- **Epic:** 20261124-111018-session-feedback-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 11:10:18 +07:00
- **Updated:** 2026-11-24 11:33:43 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |
| Residual risks | 1 | risk-rerun-truncated: low |

## Goal

Agent không phải đoán thứ tự và cú pháp: lỗi ready/dry-run được gom một lần, hint của các lệnh sửa obligation in sẵn lệnh đúng, và --init tự sinh slug khi title có dấu.

## Non-goals

- Không đổi hợp đồng đóng băng của TaskRecord v3, chuyển trạng thái hay hook protocol
- Không thêm package, bin, daemon hay surface nền tảng mới
- Không thêm transition mới (verifying→in_progress vẫn bị cấm; chỉ in sẵn chuỗi lệnh replan hợp lệ)
- Không nới quy tắc bất biến của check đã pass

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/**`
- `package.json`
- `src/**`
- `test/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -0 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +3 / -3 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-flags.ts` | modified | +11 / -4 |
| `src/core/platform/user-path-hints.ts` | added | - |
| `src/core/platform/user-paths.ts` | modified | +3 / -2 |
| `src/core/spec/exercise-runbook.ts` | added | - |
| `src/core/stack/verify-plan.ts` | modified | +5 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +1 / -1 |
| `src/core/tasks/transition-hint.ts` | modified | +1 / -1 |
| `src/core/workflow/exercise-advisory.ts` | added | - |
| `src/core/workflow/ready.ts` | modified | +6 / -1 |
| `src/core/workflow/run-check.ts` | modified | +1 / -1 |
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
| `src/utils/check-runner.ts` | modified | +7 / -2 |
| `test/integration/commands/workflow-flags.test.ts` | modified | +7 / -0 |
| `test/unit/core/platform/user-path-hints.test.ts` | added | - |
| `test/unit/core/platform/user-paths.test.ts` | modified | +3 / -0 |
| `test/unit/core/spec/exercise-runbook.test.ts` | added | - |
| `test/unit/core/tasks/task-validate-contracts.test.ts` | modified | +12 / -0 |
| `test/unit/core/tasks/transition-hint.test.ts` | modified | +8 / -0 |
| `test/unit/core/workflow/exercise-advisory.test.ts` | added | - |
| `test/unit/core/workflow/ready.test.ts` | modified | +14 / -0 |
| `test/unit/core/workflow/run-check.test.ts` | modified | +10 / -0 |
| `test/unit/utils/check-runner.test.ts` | modified | +12 / -0 |

## Acceptance criteria

- [x] `ac-2` (met): Lỗi `unknown criterion … in check` nêu thứ tự đúng và lệnh sửa (`--add-criterion <id> --text <t>` trước `--set-check`); gợi ý của `Illegal transition` đi lùi về trước (ví dụ verifying → in_progress) in sẵn cách hợp lệ: sửa obligation bằng `--set-check` hoặc `--set-criterion` kèm `--reason`, rồi `--transition ready/ready` khi checkpoint là replan. Có test pin nội dung.
- [x] `ac-3` (met): Bốn thông báo được pin bằng test: lỗi operand của `--set-paths` nêu `--relevant-path <path>` (lặp được) và `--relevant-spec`; lỗi `--run-check` lệch lệnh khai báo in sẵn lệnh `--run-check <id> -- <argv đã khai báo>`; lỗi không khởi động được executable nêu mã lỗi và gợi ý chạy chương trình thật (ví dụ `python -m pytest` thay cho shim); lỗi symlink của user-global nêu `harnix doctor --global` và các biến dời root (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `XDG_CONFIG_HOME`), không in đường dẫn tuyệt đối.
- [x] `ac-5` (met): Tài liệu, skills và template liên quan được đồng bộ, selfhost:sync chạy khi cần, phiên bản nâng một lần theo chính sách member epic kèm CHANGELOG.

## Required checks

- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI contract, ngân sách token, nguồn skill) — pass (2026-11-24 11:31:23 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-24 11:33:26 +07:00)

## Decisions

- **dec-no-auto-slug** — Không tự sinh slug từ title có dấu và bỏ tiêu chí gộp lỗi ready
  - _Why:_ AGENTS.md buộc ID task là slug tiếng Anh nên slug bỏ dấu tiếng Việt vi phạm quy ước; lỗi hiện tại đã in sẵn lệnh --slug đúng. Dry-run ready đã gom mọi issue (test collects every independent issue in one pass).
- **dec-docs-synced** — Đã rà README, AGENTS.md, PRD, WORKFLOW, template và skills: chỉ đổi nội dung hint nên không cần sửa ngoài CHANGELOG; template workflow.md không đổi nên không chạy selfhost:sync
  - _Why:_ AGENTS.md đã nêu hint phải nêu lệnh đúng; không đổi cờ, enum hay hợp đồng đóng băng

## Residual risks

- **risk-rerun-truncated** (low) — Lệnh chạy lại trong thông báo run-check dùng describeCommand nên bị cắt bằng ... khi lệnh khai báo quá dài; hint khi thiếu criterion không nhắc --reason cần sau planning (Mitigation: dùng harnix status --checks để xem lệnh đầy đủ)

## Evidence

- `chk-focused` — pass (2026-11-24 11:31:23 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-24 11:33:26 +07:00): pnpm test — exit 0
