# Docs Consistency Refactor v2

## Outcome

Bring all Harnix docs to consistent state with actual implementation (4 platforms, 16 commands), expand orchestrator research landscape, fix structural defect in IMPLEMENTATION_PLAN.md.

## In-scope

Fix Claude Code naming drift in 7+ locations, fix IMPLEMENTATION_PLAN.md section 4, PRD section 17, add Claude Code research, ecosystem positioning, update CHANGELOG.

## Out-of-scope

Src code changes, new platforms, contract semantic changes.

## Acceptance Criteria

### AC `ac-platform-naming`

All docs mention 4 platforms.
**Verifies:** check-platform-grep

### AC `ac-impl-plan-structure`

Section 4 continuous, 4.4A intact.
**Verifies:** check-impl-numbering

### AC `ac-command-count`

PRD says sixteen public commands.
**Verifies:** check-command-count

### AC `ac-claude-research`

HARNESS_RESEARCH.md Claude Code section exists.
**Verifies:** check-claude-section

### AC `ac-ecosystem-positioning`

Ecosystem positioning section exists.
**Verifies:** check-ecosystem-section

### AC `ac-pkg-desc`

package.json description.
**Verifies:** check-pkg-desc

### AC `ac-build-pass`

Build pass.
**Verifies:** check-build

### AC `ac-no-contract-change`

No semantic change.
**Verifies:** check-no-semantic-change

### AC `ac-changelog`

CHANGELOG updated.
**Verifies:** check-changelog

### AC `ac-cross-doc-audit`

Zero remnants.
**Verifies:** check-cross-doc-remnants

### AC `ac-deferred-mcp`

Deferred MCP note.
**Verifies:** check-deferred

### AC `ac-rejected-update`

Rejected update.
**Verifies:** check-rejected

### AC `ac-upstream-mapping`

Upstream mapping.
**Verifies:** check-upstream