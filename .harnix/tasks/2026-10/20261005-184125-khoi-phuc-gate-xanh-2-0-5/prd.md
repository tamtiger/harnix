# PRD — Khôi phục gate xanh cho HEAD 2.0.4

Thuộc epic `20261005-184125-harnix-hardening-2-0-5` (task 1/6). Nguồn: báo cáo review 2.0.4, finding R-001 và R-013.

## Vấn đề

HEAD `242df07` (2.0.4) không qua `pnpm run typecheck` (exit 2, 15 lỗi, 2 lỗi trong `src`), `pnpm run lint` (13 file sai format, `src/core/workflow/batch.ts` vượt `max-lines` 300 và complexity 20) và `pnpm run test` (1362 test pass nhưng coverage 94.44% lines, 88.32% branches, dưới sàn 94.7 và 88.4). Không gate nào trong chuỗi acceptance §11 chạy coverage, nên lỗi này không bị chặn.

## Mục tiêu

Mọi gate chất lượng xanh trên cây mã cuối cùng, và chuỗi acceptance thật sự thực thi sàn coverage.

## Không thuộc phạm vi

- Không đổi hành vi runtime ngoài sửa kiểu và tách module (tách phải bảo toàn hành vi, golden snapshot không được sinh lại).
- Không hạ sàn coverage, không thêm miễn trừ vào `eslint.config.mjs`.
- Các lỗi hành vi (xanh giả, state machine, global config...) thuộc các task sau của epic.

## Tiêu chí chấp nhận

- **ac-1** `pnpm run typecheck` exit 0, sửa bằng thu hẹp kiểu đúng nghĩa, không `any`.
- **ac-2** `batch.ts` và mọi file `src` ≤ 300 dòng code, complexity ≤ 20; `pnpm run format:check` sạch.
- **ac-3** Coverage ≥ sàn hiện tại nhờ test thật cho `ready.ts`, `save-files.ts` và các module mới tách.
- **ac-4** `docs/IMPLEMENTATION_PLAN.md` §11 và `test:acceptance` chạy `pnpm run test` có coverage, có test cấu trúc bảo vệ.
- **ac-5** Cổng `typecheck`, `lint`, `test` đều exit 0 trên cây mã cuối.

## Rủi ro

- Tách `batch.ts` có thể đổi hành vi: dùng test hiện có làm oracle, không regenerate `test/workflow/behavior-snapshot.golden.json`.
- Sửa kiểu trong test có thể che lỗi thật: ưu tiên type guard/assert hẹp kiểu thay vì ép kiểu.
