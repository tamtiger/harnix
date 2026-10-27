# An toàn văn bản và transport chỉnh kế hoạch cho hidden workflow

- **ID:** 20260930-135720-workflow-text-safety-and-plan-transports
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-30 13:57:19 +07:00
- **Updated:** 2026-09-30 14:15:16 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Agent chỉnh check, criterion và relevantPaths bằng flag (không JSON, không script), stdin có BOM vẫn được đọc, và văn bản bị hỏng mã hóa (mojibake) bị từ chối thay vì được ghi vào task.

## Non-goals

- Không thêm --file
- Không đổi TaskRecord schema v3
- Không tự sửa dữ liệu task đã hỏng ở repository khác

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-add-criterion` (met): `--add-criterion <id> --text <text>` thêm criterion `pending` với id chưa tồn tại, giữ nguyên tiếng Việt trong text, và theo cùng quy tắc `replan`/`--reason` như `--set-check`.
- `ac-bom-stripped` (met): Body stdin bắt đầu bằng BOM UTF-8 vẫn được `--save`, `--evidence`, `--migrate`, `--cancel` và `--learn` parse thành công.
- `ac-docs-schema` (met): `workflow --schema`, PRD, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` §4 và `AGENTS.md` mô tả các transport mới và kiểm tra hỏng mã hóa; output các lệnh hiện có không đổi ngoài danh sách transport của `--schema`.
- `ac-guidance-text-safety` (met): Cookbook, `Persistence rules` của 6 skill và khối activation hướng dẫn chỉnh kế hoạch bằng flag, sửa prd/plan/design trực tiếp bằng công cụ sửa file, không đưa văn bản có dấu qua pipe hay script `-File` của powershell.exe 5.1, và không còn khẳng định `$OutputEncoding` một mình là đủ; test đối chiếu flag tài liệu với CLI vẫn pass.
- `ac-mojibake-rejected` (met): `saveWorkflow` từ chối envelope chứa chuỗi có U+FFFD hoặc chuỗi là mojibake windows-1252/windows-1258 của UTF-8 hợp lệ (task, artifacts, epic, epicMembers), kể cả qua đường replan; tiếng Việt, Latin có dấu và emoji hợp lệ vẫn được chấp nhận.
- `ac-set-check` (met): `--set-check <id>` thêm hoặc cập nhật một validation check (description, command, scope, required, criteria, input) của task v3 active và giữ field không nêu; check mới thiếu field bắt buộc bị từ chối; task đã qua planning cần `--reason` và tạo đúng một save `replan` kèm `contractRevision`, task đã ở `replan` thì save thường.
- `ac-set-paths` (met): `--set-paths` với `--relevant-path`/`--relevant-spec` lặp lại thay toàn bộ danh sách tương ứng, không cần `--reason`, và từ chối đường dẫn không an toàn.

## Required checks

- `chk-text-safety-focused` (focused): Test tập trung cho transport workflow, kiểm tra hỏng mã hóa và hướng dẫn. — pass (2026-09-30 14:13:16 +07:00)
- `chk-full-suite` (full): Typecheck, lint và toàn bộ test kèm coverage floor. — pass (2026-09-30 14:14:35 +07:00)

## Decisions

- **d-flags-carry-text** — Chỉnh nghĩa vụ bằng flag thay vì JSON; văn bản có dấu đi qua đối số dòng lệnh.
  - _Why:_ Đối số dòng lệnh Windows là UTF-16 nên node nhận UTF-8 đúng; stdin qua powershell.exe 5.1 bị đổi mã hóa và thêm BOM.
- **d-guard-not-repair** — Phát hiện mojibake thì từ chối, không tự sửa.
  - _Why:_ Tự sửa có thể đoán sai; từ chối kèm chỉ dẫn giữ dữ liệu người dùng nguyên vẹn.
- **d-reason-wraps-replan** — Transport chỉnh nghĩa vụ sau planning bắt buộc --reason và tự gói save replan + contractRevision.
  - _Why:_ Giữ đúng hợp đồng replan hiện có mà agent không phải dựng envelope.
- **d-artifacts-edited-directly** — prd.md, plan.md, design.md được sửa trực tiếp bằng công cụ sửa file, không qua --save.
  - _Why:_ Ready gate đọc file hiện có; tick checklist plan.md đã làm trực tiếp từ trước và không lỗi.

## Residual risks

- **risk-mojibake-heuristic** (low) — Kiểm tra mojibake chỉ bắt được UTF-8 bị đọc bằng windows-1252 hoặc windows-1258; một code page khác (ví dụ OEM 850) không bị phát hiện, và chuỗi Latin hiếm gặp có đúng dạng mojibake sẽ bị chặn nhầm.
- **risk-json-still-needed** (low) — Tạo task mới và sửa tiêu chí đã có vẫn cần JSON qua --save; chỉ check, criterion mới và relevantPaths có transport dạng flag.
- **risk-agent-installs-stale** (medium) — Agent Kiro, Antigravity, Claude và Codex chỉ nhận hướng dẫn mới sau harnix update --global; trước đó vẫn thấy bản cũ và có thể vẫn dựng JSON hoặc script.
- **risk-damaged-data-elsewhere** (medium) — Dữ liệu task đã bị hỏng mã hóa ở repository khác (ví dụ payment-hub) không được sửa tự động; guard chỉ ngăn hỏng thêm, cần khôi phục từ git hoặc replan có contractRevision.

## Evidence

- `chk-text-safety-focused` — pass (2026-09-30 14:13:16 +07:00): pnpm vitest run test/unit/core/workflow test/integration/commands test/workflow — chạy lại sau khi sửa lint _(1 earlier rerun not shown; see task.json for full history)_
- `chk-full-suite` — pass (2026-09-30 14:14:35 +07:00): pnpm typecheck && pnpm lint && pnpm test — chạy lại sau khi sửa 4 lỗi lint _(1 earlier rerun not shown; see task.json for full history)_
