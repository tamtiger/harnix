# Plan — Phục hồi task và giải thích context/check freshness

- [x] `RESEARCH-CURRENT` — Khảo sát current primary mechanisms, usage signals và license/ref.
- [x] `GAP-DECISION` — Tái hiện ba local gaps, chấm hard gate và loại candidate vượt boundary.
- [x] `CONTRACT-READY` — Khóa public schemas, safety/privacy bounds, ownership và RED checks.
- [x] `TASK-RESUME` — Triển khai exact unfinished-task pointer recovery bằng TDD.
- [x] `CONTEXT-REPORT` — Tách shared effective selector và triển khai metadata-only report bằng TDD.
- [x] `CHECKS-REPORT` — Triển khai required-check freshness explanation bằng TDD.
- [x] `DOCS-PROVENANCE` — Đồng bộ provenance, canonical docs, README, CHANGELOG và patch version.
- [x] `REVIEW-RELEASE` — Review hai tầng, fresh full gates và finish task.

### Slice `RESEARCH-CURRENT`

Criteria: `ac-current-research`

Checks: `research-decision-quality`

Paths: `.harnix/tasks/20260826-154348-harness-feature-expansion/research/next-capability-mechanisms.md`, `docs/HARNESS_RESEARCH.md`, `docs/UPSTREAM_BASELINE.md`

Artifact ghi material unknown, local facts, current source registry, real-usage signals, immutable refs/licenses, facts/inferences, weighted matrix, decisions và remaining uncertainty. Research chỉ quyết định mechanism; không sửa production.

### Slice `GAP-DECISION`

Criteria: `ac-current-research`, `ac-product-boundaries`

Checks: `research-decision-quality`, `selected-feature-acceptance`

Paths: `.harnix/tasks/20260826-154348-harness-feature-expansion/research/next-capability-mechanisms.md`, `src/cli-program.ts`, `src/core/context/context.ts`, `src/core/tasks/task-index.ts`, `src/core/verification/input-freshness.ts`

Giữ ba candidate vượt hard gate; reject transcript/session store, Git rewind, daemon notification, automatic model-context ownership và fuzzy task-body indexing.

### Slice `CONTRACT-READY`

Criteria: `ac-checks-report`, `ac-context-report`, `ac-delivered-value`, `ac-product-boundaries`, `ac-task-resume`

Checks: `checks-report-contract`, `context-report-contract`, `selected-feature-acceptance`, `static-quality`, `task-resume-contract`

Paths: `.harnix/tasks/20260826-154348-harness-feature-expansion/design.md`, `.harnix/tasks/20260826-154348-harness-feature-expansion/plan.md`, `.harnix/tasks/20260826-154348-harness-feature-expansion/prd.md`, `src/cli-program.ts`

Self-review xác nhận schema, enum, bounds, no-active/collision/corruption semantics, shared ownership và privacy exclusions đã quyết định; dirty user changes luôn được preserve.

### Slice `TASK-RESUME`

Criteria: `ac-delivered-value`, `ac-product-boundaries`, `ac-task-resume`

Checks: `task-resume-contract`

Paths: `src/cli-program.ts`, `src/commands/resume.ts`, `src/core/tasks/task-resume.ts`, `test/integration/resume.test.ts`, `test/unit/task-resume.test.ts`

RED public/core behavior cho absent/same/different/invalid pointer, missing/malformed/oversized/terminal candidate và dry-run; GREEN bằng validated bounded reads cùng atomic pointer primitive; refactor khi focused suite xanh.

### Slice `CONTEXT-REPORT`

Criteria: `ac-context-report`, `ac-delivered-value`, `ac-product-boundaries`

Checks: `context-report-contract`

Paths: `src/cli-program.ts`, `src/commands/context-report.ts`, `src/commands/internal-context.ts`, `src/core/context/effective-context.ts`, `test/integration/context-report.test.ts`, `test/unit/effective-context.test.ts`, `test/workflow/internal-context.test.ts`

RED parity/bounds/privacy/no-write cases; GREEN bằng một effective builder dùng chung cho hook và report, rồi giữ nguyên platform payload regression.

### Slice `CHECKS-REPORT`

Criteria: `ac-checks-report`, `ac-delivered-value`, `ac-product-boundaries`

Checks: `checks-report-contract`

Paths: `src/cli-program.ts`, `src/commands/checks.ts`, `src/core/status.ts`, `src/core/verification/check-report.ts`, `src/core/verification/input-freshness.ts`, `test/integration/checks.test.ts`, `test/unit/check-report.test.ts`

RED evidence/snapshot matrix, path diff, ordering/truncation/privacy/no-write; GREEN bằng structured inspector dùng lại trong status để state classification không drift.

### Slice `DOCS-PROVENANCE`

Criteria: `ac-provenance`, `ac-quality-release`

Checks: `provenance-completeness`, `static-quality`

Paths: `CHANGELOG.md`, `README.md`, `docs/HARNESS_FEATURE_PROVENANCE.json`, `docs/HARNESS_RESEARCH.md`, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/UPSTREAM_MAPPING.md`, `package.json`, `test/workflow/provenance.test.ts`

Dùng documented TDD exception cho docs/version/provenance wiring vì không đổi runtime behavior; alternate verification là provenance regression, static gates, version sync, docs/source scan và tarball checks.

### Slice `REVIEW-RELEASE`

Criteria: `ac-checks-report`, `ac-context-report`, `ac-delivered-value`, `ac-product-boundaries`, `ac-provenance`, `ac-quality-release`, `ac-task-resume`

Checks: `checks-report-contract`, `context-report-contract`, `provenance-completeness`, `release-gates`, `selected-feature-acceptance`, `static-quality`, `task-resume-contract`

Paths: `CHANGELOG.md`, `README.md`, `docs`, `package.json`, `scripts`, `src`, `test`

Review compliance trước quality/security/maintainability; snapshot từng required check trước command, append cả fail/pass evidence, snapshot lại trước persistence và chỉ chuyển finishing khi audit completion pass.



