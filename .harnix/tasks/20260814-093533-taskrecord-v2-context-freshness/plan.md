# Kế hoạch triển khai C1–C3

- [x] I1 — RED/GREEN bộ kiểm tra context drift và hidden workflow projection.
- [x] I2 — RED/GREEN routing skill Continue qua `replan` khi context stale.
- [x] I3 — RED/GREEN TaskRecord v2, coverage graph, completion intersection và tương thích v1.
- [x] I4 — RED/GREEN migration v1→v2 rõ ràng, bất biến required-check và Doctor diagnostic.
- [x] I5 — RED/GREEN canonical input snapshot, hidden snapshot command, sidecar race check và finish freshness.
- [x] I6 — Đồng bộ docs/skills/templates/provenance, tăng patch version và cập nhật changelog.
- [x] I7 — Compliance review, quality/security review và acceptance mục 11.

## Thứ tự triển khai

1. C1: thêm type/hàm `inspectContextDrift`, fixture changed/missing/mixed/symlink và projection `contextDrift` luôn hiện diện.
2. C1 workflow: sửa nguồn skill Continue/Brainstorm và kiểm thử canonical để bắt buộc replan trước context reselection.
3. C2 schema: tách contract v1/v2, validate coverage graph và giữ exact v1 semantics.
4. C2 persistence/migration: khóa definition v2, chỉ cho phép v1→v2 ở `replan` với migration evidence xác định; Doctor chỉ báo.
5. C3 snapshot: module canonical hash/expansion, hidden snapshot operation, immutable sidecar, save-time race check và finish-time recomputation.
6. Đồng bộ tất cả frozen-contract docs, migration behavior, skills/templates và release metadata.
7. Chạy focused gates sau từng slice, rồi compliance → quality/security → acceptance đầy đủ.

## RED–GREEN

Mỗi slice hành vi phải có test mới thất bại đúng do thiếu contract trước khi sửa production. Docs/snapshot đồng bộ dùng ngoại lệ TDD có ghi nhận và được xác minh bằng exact parity, skill-source tests, build/typecheck cùng release scan.

## Bảo toàn worktree

Giữ nguyên toàn bộ thay đổi tiếng Việt và task/journal user-owned đang có. Không hoàn nguyên `.harnix/workflow.md` theo Git nếu chỉ khác line ending; self-host parity là bằng chứng chuẩn. Không commit hoặc thay đổi Git state.
