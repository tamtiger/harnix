# Product impact and so-what analysis

Evaluate the real-world value, user benefit, and architectural impact of changes.

## 1. The so-what test

Before concluding verification or closing a task, ask:
- **So what?** What concrete capability does the user gain, or what specific failure mode is eliminated?
- Does this change solve the root problem, or does it merely shuffle abstractions?
- Are we delivering actual user value or cosmetic busywork?

## 2. Eliminate busywork and micro-optimizations

Reject premature optimizations and speculative abstractions that add cognitive overhead without measurable performance or correctness gains. If a change does not improve reliability, user experience, developer velocity, or maintainability, question its inclusion.

## 3. Verify observable outcomes

Tie completion claims directly to observable system outcomes:
- Is the new behavior demonstrated by an automated test?
- Is the error message clear and actionable when invalid inputs occur?
- Can the user immediately leverage the capability as documented?
