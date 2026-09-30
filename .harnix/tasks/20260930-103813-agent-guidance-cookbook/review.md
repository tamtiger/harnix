# Viết lại hướng dẫn skill và template cho agent

- **ID:** 20260930-103813-agent-guidance-cookbook
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-30 10:38:10 +07:00
- **Updated:** 2026-09-30 11:20:37 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Skill, `.harnix/workflow.md` và steering (Kiro/Antigravity/Claude/Codex) chỉ rõ cách dùng đúng CLI cuối cùng trên PowerShell và bash, cấm script tạm, bắt dùng clock, giải thích digest.

## Non-goals

- Không đổi hành vi CLI
- Không thêm skill hay nền tảng mới
- Không sửa lịch sử task đã hoàn tất

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-forbid-temp-scripts` (met): Các skill implement, check, continue, finish-work, debug, brainstorm và tài liệu activation dùng chung đều có quy tắc: chỉ đổi trạng thái task qua `harnix workflow`, cấm file tạm .ps1/.sh/.json và regex/Set-Content lên `task.json`/`review.md`/`.active`, và lệnh còn thiếu thì dừng báo cáo.
- `ac-cookbook-both-shells` (met): `workflow.md` có `### Command cookbook` với ví dụ PowerShell và bash cho evidence (flag và envelope), criterion met, transition, snapshot trước/sau, run-check, migrate, finish, cancel; dùng pipe (không dùng `<`), nêu giới hạn stdin 64 KiB và cách chạy lệnh ghép qua shell tường minh.
- `ac-clock-rule` (met): Quy tắc lấy `now`/`idPrefix` từ `clock` của preflight có trong `harnix-check`, `harnix-debug`, `harnix-continue`, `harnix-finish-work` và tài liệu activation.
- `ac-digest-explained` (met): Skill mô tả cái gì làm đổi và không làm đổi `inputDigest`, cách phục hồi sau replan (`--snapshot`, chạy lại, ghi lại) và khuyến nghị gộp mọi sửa contract vào một lần replan.
- `ac-docs-match-cli` (met): Không còn mâu thuẫn evidence-transport trong `harnix-check`; một test trích mọi `--flag` trên dòng chứa `harnix workflow` trong cookbook và 6 skill và xác nhận flag đó là option đã đăng ký của command `workflow`.

## Required checks

- `chk-guidance-focused` (focused): Test tập trung cho skill, template và cấu hình nền tảng. — pass (2026-09-30 11:17:15 +07:00)
- `chk-full-suite` (full): Typecheck, lint và toàn bộ test kèm coverage floor. — pass (2026-09-30 11:20:03 +07:00)

## Decisions

- **d-shared-activation-array** — Thêm ba mệnh đề vào cuối `HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS` thay vì tạo mảng mới.
  - _Why:_ Mọi consumer (steering Kiro/Antigravity, khối Claude/Codex, AGENTS.md) đã nối mảng này nên nội dung không thể lệch giữa nền tảng; test hiện có chỉ đòi các mệnh đề cũ vẫn có mặt.
- **d-identical-skill-section** — Mục `## Persistence rules` giống hệt nhau (byte) trong 6 skill; đoạn về digest chỉ ở brainstorm, continue, check.
  - _Why:_ Một nguồn diễn đạt, dễ test bằng so khớp chuỗi; digest chỉ liên quan tới stage lập kế hoạch, nối lại và verify.
- **d-cookbook-in-workflow-md** — Cookbook nằm trong `.harnix/workflow.md` (template workflow.ts), skill chỉ trỏ tới.
  - _Why:_ workflow.md được đọc ở mọi Lite/Full nên ví dụ không phải lặp trong từng skill và không làm phình ngân sách kích thước skill.
- **d-no-home-mutation** — Không chạy `harnix update --global` trên home thật; chỉ cập nhật project này bằng `harnix update`.
  - _Why:_ AGENTS.md cấm đụng home thật khi chưa được ủy quyền; người dùng tự chạy lệnh global.

## Residual risks

- **risk-global-installs-stale** (medium) — Bản skill và steering đã cài ở home người dùng (Kiro, Antigravity, Claude, Codex) chỉ cập nhật sau khi chạy harnix update --global; cho tới lúc đó agent vẫn thấy hướng dẫn cũ.
- **risk-agents-md-not-updated** (low) — AGENTS.md của dự án là file do người dùng sở hữu nên harnix update giữ nguyên; bootstrap gọn 8 KiB không mang quy tắc persistence, chúng nằm trong steering nền tảng, skill và workflow.md.
- **risk-persistence-test-outside-inputs** (low) — test/workflow/persistence-guidance.test.ts nằm ngoài inputs của check focused nên chỉ được chứng minh bởi check full-suite.

## Evidence

- `chk-guidance-focused` — pass (2026-09-30 11:17:15 +07:00): pnpm vitest run test/unit/templates test/integration/commands/skills.test.ts test/platform — guidance focused
- `chk-full-suite` — pass (2026-09-30 11:20:03 +07:00): pnpm typecheck && pnpm lint && pnpm test — chạy lại sau harnix update đồng bộ .harnix/workflow.md với template phiên bản 1.1.25 _(1 earlier rerun not shown; see task.json for full history)_
