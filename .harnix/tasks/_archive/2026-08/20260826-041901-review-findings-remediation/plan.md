# Plan: Khắc phục finding review toàn diện

- [x] `CONTEXT-BOUNDARY` — Viết RED cho malicious path/omission rồi enforce path validation và framed bounded disclosure.
- [x] `LOCK-OWNERSHIP` — Chuyển sang canonical lock-directory + unique token, sửa setup/reconcile và đóng toàn bộ stale/release interleaving.
- [x] `DOCTOR-SCOPE` — Viết RED cho global-only fix rồi tách project/global mutation.
- [x] `WORKFLOW-INVARIANTS` — Viết RED cho v1 creation, mode downgrade, extra fields và dangling pointer rồi fail closed.
- [x] `CLI-HOOK-PROTOCOL` — Viết RED cho canonical fast path, JSON errors, setup exit và upgrade lookup rồi sửa CLI/release scanner.
- [x] `DOCS-RELEASE` — Đồng bộ docs, version 1.0.12, CHANGELOG và chạy full acceptance/release verification.

### Slice `CONTEXT-BOUNDARY`

Criteria: `ac-context-boundary`
Checks: `context-security`
Paths: `src/utils/paths.ts` `src/core/context/context.ts` `src/commands/internal-context.ts` `test/unit/paths.test.ts` `test/unit/context.test.ts` `test/workflow/internal-context.test.ts` `test/safety/path-boundaries.test.ts`

Thêm regression cho C0/C1 và Unicode line separators, disclosure khi không có excerpt, cap rất nhỏ và payload của ba platform; sau RED, serialize path và đặt disclosure trước closing marker trong cùng budget.

### Slice `LOCK-OWNERSHIP`

Criteria: `ac-lock-ownership`
Checks: `lock-ownership` `lock-directory-integration`
Paths: `src/utils/file-lock.ts` `src/commands/setup.ts` `src/utils/global-managed-files.ts` `test/unit/file-lock.test.ts` `test/unit/global-managed-files.test.ts` `test/platform/setup.test.ts` `test/integration/global-lifecycle.test.ts`

Tạo deterministic interleaving nơi replacement xuất hiện cả sau stale inspection lẫn sau final token read. Dùng `mkdir(..., { recursive: false })` cho candidate directory, ghi unique token record, chỉ công nhận owner khi token là entry duy nhất; reclaim/release chỉ unlink exact token rồi `rmdir` không recursive. Cập nhật setup/root reconciliation để chứng minh exact token ownership, preserve legacy file lock fail-closed và không xóa replacement.

### Slice `DOCTOR-SCOPE`

Criteria: `ac-doctor-scope`
Checks: `doctor-global-scope`
Paths: `src/commands/doctor.ts` `src/cli-program.ts` `test/integration/doctor.test.ts` `test/integration/cli.test.ts`

Tạo fake project/home regression cho repo-map bị thiếu và global drift, rồi branch repair theo flag để `--fix --global` không gọi project update.

### Slice `WORKFLOW-INVARIANTS`

Criteria: `ac-workflow-invariants`
Checks: `workflow-invariants`
Paths: `src/commands/internal-workflow.ts` `src/core/tasks/task.ts` `test/unit/task-state.test.ts` `test/workflow/internal-workflow.test.ts` `test/workflow/cli-contract.test.ts`

Thêm RED cho new v1 save, Full-to-Lite transition, unknown top-level/nested keys và dangling pointer; enforce exact allowlists, v2-only creation, monotonic mode và typed invalid-state failure trong khi vẫn đọc exact historical v1.

### Slice `CLI-HOOK-PROTOCOL`

Criteria: `ac-cli-contract` `ac-hook-fast-path`
Checks: `cli-hook-protocol`
Paths: `src/cli.ts` `src/cli-program.ts` `src/commands/upgrade.ts` `scripts/scan-release.mjs` `test/unit/cli-fast-path.test.ts` `test/integration/cli.test.ts` `test/integration/upgrade.test.ts` `test/workflow/cli-contract.test.ts` `test/safety/release-scanner.test.ts`

Đổi fast-path recognizer và benchmark sang canonical command, reject legacy alias, thêm PublicCliErrorV1 redacted envelope, map actionable setup thành exit 1 và wire optional available-version lookup với `null` cho offline unknown.

### Slice `DOCS-RELEASE`

Criteria: `ac-docs-release` `ac-cli-contract` `ac-context-boundary` `ac-doctor-scope` `ac-hook-fast-path` `ac-lock-ownership` `ac-workflow-invariants`
Checks: `acceptance-suite` `lock-protocol-docs` `release-gates` `self-host-version-sync` `static-quality` `version-docs-sync`
Paths: `.harnix/.template-hashes.json` `README.md` `docs/HARNIX_PRD.md` `docs/HARNIX_WORKFLOW.md` `docs/IMPLEMENTATION_PLAN.md` `package.json` `CHANGELOG.md` `scripts/version-sync.mjs` `scripts/smoke-tarball.mjs` `scripts/measure-footprint.mjs` `scripts/scan-release.mjs` `src/skills` `test/unit/version-sync.test.ts`

Cập nhật frozen semantics và lỗi docs drift, tăng patch version theo project rule, đồng bộ canonical skills cùng self-host generator metadata, rồi chạy compliance review trước quality/security và exact acceptance sequence trên dependency state sạch. Release scripts phải hiểu đúng actionable setup exit `1` và vẫn validate JSON/readiness/stderr thay vì bỏ qua non-zero status.
