# Plan - File review.md cho mỗi task

## Implementation checklist

- [x] `S1-RENDER` — RED rồi implement `renderTaskReview` + hook vào `saveTask`.
- [ ] `S2-DOCS-RELEASE` — Đồng bộ docs, bump patch version, chạy exact acceptance sequence.

### Slice `S1-RENDER`

Criteria: `ac-review-md-generated`, `ac-review-md-rationale`, `ac-review-md-no-hash-impact`
Checks: `focused-review-md`
Paths: `src/core/tasks/task.ts`, `test/unit/task-state.test.ts`, `test/unit/verification-inputs.test.ts`

RED: task chưa có `decisions`/`residualRisks` -> `review.md` không có 2 mục đó; task có -> hiện đủ text/rationale/severity; không lộ absolute path; regenerate đúng nội dung mới sau save thứ hai. Sau đó implement `renderTaskReview` thuần và gọi trong `saveTask`.

### Slice `S2-DOCS-RELEASE`

Criteria: `ac-docs-sync`, `ac-release-readiness`
Checks: `docs-release-gate`
Paths: `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `README.md`, `CHANGELOG.md`, `package.json`

Mô tả `review.md` trong PRD/IMPLEMENTATION_PLAN như artifact tham khảo tự sinh; cập nhật README hướng người dùng mở file thay vì chạy lệnh; bump patch version và chạy exact acceptance sequence.

<!-- harnix:execution-notes:begin -->
<!-- harnix:execution-notes:end -->
