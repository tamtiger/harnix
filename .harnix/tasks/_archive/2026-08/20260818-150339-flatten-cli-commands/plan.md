# Plan — Chuẩn hóa CLI một command

## Checklist

- [x] Slice 1 — Thêm RED contract tests cho command một tầng và action-flag validation.
- [x] Slice 2 — Chuyển CLI registration sang `context`, `repo-map` action flags và `workflow` action flags.
- [x] Slice 3 — Chuyển global hook constants và lifecycle migration/tests sang `harnix context`.
- [x] Slice 4 — Cập nhật skills, templates, docs, scripts và self-host workflow references.
- [x] Slice 5 — Đồng bộ release `1.0.7`, chạy focused compliance/quality review.
- [x] Slice 6 — Chạy exact acceptance, lưu fresh evidence và finish task.

## Slice 1 — RED command contract

Cập nhật `test/workflow/cli-contract.test.ts`, CLI/integration workflow và repo-map tests để yêu cầu một command token, mutually-exclusive flags, `--snapshot --check` dependency và rejection của nested syntax cũ. RED phải thất bại vì CLI hiện còn parent/subcommand.

## Slice 2 — CLI implementation

Refactor `src/cli-program.ts`: top-level hidden `context`; một `repo-map` handler phân nhánh query/refresh; một hidden `workflow` handler phân nhánh bốn action flags. Dùng validation deterministic, không thay implementation service hoặc JSON schemas.

## Slice 3 — Global hook migration

Đổi ba adapter constants sang `harnix context --platform <id>`. Mở rộng setup/update/doctor/uninstall regression fixtures để chứng minh unchanged old fragment được reconcile và modified fragment được preserve.

## Slice 4 — Generated contracts

Thay toàn bộ command references trong `src/skills`, `src/templates`, docs, README, scripts và tests. Chạy self-host update để `.harnix/workflow.md` đồng bộ; không sửa task state trực tiếp.

## Slice 5 — Release và review

Bump patch bằng `pnpm version:sync`, cập nhật CHANGELOG và package metadata. Review compliance trước quality/security; kiểm tra không còn nested command literal ngoại trừ lịch sử/migration fixture có chủ đích.

## Slice 6 — Acceptance và finish

Chạy exact acceptance sequence, snapshot trước/sau từng required check, lưu pass evidence với digest, chuyển `verifying/finishing`, rồi dùng workflow finish command mới.