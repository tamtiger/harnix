# Plan — Sửa suite gate và input digest

## Checklist

- [x] S1 — RED+GREEN suite gate: nhận diện test/source theo segment, thông báo lỗi bỏ nhắc `scope`, `docs/app/**` không còn false positive.
- [x] S2 — RED+GREEN finish gate dùng `selectLatestEvidence` cho suite check.
- [x] S3 — RED+GREEN digest: ignore theo marker, khớp không phân biệt hoa thường, nhận diện input theo segment (bỏ tiền tố `!`), cache marker theo thư mục.
- [x] S4 — RED+GREEN băm song song có giới hạn 16, kết quả giống tuần tự; test hai snapshot liên tiếp ổn định.
- [x] S5 — Cập nhật `docs/HARNIX_WORKFLOW.md` (những gì đổi digest, luật gate) và `docs/IMPLEMENTATION_PLAN.md` nếu chạm contract; `pnpm version:sync` một lần (patch, kind fixed) cùng CHANGELOG; `pnpm format`.

## Cách làm và cách kiểm

- S1: sửa `coversSourceAndTest`, `matchesAnyPrefix`. Kiểm: `suite-gate.test.ts` gồm `Foo.Api/**`+`Foo.Api.Tests/**` (true), `src/**`+`test/**` (true), `docs/app/**`+`test/**` (false), `src/**` một mình (false), `**/*.cs` (false).
- S2: thay `task.evidence.find` ở `suite-gate.ts`. Kiểm: hai pass, cũ lệch còn mới khớp thì finish qua; mới lệch thì bị từ chối.
- S3: mở rộng test hiện có ở `input-digest.test.ts` (đã có bin/obj/.harnix) với `src/Binary/**`, `TestResults`, `Bin`, `build/Build.cs` không marker, `.harnix/tasks/<id>/plan.md` được khai báo.
- S4: hash bằng pool giới hạn, giữ thứ tự entries đã sort. Kiểm: digest song song = tuần tự trên cùng fixture; hai snapshot liên tiếp bằng nhau sau khi thêm file vào `bin/`.
- S5: docs và version. Không commit; trước commit trình diff và message chờ duyệt.

## Bảo toàn

Diff chưa commit ở `src/core/verification/input-digest.ts` và `test/unit/core/verification/input-digest.test.ts` là của người dùng: mở rộng chứ không revert.
