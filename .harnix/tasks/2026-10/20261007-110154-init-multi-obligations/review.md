# Khai báo nhiều tiêu chí và nhiều check ngay lúc --init bằng cờ lặp

- **ID:** 20261007-110154-init-multi-obligations
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-07 11:01:54 +07:00
- **Updated:** 2026-10-07 13:37:47 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Task có nhiều tiêu chí và nhiều check không còn phải dựng envelope JSON: --init nhận cờ lặp để khai báo thêm tiêu chí và check focused, rồi cổng ready kiểm tra như thường.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): --init lặp được --text, mỗi lần lặp tạo một criterion theo thứ tự (ac-1, ac-2, ...) và check suite phủ tất cả.
- `ac-2` (met): --init khai báo được thêm check focused bằng cờ lặp (id, mô tả, command, tiêu chí phủ, input); check khai báo thiếu tiêu chí phủ hoặc input bị từ chối với lỗi nêu cờ cần sửa.
- `ac-3` (met): Khi chỉ truyền một --text và một --command, hành vi và output của --init không đổi; có test và cookbook ghi cách dùng cờ lặp.
- `ac-4` (met): Check mà --init tạo từ lệnh test của dự án có scope full và id check-suite (không phải focused check-1 với mô tả tiếng Anh), để cổng suite nhận ngay mà không cần --set-check.

## Required checks

- `check-1` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 13:37:29 +07:00)
- `check-init` (focused): Test --init lặp --text, --with-check, check suite mặc định và lỗi cờ — pass (2026-10-07 13:36:06 +07:00)
- `check-gates` (focused): Contract tests (cli-contract, docs, golden, instruction budget) xanh sau khi thêm cờ --with-check và sửa tài liệu — pass (2026-10-07 13:36:10 +07:00)

## Decisions

- **d-ac3-vs-ac4** — ac-3 (output --init không đổi khi chỉ một --text và một --command) được hiểu là không đổi ngoài chuẩn hóa của ac-4: check sinh từ lệnh test của dự án đổi thành id check-suite, scope full, mô tả tiếng Việt; lệnh khác giữ check-1 focused.
  - _Why:_ Hai tiêu chí mâu thuẫn nếu đọc nguyên văn; ac-4 là thay đổi chủ đích.
- **d-ac4-premise** — Cổng suite không phụ thuộc scope của check (chỉ xét command và inputs), nên ac-4 là đồng nhất hóa với các member epic và cookbook, không phải sửa lỗi cổng.
  - _Why:_ Đọc suite-gate.ts: thông báo chỉ nói scope phải là focused hoặc full; lý do 'cổng suite nhận ngay' trong chữ của ac-4 không chính xác.
- **d-with-check-spec** — Check khai báo lúc --init dùng cờ lặp --with-check "id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>[;scope=focused|full][;description=<text>]": cặp khóa=giá trị ngăn cách bằng dấu chấm phẩy, danh sách ngăn cách bằng dấu cộng; id, command, criteria và input bắt buộc.
  - _Why:_ Cờ lặp thông thường không nhóm được nhiều trường của một check; một chuỗi đặc tả tránh phải dựng JSON mà không đổi các cờ --check/--command/--criteria đang dùng cho lệnh khác. Hạn chế: command không được chứa dấu chấm phẩy.

## Residual risks

- **r-surface-lists** (low) — Thêm cờ hoặc action workflow phải cập nhật đồng bộ: BOOLEAN_ACTIONS/VALUE_ACTIONS và FLAG_OWNERS trong workflow-flags.ts, BRIEF_ACTIONS, schema.ts, test/workflow/cli-contract.test.ts, test/unit/core/workflow/index.test.ts, test/unit/commands/workflow-handlers.test.ts và golden (HARNIX_UPDATE_GOLDEN=1); quên một chỗ chỉ lộ ra ở suite cuối.

## Evidence

- `check-init` — pass (2026-10-07 13:36:06 +07:00): pnpm exec vitest run test/unit/core/workflow/init-spec.test.ts test/unit/core/workflow/init-task.test.ts test/integration/commands/workflow-handlers.test.ts — exit 0
- `check-gates` — pass (2026-10-07 13:36:10 +07:00): pnpm test:gates — exit 0
- `check-1` — pass (2026-10-07 13:37:29 +07:00): pnpm test — exit 0
