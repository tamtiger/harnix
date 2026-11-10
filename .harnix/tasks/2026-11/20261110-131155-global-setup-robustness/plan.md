# Plan: Làm bền cơ chế setup và update global

## Execution Slices

- [x] [chk-focus] Slice 1 (ac-1): `applyTransaction` ghi nhớ thư mục tổ tiên chưa tồn tại của các file tạo mới và `rmdir` chúng (sâu trước) khi rollback; test fault-injection ở lần ghi thứ hai.
- [x] [chk-focus] Slice 2 (ac-2): khóa hợp đồng Phase 6 bằng test: file chưa có manifest luôn là collision dù nội dung bằng desired; không thêm đường adopt (quyết định có lý do trong task).
- [x] [chk-focus] Slice 3 (ac-3): `markUnownedSkillUnitCollisions` xét mọi file dưới `skills/harnix-*/`, trừ unit đã có entry trong manifest; test `references/`.
- [x] [chk-focus] Slice 4 (ac-4): `toml-guard` bắt `UserPromptSubmit.x` và key có ngoặc kép; test.
- [x] [chk-focus] Slice 5 (ac-5): `releaseGlobalLocks` dùng `allSettled`; `installedPlatforms` cô lập lỗi root từng platform; test.
- [x] [chk-focus] Slice 6 (ac-6): helper kiểm `environment` trong test cho setup, update, uninstall (doctor global ghi vào residual risk: cần mã finding mới kèm fixture); test.
- [x] [chk-suite] Slice 7: format, lint, typecheck, toàn suite; bump `2.32.0-dev.4` và CHANGELOG.

## Guardrails & Invariants

- Không đổi schema manifest sidecar, thứ tự khóa hay quyết định bảo toàn nội dung người dùng.
- Test dùng home giả và `environment` tiêm; không chạm home thật.

## Verification Matrix

| Check | Chứng minh | Tiêu chí |
| --- | --- | --- |
| chk-focus | test platform và unit của global, managed, platform | ac-1 … ac-6 |
| chk-suite | toàn suite | ac-1 … ac-6 |
