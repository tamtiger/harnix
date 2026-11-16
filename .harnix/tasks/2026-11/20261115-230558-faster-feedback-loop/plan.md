# Implementation Plan: Rút ngắn vòng phản hồi implement và verify của Harnix

## Execution Slices

- [x] [chk-timing] Slice 1 (RED rồi GREEN, ac-1): thêm `durationMs?: number` vào `EvidenceBase` ở `src/core/tasks/task-schema.ts`, nhận trong validator của evidence (số hữu hạn không âm, evidence cũ không có field vẫn hợp lệ) và truyền qua `appendEvidenceFlagsWorkflow`. Test ở spec của validator và của evidence-flags.
- [x] [chk-timing] Slice 2 (RED rồi GREEN, ac-1): `runCheckWorkflow` đo thời lượng quanh `runner` bằng đồng hồ đơn điệu (`now` tiêm được qua dependency), ghi vào evidence và trả `durationMs` trong `RunCheckResult`; `RanCheck` của `--run-checks` thêm `durationMs` cho cả pass và fail; `--brief` giữ gọn.
- [x] [chk-timing] Slice 3 (RED rồi GREEN, ac-2): trong `src/core/workflow/run-checks.ts` thêm hàm thuần sắp xếp (focused trước full; trong cùng scope theo `durationMs` của evidence gần nhất, chưa có thì giữ thứ tự khai báo, sort ổn định); file mới `check-order.ts` nếu `run-checks.ts` tiến gần 300 dòng. Test: ngắn trước, không có thời lượng giữ nguyên, focused vẫn trước, dừng ở fail đầu tiên.
- [x] [chk-timing] Slice 4 (RED rồi GREEN, ac-3): file mới `src/core/workflow/init-default-inputs.ts` phát hiện cây nguồn và cây test ở gốc (hoặc ở package `--cwd`) và trả input mặc định; nối vào `resolveCheckTarget` ở `init-task.ts` (người dùng ghi đè bằng `--input`). Test: có cả hai cây thu hẹp và cộng manifest, thiếu một cây giữ `**`, kết quả qua `coversSourceAndTest`.
- [x] [chk-gates] Slice 5 (ac-4): cập nhật `src/core/workflow/schema.ts` (mô tả `--run-check`, `--run-checks`, `--init`), chạy `HARNIX_UPDATE_GOLDEN=1` chỉ cho chuỗi và field mới, `docs/HARNIX_WORKFLOW.md`, `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md` (mục evidence), `AGENTS.md`, template `workflow.md` (nếu còn trần token) rồi `pnpm selfhost:sync`; kiểm `cli-contract`, `architecture`, `instruction-budget`.
- [x] [check-suite] Slice 6: phát hành patch 2.33.2 bằng `pnpm version:sync 2.33.2 --summary "<tóm tắt>" --kind changed` một lần và cập nhật cùng mục `CHANGELOG.md`; thứ tự kiểm: `pnpm format`, `pnpm typecheck`, `pnpm lint`, rồi `harnix workflow --run-checks --brief` một lần (đã dùng chính thứ tự mới của slice 3).

## Guardrails & Invariants

- Evidence cũ (không có `durationMs`) vẫn hợp lệ và digest freshness không đổi; không check nào bị bỏ khỏi tập phải chạy vì thời lượng.
- Chỉ sắp xếp lại trong cùng scope: focused luôn trước full, không đổi quy tắc breaker và suite gate.
- Input mặc định chỉ thu hẹp khi có cả cây nguồn và cây test; kết quả phải qua `coversSourceAndTest`.
- Không `node:fs` mới trong `src/commands`; logic mới nằm ở `src/core/workflow`; sau mỗi lần sửa `src/` chạy `pnpm typecheck` và `pnpm lint` trước test.
- Golden chỉ cập nhật cho chuỗi mới; không nâng trần token.

## Verification Matrix

| Check | Phủ | Lệnh | Khi nào |
| --- | --- | --- | --- |
| `chk-timing` | ac-1, ac-2, ac-3 | `pnpm exec vitest run test/unit/core/workflow test/unit/utils test/unit/core/tasks` | sau mỗi slice 1 đến 4 |
| `chk-gates` | ac-1, ac-4 | `pnpm run test:gates` | sau slice 5 |
| `check-suite` | ac-1, ac-2, ac-3, ac-4 | `pnpm run test` | một lần ở cuối, sau slice 6 |
