---
name: harnix-sequential-thinking
description: Use when analyzing complex architectural tradeoffs, multi-step refactoring paths or elusive edge-case hypotheses.
metadata:
  version: "2.16.0"
---

# Sequential thinking and dynamic hypothesis revision

Structure complex engineering reasoning through deliberate, iterative, and branching thoughts.

## Evidence and Rationale

Evidence source: `research/external-research.md` (§A AgentKit/Superpowers sequential reasoning model, §B cognitive chain decomposition, §C hypothesis revision protocols).
Complex software problems involving deep architectural invariants or subtle race conditions often derail when an agent jumps immediately to code changes based on an initial flawed premise. Sequential thinking forces explicit thought stepping, hypothesis verification, and course-correction before making irreversible modifications.

## When to use

- In planning: when evaluating multi-layer architectural decisions, large-scale migrations, or competing design tradeoffs.
- In debugging: when diagnosing intermittent failures, complex state corruptions, or elusive edge-case regressions.
- In verification: when tracing intricate data flows or analyzing potential concurrent race conditions.

## Thought protocol

Format dynamic reasoning steps using explicit progression headers:

```text
Thought X/Y (or Thought X):
- Status: EXPLORING | HYPOTHESIZING | REVISING | BRANCHING | CONVERGING
- Premise: <current working assumption>
- Analysis: <logical derivation or empirical observation>
- Verification: <code reference, test finding, or counter-example>
- Next step: <advance, revise previous thought, or explore alternate branch>
```

## Key principles

1. **Explicit hypothesis testing**:
   - Treat initial assumptions as unproven hypotheses.
   - Actively seek disconfirming evidence in the codebase before declaring a premise valid.

2. **Branching and backtracking (BRANCH)**:
   - When multiple valid architectural directions exist, explore Branch A and Branch B explicitly before picking a path.
   - If evidence invalidates Branch A, backtrack to the branching point and state why Branch B is chosen.

3. **Course correction (REVISION)**:
   - Never cling to an invalidated assumption.
   - When code evidence contradicts an earlier thought, explicitly emit a `REVISION` step: identify the flawed assumption, explain what was learned, and reset the reasoning chain.

4. **Convergence to verifiable action**:
   - End sequential reasoning with a concrete, testable outcome: a specific failing test, a minimal diff, or a clear architectural decision.
   - Avoid open-ended philosophizing; every thought sequence must terminate in actionable engineering steps.
