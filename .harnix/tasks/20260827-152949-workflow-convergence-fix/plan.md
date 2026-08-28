# Plan — Workflow convergence fix

## Implementation checklist

- [ ] `S1-ROUTING` — Thêm RED/GREEN cho latest-intent Bypass và hidden preflight bounded.
- [ ] `S2-CONTRACT` — Thêm RED/GREEN cho freeze-at-ready và audited replan supersede.
- [ ] `S3-FRESHNESS` — Thêm RED/GREEN cho snapshot v2 canonical planning, legacy v1 và save ordering.
- [ ] `S4-CONVERGENCE` — Thêm RED/GREEN cho v2 no-age expiry, evidence reuse và repeated-failure stop.
- [ ] `S5-GUIDANCE` — Tinh gọn activation/workflow/AGENTS và bảy stage skill theo stage boundary mới.
- [ ] `S6-CONTRACT-DOCS` — Đồng bộ normative docs, sourceId và exact acceptance sequence không duplicate.
- [ ] `S7-RELEASE` — Chuẩn bị patch release trước verifying và chạy focused cùng full fresh gates.

### Slice `S1-ROUTING`

Criteria: `ac-intent-routing`
Checks: `preflight-transport`, `freshness-convergence`
Paths: `src/core/workflow.ts`, `src/commands/internal-workflow.ts`, `src/cli-program.ts`, `test/workflow/routing.test.ts`, `test/workflow/internal-workflow.test.ts`, `test/integration/cli.test.ts`

Viết fixture fail khi active task hijack read-only intent và khi preflight lộ prose/ghi file; implement route ordering cùng metadata-only response.

### Slice `S2-CONTRACT`

Criteria: `ac-contract-replan`
Checks: `contract-replan`
Paths: `src/commands/internal-workflow.ts`, `src/core/tasks/task.ts`, `test/workflow/internal-workflow.test.ts`, `test/unit/task-state.test.ts`

Viết fixture planning edit, ready freeze và replan revision; implement bounded revision envelope, generated audit evidence và stale-proof pass preservation.

### Slice `S3-FRESHNESS`

Criteria: `ac-input-freshness`, `ac-verification-convergence`
Checks: `freshness-convergence`, `preflight-transport`
Paths: `src/core/verification/input-freshness.ts`, `src/commands/internal-workflow.ts`, `test/unit/verification-inputs.test.ts`, `test/workflow/internal-workflow.test.ts`

Viết vectors bookkeeping/semantic/malformed/mixed-version; implement discriminated snapshot và artifact override compute trước persistence.

### Slice `S4-CONVERGENCE`

Criteria: `ac-stage-guidance`, `ac-verification-convergence`
Checks: `freshness-convergence`
Paths: `src/core/verification/check-report.ts`, `src/core/status.ts`, `src/core/tasks/task-audit.ts`, `src/core/workflow.ts`, `test/unit/check-report.test.ts`, `test/unit/status.test.ts`, `test/unit/task-audit.test.ts`

Khóa v1/v2 clock semantics, cùng-check failure fingerprint và completion parity; không thêm unbounded state hay scheduler claim.

### Slice `S5-GUIDANCE`

Criteria: `ac-docs-release-policy`, `ac-managed-parity`, `ac-stage-guidance`
Checks: `managed-parity`
Paths: `AGENTS.md`, `src/templates/harnix/activation.ts`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `src/configurators/codex.ts`, `src/skills`, `test/workflow/skill-sources.test.ts`, `test/workflow/templates.test.ts`

Giữ target guard canonical nhưng chuyển pure conversation thành fast Bypass, dùng preflight cho scoped work, reuse fresh evidence, Low residual, scope gate và product-read-only finish.

### Slice `S6-CONTRACT-DOCS`

Criteria: `ac-docs-release-policy`, `ac-managed-parity`, `ac-release-readiness`
Checks: `managed-parity`, `release-gate`
Paths: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/HARNESS_RESEARCH.md`, `docs/UPSTREAM_MAPPING.md`, `src/templates/harnix/managed-workflow.ts`, `test`

Cập nhật contract/migration/compatibility, sửa sourceId thành `workflow`, bỏ một lượt all-suite trùng và giữ mọi suite/static/package/safety gate.

### Slice `S7-RELEASE`

Criteria: `ac-release-readiness`
Checks: `contract-replan`, `freshness-convergence`, `managed-parity`, `preflight-transport`, `release-gate`
Paths: `CHANGELOG.md`, `README.md`, `package.json`, `src/skills`, `.harnix/.template-hashes.json`

Hoàn tất checklist và release files trước entering verifying; sau đó chỉ chạy/reuse fresh checks, compliance review, quality/security review và hidden finish không sửa product input.