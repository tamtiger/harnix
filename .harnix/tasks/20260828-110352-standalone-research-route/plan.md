# Plan - Standalone research route

## Implementation checklist

- [x] `S1-ROUTING` — Viết RED và implement deterministic standalone research Bypass trước active-task routing.
- [x] `S2-PROFILE` — Viết RED và tách `harnix-research` thành standalone/task-scoped profiles, đồng bộ activation/templates.
- [x] `S3-DOCS-RELEASE` — Đồng bộ normative docs, self-hosted output, patch version/changelog và chạy focused/full gates.

### Slice `S1-ROUTING`

Criteria: `ac-standalone-research-route`
Checks: `focused-routing`
Paths: `src/core/workflow.ts`, `test/workflow/routing.test.ts`, `test/workflow/history-regressions.test.ts`

Thêm regression chứng minh research read-only route qua `harnix-research` với reason ổn định và vẫn thắng unrelated active task; sau RED mới mở rộng internal union/router tối thiểu.

### Slice `S2-PROFILE`

Criteria: `ac-research-profile`, `ac-managed-parity`, `ac-standalone-research-route`
Checks: `managed-parity`
Paths: `src/skills/harnix-research/SKILL.md`, `src/templates/harnix/activation.ts`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `test/unit/activation-instructions.test.ts`, `test/workflow/skill-sources.test.ts`, `test/workflow/templates.test.ts`, `test/platform/global-adapters.test.ts`

Thêm assertions profile/parity trước, rồi chỉnh canonical prose để standalone không đọc/persist task và task-scoped behavior không đổi; không preload hoặc tạo skill mới.

### Slice `S3-DOCS-RELEASE`

Criteria: `ac-managed-parity`, `ac-release-readiness`
Checks: `managed-parity`, `release-gate`
Paths: `.harnix/workflow.md`, `AGENTS.md`, `CHANGELOG.md`, `README.md`, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/HARNESS_RESEARCH.md`, `docs/UPSTREAM_MAPPING.md`, `package.json`, `pnpm-lock.yaml`

Ghi self-audit ownership, regenerate managed project output, bump patch/skill metadata đúng một lần và chạy compliance-before-quality cùng exact non-duplicative acceptance sequence.