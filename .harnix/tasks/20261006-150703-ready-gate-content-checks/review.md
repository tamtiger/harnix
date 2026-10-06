# Cổng ready kiểm tra nội dung kế hoạch và buộc xác nhận ready-review

- **ID:** 20261006-150703-ready-gate-content-checks
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-06 15:07:30 +07:00
- **Updated:** 2026-10-06 15:55:46 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Đưa ready self-review vào chính Harnix để mọi nền tảng và mọi repo đều bị chặn khi kế hoạch Full còn placeholder, tiêu chí không có trong plan.md, hoặc tiêu chí chỉ được phủ bởi suite toàn dự án; chuyển ready cho task Full phải kèm xác nhận --reviewed. Task này được làm trước các member còn lại của epic để chúng được hưởng cổng mới.

## Non-goals

- Không phân tích ngôn ngữ tự nhiên ngoài danh sách token và cụm cố định
- Không chặn bằng cụm hoãn quyết định mềm
- Không đổi trạng thái của task đã ở ready hoặc sau đó

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Khi một task Full đi vào ready/ready (chuyển từ planning hoặc replan, bằng --transition hoặc --save), việc đó bị chặn nếu prd.md hoặc plan.md chứa token placeholder TBD, TODO, FIXME, ???, <placeholder> ngoài code fence và inline code; issue có dạng 'plan.md:<dòng> placeholder <token>'. Cụm hoãn quyết định mềm (tiếng Anh và tiếng Việt, so khớp không dấu) chỉ thành advisory.
- `ac-2` (met): Khi task Full đi vào ready/ready, việc đó bị chặn nếu có tiêu chí mà id của nó không xuất hiện (khớp nguyên từ, phân biệt hoa thường) trong plan.md; issue liệt kê các id thiếu.
- `ac-3` (met): Mỗi tiêu chí chưa waive phải được phủ bởi ít nhất một check bắt buộc có scope focused (không tính check suite scope full): task Full bị chặn khi vào ready/ready, task Lite chỉ có advisory trong --dry-run; issue liệt kê id tiêu chí thiếu.
- `ac-4` (met): harnix workflow --transition ready/ready cho task Full yêu cầu cờ --reviewed (cờ chỉ hợp lệ với --transition); thiếu cờ thì từ chối với lỗi nêu checklist ready-review rút gọn và các phát hiện; --dry-run luôn trả reviewChecklist cùng issues/advisories mà không cần cờ; task Lite không cần cờ; --save vẫn áp dụng cổng nội dung nhưng không thể kiểm cờ.
- `ac-5` (met): Cổng nằm hoàn toàn ở CLI (lỗi của --transition và output --dry-run) nên mọi nền tảng và repo đều gặp; workflow.md, skill harnix-plan, reference ready-review, AGENTS.md và mô tả --transition trong --schema nêu cờ --reviewed và các phát hiện; test parity tài liệu và golden schema được cập nhật có chủ đích.
- `ac-6` (met): Cổng nội dung chỉ chạy khi task đi vào ready/ready: task đã ở ready/ready (lưu quyết định, đường dẫn, bằng chứng) hoặc ở các trạng thái sau đó không bị chặn; task v3 cũ vẫn đọc được; fixture test dùng chung được cập nhật để đạt cổng mới thay vì nới cổng.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 15:55:13 +07:00)
- `check-ready-gate` (focused): Test cổng nội dung ready, cờ --reviewed, dry-run và CLI — pass (2026-10-06 15:49:01 +07:00)
- `check-docs` (focused): Tài liệu và skill mô tả cờ --reviewed và cổng nội dung — pass (2026-10-06 15:49:06 +07:00)

## Decisions

- **ready-gate-entering-only** — Cổng nội dung ready chỉ chạy khi task đi vào ready/ready (existing.checkpoint khác ready); save.ts chạy lại cổng ở mọi lần lưu của task ready nên nếu không chặn điều kiện này thì task đã ở ready bị khóa khỏi các thay đổi không liên quan.
  - _Why:_ Giữ nguyên hành vi cho task đang ở ready và sau đó; chỉ kế hoạch mới hoặc replan mới bị kiểm nội dung.

## Residual risks

- **ready-gate-reviewed-unverifiable** (low) — Cờ --reviewed chỉ buộc người gọi thấy checklist, không chứng minh được review đã làm; chỉ ba kiểm tra nội dung (placeholder, id tiêu chí trong plan, check focused) là kiểm chứng được bằng máy, và --save không có cờ này.

## Evidence

- `check-ready-gate` — pass (2026-10-06 15:49:01 +07:00): pnpm exec vitest run test/unit/core/workflow/ready.test.ts test/unit/core/workflow/ready-content.test.ts test/unit/core/workflow/transition.test.ts test/integration/commands/workflow-flags.test.ts ... — exit 0
- `check-docs` — pass (2026-10-06 15:49:06 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts test/workflow/skill-sources.test.ts test/workflow/instruction-budget.test.ts — exit 0
- `check-suite` — pass (2026-10-06 15:55:13 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
