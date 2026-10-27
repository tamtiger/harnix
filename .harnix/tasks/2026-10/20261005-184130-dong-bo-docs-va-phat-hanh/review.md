# Đồng bộ tài liệu, skill, test cấu trúc và phát hành 2.0.5

- **ID:** 20261005-184130-dong-bo-docs-va-phat-hanh
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 18:41:25 +07:00
- **Updated:** 2026-10-06 09:11:40 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Làm test cấu trúc đủ chặt, sửa mặc định --init, dọn skill/tài liệu lỗi thời, rồi phát hành 2.0.5 với toàn bộ chuỗi acceptance xanh (R-022, R-029, R-030, R-033, R-035 và các mục P3).

## Non-goals

- Không thêm tính năng mới
- Không commit hay publish khi chưa được duyệt

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): `test/workflow/architecture.test.ts` bắt dynamic `import()`, side-effect import và `fs` không có tiền tố `node:`, cấm `core` import `configurators`; có fixture vi phạm chứng minh bộ quét hoạt động.
- `ac-2` (met): `workflow --init`: lệnh và input mặc định lấy từ `verify-plan`, `--mode` không hợp lệ báo lỗi, slug không kết thúc bằng `-`, thời gian chỉ qua `src/utils/clock.ts`, `--input` tách theo dấu phẩy như `--set-check`.
- `ac-3` (met): Skill và reference không chứa quy ước riêng của repo Harnix: bỏ `pnpm format`/`pnpm lint` cứng, `pnpm version:sync` và yêu cầu mirror `test/unit` khỏi `harnix-implement` và `harnix-plan` (thay bằng lệnh từ `verify-plan`/`project-facts`); `harnix-plan` bỏ yêu cầu dòng `**Verifies:**` còn sót từ ready-trace grammar; `references/replan.md` nhắc `--replace-check` và quy tắc bản thay phải khác `command`, `inputs` hoặc `cwd`; `references/ready-review.md` nêu suite check phải chạy lệnh test của dự án.
- `ac-4` (met): Số platform là 6 ở mọi bề mặt người dùng thấy: help `--platform` (`src/cli-workflow-commands.ts`), mô tả chương trình (`src/cli-program.ts`), thông báo uninstall (`src/core/global/uninstall.ts`), hàng `setup`/`uninstall` trong `README.md`, bảng platform trong `test/README.md`, danh sách cờ trong `docs/HARNIX_PRD.md` và `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`, và ghi chú registry trong `docs/UPSTREAM_MAPPING.md`; `test/unit/docs/supported-platforms.test.ts` được mở rộng để giữ danh sách này không lệch lại.
- `ac-5` (met): Quy tắc và số liệu thống nhất giữa docs, help và code: PRD:402, WORKFLOW:12 và :290 khớp WORKFLOW:136 về việc Full task và Epic luôn dừng ở `ready`/`await`; help `status --summary` ghi dưới 80 token như tài liệu; `references/evidence.md` ghi `evidence-expired` chỉ cho legacy, danh sách thư mục bỏ qua có `__pycache__` và quy tắc `.git` khớp code; `workflow --schema` transports liệt kê đủ `--init`, `--preflight`, `--snapshot`, `--inspect`; `test/README.md` ghi sàn coverage hiện hành (95, 98.6, 89); thông tin cũ trong `docs/prompts/*` (bốn platform, chín điều luật, đường dẫn máy cụ thể) được cập nhật hoặc đánh dấu lịch sử.
- `ac-6` (met): `CHANGELOG.md` không còn tên repo khách hàng; `pnpm version:sync 2.1.0 --summary ...` được chạy đúng một lần với một entry gộp toàn bộ epic hardening (gate xanh, đóng đường xanh giả, bảo toàn cấu hình global, state machine, bảo mật, tài liệu); `package.json`, CHANGELOG và template khớp nhau; `harnix doctor` không tăng cảnh báo so với trước task.
- `ac-7` (met): Cổng chất lượng xanh: `pnpm run typecheck`, `pnpm run lint` và `pnpm run test` (có coverage, không hạ ngưỡng) đều exit 0 trên cây mã cuối cùng của task.
- `ac-8` (met): Hướng dẫn multi-repo và quy tắc check mới có trong skill: reference mới `multi-repo` của `harnix-plan` (khi nào cần `cwd`, `verify-plan --recursive`, khai báo bằng `--set-check --cwd` và cần `--reason` sau planning, chạy chỉ bằng `--run-check` không truyền `--cwd`, ví dụ hai repo, các lỗi thường gặp); `references/evidence.md` mô tả `--run-check` chỉ chạy đúng `command` trong đúng `cwd`, evidence không được đề ngày tương lai và circuit breaker `stop` với lối đi `--replace-check`; skill `harnix-debug` trỏ tới breaker; cookbook trong template nhắc reference; test catalog và ngân sách instruction vẫn xanh.
- `ac-9` (met): Vệ sinh test và cấu hình: `HARNIX_UPDATE_GOLDEN` làm test thất bại khi chạy trong CI thay vì pass im lặng; sàn đếm test/assertion trong `test/unit/test-structure.test.ts` được nâng lên mức hiện tại; lý do miễn trừ sai của `src/index.ts` và comment ESLint lỗi thời (`release-v2 must remove this block`) được sửa; không thêm miễn trừ mới.

## Required checks

- `check-lint` (full): pnpm run lint (format:check + ESLint) exit 0 — pass (2026-10-06 09:09:43 +07:00)
- `check-scan-2` (focused): Replacement for check-scan — pass (2026-10-06 09:09:23 +07:00)
- `check-structure` (focused): Test cấu trúc, tài liệu, skill, template — pass (2026-10-06 09:10:10 +07:00)
- `check-suite` (full): pnpm run test (vitest + coverage) exit 0 — pass (2026-10-06 09:10:55 +07:00)
- `check-typecheck` (full): pnpm run typecheck exit 0 — pass (2026-10-06 09:09:28 +07:00)
- `check-version` (focused): Test đồng bộ phiên bản — pass (2026-10-06 09:01:39 +07:00)

## Decisions

- **d-doctor-delta** — Số cảnh báo harnix doctor đổi từ 44 lên 106 không so sánh được: 90 cảnh báo thuộc tích hợp global trong home thật (bản 2.0.x thành outdated khi lên 2.1.0), 16 thuộc project, gồm journal cũ bị redaction chặt hơn của task 5 gắn cờ; baseline 44 đo bằng dist cũ.
  - _Why:_ Người dùng chọn đánh dấu ac-6 đạt kèm ghi chú này, không chạy update --global trên home thật và không sửa journal.

## Residual risks

- **r-global-outdated** (low) — Tích hợp global trong home thật vẫn ở bản 2.0.x; chạy harnix update --global khi người dùng cho phép.

## Evidence

- `check-structure` — pass (2026-10-06 09:10:10 +07:00): pnpm vitest run test/workflow test/unit — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-version` — pass (2026-10-06 09:01:39 +07:00): pnpm vitest run test/workflow/version-sync.test.ts test/workflow/package-contract.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-typecheck` — pass (2026-10-06 09:09:28 +07:00): pnpm typecheck — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-lint` — pass (2026-10-06 09:09:43 +07:00): pnpm lint — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-06 09:10:55 +07:00): pnpm test — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
- `check-scan` — fail (2026-10-06 08:39:13 +07:00): pnpm — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-06 08:46:15 +07:00): Task contract revised at persisted replan: Hai lần fail do môi trường (thiếu .artifacts, dist cũ), không do code; thêm dist/** vào inputs để build cũ làm check stale.
- skipped (2026-10-06 09:00:20 +07:00): Task contract revised at persisted replan: dist/** khớp 0 file vì thư mục build bị bỏ qua nên check không chạy được; bỏ khỏi inputs, dist được build lại trước khi chạy.
- `check-scan-2` — pass (2026-10-06 09:09:23 +07:00): pnpm scan:release — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
