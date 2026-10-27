# File review.md cho mỗi task

- **ID:** 20260916-222500-task-review-markdown
- **Mode:** full
- **Status:** completed/finishing

## Goal

Cho người dùng review task Harnix bằng cách mở một file markdown thuần, không phải chạy CLI command.

## Non-goals

- Không xoá hoặc đổi hành vi --human đã có.
- Không chèn nội dung rationale vào prd.md/plan.md vì hai file đó luôn nằm trong input hash của mọi required check.
- Không thêm review.md vào managed-file reconciliation.

## Acceptance criteria

- `ac-review-md-generated` (met): review.md tồn tại và phản ánh đúng title/status/checkpoint/goal/non-goals/acceptance criteria/evidence sau mỗi saveTask, không lộ absolute path.
- `ac-review-md-rationale` (met): review.md hiện đủ decisions/residualRisks khi có, bỏ qua khi không có.
- `ac-review-md-no-hash-impact` (met): Thêm/sửa decisions/residualRisks không đổi taskContractHash/inputDigest của check đã pass.
- `ac-docs-sync` (met): PRD và IMPLEMENTATION_PLAN mô tả review.md là artifact tham khảo tự sinh, không phải obligation.
- `ac-release-readiness` (met): Patch version và changelog cập nhật một lần trước verifying; exact acceptance sequence pass.

## Decisions

- **d1-separate-file** — review.md là file riêng, không chèn vào prd.md/plan.md.
  - _Why:_ prd.md/plan.md luôn nằm trong input hash của mọi required check cho Full task; chèn rationale vào đó sẽ làm stale evidence đang pass mỗi khi thêm một quyết định.
- **d2-hook-savetask** — Regenerate review.md ngay trong saveTask thay vì từng transport.
  - _Why:_ saveTask là điểm ghi task.json duy nhất mà mọi transport (--save/--transition/--evidence/--finish/--cancel) đều đi qua, nên hook ở đây đảm bảo đồng bộ tự động.

## Evidence

- `focused-review-md` — pass (2026-09-16T13:46:03.761Z): 37 test pass: review.md sinh đúng title/status/goal/non-goals/acceptance criteria/evidence, hiện decisions/residualRisks kèm rationale/severity khi có và bỏ qua khi không, regenerate đúng nội dung mới sau save thứ hai, không lộ absolute path, và không đổi taskContractHash/inputDigest khi chỉ thêm rationale.
- `docs-release-gate` — pass (2026-09-16T13:46:04.084Z): Toàn bộ exact acceptance sequence exit 0: build, lint, typecheck, test:acceptance (590 pass, 1 skipped), pack:check, smoke:tarball, measure:init, measure:footprint, scan:release, git diff --check. PRD/IMPLEMENTATION_PLAN/README mô tả review.md là artifact tham khảo tự sinh; sửa luôn hai chỗ còn sót 'đúng ba platform' từ task Claude Code trước.
