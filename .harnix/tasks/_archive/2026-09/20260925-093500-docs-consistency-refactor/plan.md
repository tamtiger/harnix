# Implementation Plan v2

## Checklist

- [ ] `S1` — Fix Claude Code naming drift
- [ ] `S2` — Fix section 4 structural defect
- [ ] `S3` — Fix command count
- [ ] `S4` — Add Claude Code research section
- [ ] `S5` — Add ecosystem positioning section
- [ ] `S6` — Cross-doc audit
- [ ] `S7` — CHANGELOG update
- [ ] `S8` — Deferred & Rejected updates
- [ ] `S9` — Upstream mapping updates

### Slice `S1`

Criteria: `ac-platform-naming`, `ac-pkg-desc`
Checks: `check-platform-grep`, `check-pkg-desc`
Paths: `docs/HARNESS_RESEARCH.md`, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/UPSTREAM_MAPPING.md`, `package.json`

### Slice `S2`

Criteria: `ac-impl-plan-structure`, `ac-no-contract-change`
Checks: `check-impl-numbering`, `check-no-semantic-change`
Paths: `docs/IMPLEMENTATION_PLAN.md`

### Slice `S3`

Criteria: `ac-command-count`
Checks: `check-command-count`
Paths: `docs/HARNIX_PRD.md`

### Slice `S4`

Criteria: `ac-claude-research`
Checks: `check-claude-section`
Paths: `docs/HARNESS_RESEARCH.md`

### Slice `S5`

Criteria: `ac-ecosystem-positioning`
Checks: `check-ecosystem-section`
Paths: `docs/HARNESS_RESEARCH.md`

### Slice `S6`

Criteria: `ac-cross-doc-audit`, `ac-build-pass`
Checks: `check-cross-doc-remnants`, `check-build`
Paths: `docs/HARNESS_RESEARCH.md`, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/UPSTREAM_MAPPING.md`, `package.json`, `src/**/*.ts`, `tsconfig.json`

### Slice `S7`

Criteria: `ac-changelog`
Checks: `check-changelog`
Paths: `CHANGELOG.md`

### Slice `S8`

Criteria: `ac-deferred-mcp`, `ac-rejected-update`
Checks: `check-deferred`, `check-rejected`
Paths: `docs/HARNESS_RESEARCH.md`

### Slice `S9`

Criteria: `ac-upstream-mapping`
Checks: `check-upstream`
Paths: `docs/UPSTREAM_MAPPING.md`