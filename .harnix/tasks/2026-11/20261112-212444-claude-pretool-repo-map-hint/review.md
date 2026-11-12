# Hook PreToolUse nhắc dùng repo-map cho Claude Code

- **ID:** 20261112-212444-claude-pretool-repo-map-hint
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-11-12 21:24:44 +07:00
- **Updated:** 2026-11-12 21:45:22 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 3 | r-noise-flags: low, r-bash-latency: low, r-additionalcontext-unverified: medium |

## Goal

Agent Claude Code nhận nhắc nhở repo-map ngay tại thời điểm gọi Grep hoặc grep -r/rg theo tên symbol, không bị chặn, để quy tắc dùng repo-map thực sự được tuân theo.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +9 / -9 |
| `docs/HARNESS_RESEARCH.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -0 |
| `docs/UPSTREAM_MAPPING.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/internal-context-cli.ts` | modified | +16 / -2 |
| `src/commands/internal-context.ts` | modified | +20 / -0 |
| `src/commands/pretool-hint.ts` | added | - |
| `src/commands/setup.ts` | modified | +2 / -2 |
| `src/configurators/claude.ts` | modified | +49 / -0 |
| `src/core/platform/facts.ts` | modified | +6 / -0 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
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
| `test/platform/claude-global.test.ts` | modified | +54 / -2 |
| `test/platform/settings-json-fidelity.test.ts` | modified | +39 / -6 |
| `test/unit/commands/internal-context-cli.test.ts` | modified | +109 / -0 |
| `test/unit/commands/pretool-hint.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Trong dự án Harnix đã khởi tạo, hook PreToolUse của Claude Code với tool Grep hoặc Bash chạy grep -r/rg có pattern là một định danh trả về additionalContext nhắc dùng harnix repo-map --refs <symbol>, và không bao giờ chặn tool.
- [x] `ac-2` (met): Hook không phát gì, không ghi file, không dùng mạng khi pattern không phải một định danh (chuỗi văn bản, regex), khi tool khác Grep và Bash, hoặc khi cwd nằm ngoài dự án Harnix đã khởi tạo.
- [x] `ac-3` (met): harnix setup --claude, update --global và uninstall --global --yes cài, cập nhật và gỡ đúng một nhóm hook PreToolUse do Harnix sở hữu (matcher Grep|Bash), giữ nguyên hook của người dùng; doctor nhận biết nhóm này.
- [x] `ac-4` (met): Tài liệu và hợp đồng đồng bộ (AGENTS.md, PRD, workflow, implementation plan, template), trần token không tăng, phiên bản và CHANGELOG được nâng một lần.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-12 21:44:50 +07:00)
- [x] `chk-hint` (focused): chk-hint — pass (2026-11-12 21:38:50 +07:00)
- [x] `chk-claude-hook` (focused): chk-claude-hook — pass (2026-11-12 21:38:53 +07:00)
- [x] `chk-gates` (focused): chk-gates — pass (2026-11-12 21:39:03 +07:00)

## Decisions

- **d-remind-not-block** — Hook PreToolUse chỉ nhắc (additionalContext), không chặn.
  - _Why:_ Người dùng chọn hướng nhắc không chặn ngày 2026-11-12; chặn cứng có nguy cơ chặn nhầm khi tìm chuỗi văn bản.
- **d-claude-only** — Phạm vi chỉ Claude Code.
  - _Why:_ Vấn đề quan sát ở Claude Code; các nền tảng khác chưa có bằng chứng, mở task riêng khi cần.
- **d-stateless** — Phát hiện không trạng thái: chỉ pattern định danh, không nhận diện đọc lại file lần hai.
  - _Why:_ Hook phải no-write và không đọc cache phiên; trạng thái vi phạm hợp đồng context.
- **d-pretool-contract** — Claude Code PreToolUse: stdin có tool_name, tool_input (Grep.pattern, Bash.command); hookSpecificOutput.additionalContext được tài liệu hỗ trợ; matcher Grep|Bash là danh sách chính xác hợp lệ; exit 0 không quyết định thì tool chạy qua luồng quyền bình thường.
  - _Why:_ Xác minh từ code.claude.com/docs/en/hooks (Slice 0). Chưa xác minh: phiên bản đầu tiên hỗ trợ additionalContext cho PreToolUse và hành vi khi chỉ có additionalContext; kiểm bằng smoke thủ công cuối.

## Residual risks

- **r-noise-flags** (low) — Bộ phát hiện chưa xử lý cờ nhận giá trị (rg --files src, rg -g src foo): có thể nhắc thừa với từ khóa không phải symbol; chỉ là một dòng nhắc, không chặn.
- **r-bash-latency** (low) — Matcher Grep|Bash chạy node mỗi lần gọi Bash (khoảng 0,16 giây đo trên máy này); nếu thấy chậm, thu hẹp matcher hoặc thêm bộ lọc sớm.
- **r-additionalcontext-unverified** (medium) — Chưa xác minh phiên bản Claude Code đầu tiên hỗ trợ additionalContext cho PreToolUse và hành vi khi chỉ có additionalContext; cần quan sát trong phiên Claude Code thật sau khi cài.

## Evidence

- `chk-hint` — pass (2026-11-12 21:38:50 +07:00): pnpm exec vitest run test/unit/commands/pretool-hint.test.ts — exit 0
- `chk-claude-hook` — pass (2026-11-12 21:38:53 +07:00): pnpm exec vitest run test/platform/claude-global.test.ts — exit 0
- `chk-gates` — pass (2026-11-12 21:39:03 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-11-12 21:44:50 +07:00): pnpm test — exit 0
