# Plan: Đồng bộ tài liệu, skill, test cấu trúc và phát hành 2.1.0

Mỗi slice theo thứ tự RED rồi GREEN; slice chỉ sửa prose dùng ngoại lệ TDD (kiểm bằng test tài liệu/skill/typecheck).

- [x] S1 (ac-1): `test/workflow/architecture.test.ts` mở rộng bộ quét import (dynamic `import()`, side-effect `import "x"`, `fs` không `node:`, `core` không import `configurators`) và thêm fixture vi phạm; sửa mọi vi phạm thật thay vì thêm miễn trừ.
- [x] S2 (ac-2): `src/core/workflow/init-task.ts` và `src/commands/workflow-handlers.ts`: lệnh/input mặc định từ `verify-plan`, validate `--mode` (lỗi khi không phải `lite|full`), slug không kết thúc bằng `-`, thời gian qua `src/utils/clock.ts`, `--input` tách dấu phẩy giống `--set-check`; test trong `init-task.test.ts` và `workflow-handlers.test.ts`.
- [x] S3 (ac-9): `behavior-snapshot.test.ts` thất bại khi `HARNIX_UPDATE_GOLDEN` đặt trong CI; nâng `BASELINE` trong `test-structure.test.ts` lên mức hiện tại; sửa lý do miễn trừ `src/index.ts` và comment `release-v2` trong `eslint.config.mjs` (không thêm miễn trừ).
- [x] S4 (ac-4): sửa số platform thành 6 ở `src/cli-workflow-commands.ts:133`, `src/cli-program.ts:24`, `src/core/global/uninstall.ts:255`, `README.md:172`, `test/README.md:11`, `docs/HARNIX_PRD.md` (124, 126, 129, 136, 304, 336), `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` (5, 10, 143, 177, 402-406), `docs/UPSTREAM_MAPPING.md:23`, thêm `docs/IMPLEMENTATION_PLAN.md` (102, 503, 601) và `src/commands/update.ts:110` nếu sai; RED: mở rộng `test/unit/docs/supported-platforms.test.ts` kiểm các danh sách cờ/help/thông báo.
- [x] S5 (ac-5): căn quy tắc Full/Epic dừng ở `ready`/`await` giữa `HARNIX_PRD.md` (~402) và `HARNIX_WORKFLOW.md` (23, 150, 304); help `status --summary` ghi dưới 80 token; `schema.ts` transports thêm `--init`, `--preflight`, `--snapshot`, `--inspect`; `evidence.md` sửa `evidence-expired` chỉ legacy, thư mục bỏ qua có `__pycache__` và quy tắc `.git`/marker; `test/README.md` sàn coverage 95/95/98.6/89; `docs/prompts/*` cập nhật hoặc đánh dấu lịch sử (bỏ đường dẫn máy, sáu platform). Cập nhật golden schema nếu `--schema` đổi (sinh lại có kiểm soát, không dùng để ép refactor).
- [x] S6 (ac-3): `src/skills/harnix-implement/SKILL.md` và `harnix-plan/SKILL.md` bỏ `pnpm format`/`pnpm lint`/`pnpm version:sync` cứng và dòng `**Verifies:**` (thay bằng lệnh từ `verify-plan`/`project-facts`); `references/replan.md` thêm `--replace-check` và quy tắc bản thay khác `command|inputs|cwd`; `references/ready-review.md` nêu suite check chạy lệnh test dự án; nâng version skill nếu `skill-sources` yêu cầu.
- [x] S7 (ac-8): thêm `src/skills/harnix-plan/references/multi-repo.md` (khi nào cần `cwd`, `verify-plan --recursive`, `--set-check --cwd` cần `--reason` sau planning, chỉ `--run-check` không `--cwd`, ví dụ hai repo, lỗi thường gặp) và đăng ký trong `src/skills/catalog.ts`; `evidence.md` mô tả `--run-check` chỉ chạy đúng `command` trong đúng `cwd`, evidence không đề ngày tương lai, breaker `stop` với lối `--replace-check`; `harnix-debug` trỏ tới breaker; cookbook `src/templates/harnix/workflow.md` nhắc reference; chạy test catalog và instruction-budget.
- [x] S8 (ac-6): xóa tên repo khách hàng khỏi `CHANGELOG.md:11`; sau cùng chạy đúng một lần `pnpm version:sync 2.1.0 --summary <gộp epic> --kind changed` (một entry gộp gate xanh, đóng đường xanh giả, bảo toàn cấu hình global, state machine, bảo mật, tài liệu); `harnix doctor` trước/sau không tăng cảnh báo; chạy `pack:check` rồi `scan:release`.
- [x] S9 (ac-7): `pnpm format`, rồi `typecheck`, `lint`, `test` (coverage); nâng ngưỡng coverage nếu tăng.

## Checks

- `check-structure`: S1-S7 (vitest `test/workflow` + `test/unit`).
- `check-version`, `check-scan`: S8.
- `check-typecheck`, `check-lint`, `check-suite`: S9.

## Ghi chú thực thi

- Trước S1: `check-scan` đã fail hai lần ở baseline do môi trường (thiếu `.artifacts`, `dist` cũ) nên breaker chặn. Ở bước đầu implement, thực hiện một replan có kiểm soát: `--replace-check check-scan check-scan-2 --reason ... --input ... --input "dist/**"` (đã được người dùng cho phép), rồi chạy `pnpm build` và `pnpm run pack:check` ngay trước `--run-check check-scan-2`.
