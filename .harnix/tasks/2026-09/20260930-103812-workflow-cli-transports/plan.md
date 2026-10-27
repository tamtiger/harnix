# Plan — Transport CLI cho workflow

## Checklist

- [x] S1 — Tách wiring `workflow` khỏi `cli-program.ts` sang `src/commands/workflow-command.ts` (không đổi hành vi) và thêm `briefTask` + `--brief`.
- [x] S2 — `--evidence` dạng flag: `src/core/workflow/evidence-flags.ts`.
- [x] S3 — `--criterion --met`: `src/core/workflow/criterion.ts`.
- [x] S4 — `--migrate`: `src/core/workflow/migrate-v3.ts`.
- [x] S5 — `--run-check`: `src/core/workflow/run-check.ts` và runner mặc định ở `src/utils/check-runner.ts`.
- [x] S6 — `workflow --schema`, PRD, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` §4; `pnpm version:sync` một lần (patch, kind added); `pnpm format`.

## Cách làm và cách kiểm

Mỗi slice: RED (test fail đúng lý do) rồi GREEN tối thiểu rồi refactor. Mọi transport đi qua `saveWorkflow` nên giữ toàn bộ guard (khóa, digest recompute, bất biến obligation). Mỗi file src ≤ 300 dòng code, mỗi file test ≤ 400 dòng, import dùng alias `src/...` và `test/...`.

- S1: `test/integration/commands/workflow-command.test.ts` chạy `runCli` với `workflowInput` inject; kiểm output cũ không đổi (test hiện có và golden snapshot giữ nguyên) và `--brief` trả đúng bốn field. `test/unit/core/workflow/brief.test.ts`.
- S2: `evidence-flags.test.ts`: id tăng dần, `recordedAt` từ clock inject, digest tự tính cho v3 required, thiếu `--exit-code` với pass thì từ chối, `--digest` lệch thì save từ chối, task legacy chưa migrate bị từ chối như cũ.
- S3: `criterion.test.ts`: mặc định lấy pass tươi, từ chối khi pass stale/thiếu, từ chối id không tồn tại, `--evidence-ids` phải thuộc check bao phủ, nhiều criterion một lần.
- S4: `migrate-v3.test.ts`: v2 với inputs hợp lệ migrate một lệnh; v2 inputs rỗng sau khi bỏ token và v1 cần `checks` override, thiếu thì lỗi liệt kê; evidence cuối đúng chuỗi `task-schema-to-v3`; status/checkpoint/criteria/prior evidence giữ nguyên; từ chối v3, completed, cancelled, blocked.
- S5: `run-check.test.ts` với runner giả: exit 0 pass, exit 1 fail có digest, digest đổi giữa hai snapshot thì không ghi evidence, `outputTail` bị cắt 2000 ký tự và không nằm trong task, executable nhận mảng đối số nguyên vẹn. `test/unit/utils/check-runner.test.ts` cho runner mặc định (spawn node, không shell).
- S6: kiểm `--schema` liệt kê transport mới; cập nhật docs; version và CHANGELOG một lần.

## Bảo toàn

`test/workflow/behavior-snapshot.golden.json` không được regenerate. Dữ liệu `.harnix` cũ vẫn đọc được. Không commit.
