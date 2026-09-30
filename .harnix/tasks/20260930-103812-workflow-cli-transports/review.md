# Bổ sung transport CLI cho evidence, criterion và chạy check

- **ID:** 20260930-103812-workflow-cli-transports
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-30 10:38:10 +07:00
- **Updated:** 2026-09-30 11:10:39 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Agent hoàn tất evidence, đánh dấu criterion `met`, migrate task legacy lên v3, chạy và ghi check chỉ bằng lệnh `harnix workflow`, với id/recordedAt/digest do CLI tự điền và output gọn tuỳ chọn.

## Non-goals

- Không thêm --file (khuyến khích file tạm trong repo, làm bẩn digest, thêm bề mặt path-safety)
- Không chạy command của check qua shell; --run-check chỉ nhận executable + mảng đối số
- Không đổi stdin envelope hiện có
- Không thêm cờ --json

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-evidence-flags` (met): `--evidence --check <id> --result pass|fail|skipped --summary <text> [--exit-code <n>] [--artifact <path>]... [--digest <hex>]` ghi đúng một evidence; CLI tự điền `id` dạng `ev-<checkId>-<n>`, `recordedAt` từ clock đã cấu hình và `inputDigest` (check v3 required, result pass/fail); pass/fail thiếu `--exit-code` bị từ chối; stdin envelope cũ vẫn hoạt động y hệt.
- `ac-criterion-met` (met): `--criterion <id>[,<id>] --met [--evidence-ids <ids>]` đặt criterion `met` với evidenceIds mặc định là pass mới nhất còn tươi của các required check bao phủ criterion; bị từ chối khi thiếu pass tươi, criterion không tồn tại, task không phải v3, hoặc evidence không thuộc check bao phủ criterion.
- `ac-brief-output` (met): `--brief` cho `--save|--transition|--evidence|--criterion|--migrate|--finish` trả `{id,status,checkpoint,updatedAt}` (kèm `evidenceId` khi có); không có `--brief` output giữ nguyên như hiện tại.
- `ac-run-check` (met): `--run-check <id> -- <exe> [args...]` chụp digest, chạy tiến trình bằng process runner inject được (không shell), chụp lại digest; digest bằng nhau thì ghi evidence (exit 0 = pass, khác 0 = fail), lệch thì không ghi và báo lỗi; đuôi output (tối đa 2000 ký tự) trả về trong `outputTail` nhưng không lưu vào task.
- `ac-migrate-to-v3` (met): `--migrate [stdin { checks }]` migrate task active legacy v1/v2 chưa kết thúc, không blocked lên v3 trong một lệnh: giữ status, checkpoint, criteria, field nền của required check và evidence cũ, bỏ `@task-contract`, append đúng evidence `task-schema-to-v3` với thời gian từ clock; `criterionIds`/`inputs` không suy ra được phải lấy từ `checks` và thiếu thì bị từ chối kèm danh sách; task v3, completed, cancelled, blocked bị từ chối.
- `ac-contract-docs-schema` (met): `workflow --schema` liệt kê các transport mới; PRD, `docs/HARNIX_WORKFLOW.md` và `docs/IMPLEMENTATION_PLAN.md` §4 mô tả chúng; output các lệnh hiện có và dữ liệu `.harnix` cũ không đổi (golden snapshot giữ nguyên).

## Required checks

- `chk-transport-focused` (focused): Test tập trung cho các transport workflow. — pass (2026-09-30 11:10:26 +07:00)
- `chk-full-suite` (full): Typecheck, lint và toàn bộ test kèm coverage floor. — pass (2026-09-30 11:09:38 +07:00)

## Decisions

- **d-no-file-flag** — Không thêm `--file` cho `--save`/`--evidence`; thay bằng transport dạng flag và pipe.
  - _Why:_ `--file` khuyến khích file tạm trong repo (làm bẩn digest nếu khớp inputs) và thêm bề mặt path-safety; flag cho phép bỏ hẳn file tạm.
- **d-run-check-no-shell** — `--run-check` nhận executable + mảng đối số sau `--`, chạy bằng process runner inject được, không qua shell; đuôi output chỉ trả về, không lưu.
  - _Why:_ AGENTS.md cấm nối chuỗi shell; command dạng `a && b` trong task chỉ để tài liệu, agent chạy từng phần hoặc dùng flag evidence. Output có thể chứa bí mật nên không persist.
- **d-migrate-no-guessing** — `--migrate` không suy đoán `criterionIds` (v1) và `inputs` rỗng: lấy từ stdin `checks`, thiếu thì lỗi liệt kê. Chỉ áp dụng cho task active.
  - _Why:_ Suy đoán coverage/inputs làm yếu bằng chứng; mọi pass cũ vốn đã stale sau migrate nên chi phí khai báo là một lần. Người dùng yêu cầu hỗ trợ migrate lên v3 cùng đợt này.
- **d-flags-share-save-guards** — Mọi transport mới build candidate rồi gọi `saveWorkflow`; không đường ghi riêng.
  - _Why:_ Giữ nguyên khóa, digest recompute, bất biến obligation và rollback.
- **d-extract-command** — Tách wiring `workflow` sang `src/commands/workflow-command.ts` trước khi thêm flag.
  - _Why:_ `cli-program.ts` sát ngưỡng complexity/max-lines; tách không đổi hành vi và cho phép test tích hợp riêng.

## Residual risks

- **risk-run-check-compound** (low) — --run-check chỉ chạy một tiến trình; lệnh ghép a && b của check phải gọi qua shell tường minh (ví dụ bash -c với đường dẫn đầy đủ) hoặc tách thành nhiều check.
- **risk-cmd-metachar** (low) — Trên Windows, tên lệnh trần đi qua cmd.exe /d /s /c và từ chối đối số chứa & | < > ^ % dấu nháy kép hay xuống dòng, nên một số đối số hợp lệ phải dùng đường dẫn đầy đủ tới file thực thi.
- **risk-migrate-v1-overrides** (low) — --migrate không suy đoán criterionIds/inputs: task v1 luôn cần stdin checks cho mọi required check; task v2 hợp lệ thường migrate được không cần stdin.
- **risk-golden-additive-edit** (low) — Snapshot golden của workflow --schema được sửa tay theo hướng chỉ thêm transport mới (không regenerate); nếu schema đổi thêm cần cập nhật cùng lúc.

## Evidence

- `chk-transport-focused` — pass (2026-09-30 11:10:26 +07:00): pnpm vitest run test/unit/core/workflow test/integration/commands test/workflow — chạy lại sau khi thêm test dispatcher _(1 earlier rerun not shown; see task.json for full history)_
- `chk-full-suite` — pass (2026-09-30 11:09:38 +07:00): pnpm typecheck && pnpm lint && pnpm test — chạy lại sau khi bổ sung test dispatcher để coverage functions đạt ngưỡng 98.1% _(1 earlier rerun not shown; see task.json for full history)_
