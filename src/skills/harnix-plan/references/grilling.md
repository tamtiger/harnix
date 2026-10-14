# Assumption grilling and requirement probing

Deep questioning technique to challenge implicit assumptions and clarify architectural boundaries during planning before committing to `ready`.

## When to use and strict boundaries

- **Use only in interactive sessions**: Apply in two-way user interactions when requirements are ambiguous, have multiple design branches, or carry high architectural risk.
- **Strictly never use**:
  - For **Bypass** tasks (lookups, explanations, small literal or docs-only edits).
  - In unattended / automation mode / CI runs.
  - When the existing codebase or repository documentation already answers the question.
- **No stray files**: Record all conclusions, architectural decisions, and decompositions directly in `task.json`, or the Harnix task's `prd.md`/`plan.md`. Never create stray design or glossary files at the workspace root (such as `GLOSSARY.md` or `ADR-*.md`).

## Questioning structure: Design Tree and Frontier

1. **Design Tree**:
   - Decompose the problem into a hierarchy of dependent decisions: Overall Architecture -> Contract/API Boundaries -> Data Model -> Error/Edge Handling -> Implementation Details.
   - Do not ask leaf-level questions when the tree trunk (core architectural decision) remains uncommitted.

2. **Frontier**:
   - Pinpoint the exact boundary where decisions remain open: distinguish what is already settled by the codebase or specifications from what genuinely needs user input.
   - Narrow the frontier after each answer; do not expand into speculative or open-ended hypotheticals.

3. **Batched rounds with recommendations**:
   When asking the user to unblock a design decision, batch related questions into structured rounds:
   - **At most one blocking question per round** to avoid overwhelming the user.
   - **Clear recommendation with rationale**: Always provide a concrete proposed option marked with an arrow:
     `-> <recommendation>`: State the recommended choice, technical rationale, and trade-offs.
   - **Standard question format**:
     - *Context*: Current frontier in the Design Tree.
     - *Options*: Viable paths (A, B, C).
     - *Recommendation*: `-> Recommendation: Choose [Option A] because [contract preservation / testability / backward compatibility].`
     - *Impact*: Effect on acceptance criteria or validation plan.

## Settling decisions

When the user responds or confirms an option:
1. Record the decision in the task record: `harnix workflow --add-decision <id> --text "<decision>" --rationale "<reason>"`.
2. Turn confirmed requirements into verifiable acceptance criteria: `harnix workflow --add-criterion --text "<criterion>"`.
3. Update `prd.md` and `plan.md` accordingly before proceeding to the `ready` gate.
